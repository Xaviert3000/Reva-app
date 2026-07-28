import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import http2 from 'node:http2'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/push/send
// Envía una notificación push a los dispositivos del usuario (APNs iOS + FCM
// Android), leyendo los tokens de `device_tokens`. Lo dispara el trigger de la
// BD (pg_net) al insertarse una fila en `notifications` (migración 034), o se
// puede llamar a mano con { record: { user_id, title, body } }.
//
// Auth: cabecera `x-push-secret` == PUSH_WEBHOOK_SECRET (si está configurada).
//
// ── Variables de entorno ────────────────────────────────────────────
//  PUSH_WEBHOOK_SECRET   secreto compartido con el trigger/webhook.
//  APNs:  APNS_KEY (.p8), APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID,
//         APNS_PRODUCTION ("true" en producción, "false" en desarrollo).
//  FCM:   FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY (del service account).
// ─────────────────────────────────────────────────────────────────────

interface Payload { record?: { user_id?: string; title?: string; body?: string }; user_id?: string; title?: string; body?: string }

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function POST(req: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET
  if (secret && req.headers.get('x-push-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await req.json().catch(() => ({}))) as Payload
  const record = payload.record ?? payload
  const userId = record.user_id
  const title = record.title || 'Reva'
  const body = record.body || ''
  if (!userId) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { data: tokens } = await admin
    .from('device_tokens')
    .select('token,platform')
    .eq('user_id', userId)

  const rows = tokens ?? []
  const ios = rows.filter(t => t.platform === 'ios').map(t => t.token as string)
  const android = rows.filter(t => t.platform === 'android').map(t => t.token as string)

  const pruned: string[] = []
  let apnsSent = 0
  let fcmSent = 0

  if (ios.length && apnsConfigured()) {
    const res = await sendApnsBatch(ios, title, body)
    apnsSent = res.sent
    pruned.push(...res.invalid)
  }
  if (android.length && fcmConfigured()) {
    const res = await sendFcmBatch(android, title, body)
    fcmSent = res.sent
    pruned.push(...res.invalid)
  }

  // Limpia tokens inválidos (dispositivos desinstalados / caducados).
  if (pruned.length) {
    await admin.from('device_tokens').delete().in('token', pruned)
  }

  return NextResponse.json({ apnsSent, fcmSent, pruned: pruned.length })
}

// ── APNs ────────────────────────────────────────────────────────────

function apnsConfigured(): boolean {
  return !!(process.env.APNS_KEY && process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_BUNDLE_ID)
}

function apnsJwt(): string {
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: process.env.APNS_KEY_ID }))
  const claims = b64url(JSON.stringify({ iss: process.env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) }))
  const input = `${header}.${claims}`
  const key = (process.env.APNS_KEY as string).replace(/\\n/g, '\n')
  const sig = crypto.sign('SHA256', Buffer.from(input), { key, dsaEncoding: 'ieee-p1363' })
  return `${input}.${b64url(sig)}`
}

async function sendApnsBatch(tokens: string[], title: string, body: string): Promise<{ sent: number; invalid: string[] }> {
  const host = process.env.APNS_PRODUCTION === 'true' ? 'https://api.push.apple.com' : 'https://api.sandbox.push.apple.com'
  const jwt = apnsJwt()
  const bundle = process.env.APNS_BUNDLE_ID as string
  const payload = JSON.stringify({ aps: { alert: { title, body }, sound: 'default' } })

  const client = http2.connect(host)
  const invalid: string[] = []
  let sent = 0

  try {
    await Promise.all(tokens.map(token => new Promise<void>(resolve => {
      const reqStream = client.request({
        ':method': 'POST',
        ':path': `/3/device/${token}`,
        'authorization': `bearer ${jwt}`,
        'apns-topic': bundle,
        'apns-push-type': 'alert',
      })
      let status = 0
      let data = ''
      reqStream.on('response', headers => { status = Number(headers[':status']) || 0 })
      reqStream.on('data', chunk => { data += chunk })
      reqStream.on('end', () => {
        if (status === 200) sent++
        else if (status === 410 || (status === 400 && data.includes('BadDeviceToken'))) invalid.push(token)
        resolve()
      })
      reqStream.on('error', () => resolve())
      reqStream.write(payload)
      reqStream.end()
    })))
  } finally {
    client.close()
  }
  return { sent, invalid }
}

// ── FCM (HTTP v1) ───────────────────────────────────────────────────

function fcmConfigured(): boolean {
  return !!(process.env.FCM_PROJECT_ID && process.env.FCM_CLIENT_EMAIL && process.env.FCM_PRIVATE_KEY)
}

async function fcmAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(JSON.stringify({
    iss: process.env.FCM_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const input = `${header}.${claims}`
  const key = (process.env.FCM_PRIVATE_KEY as string).replace(/\\n/g, '\n')
  const sig = crypto.sign('RSA-SHA256', Buffer.from(input), key)
  const assertion = `${input}.${b64url(sig)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('FCM token error: ' + JSON.stringify(data))
  return data.access_token as string
}

async function sendFcmBatch(tokens: string[], title: string, body: string): Promise<{ sent: number; invalid: string[] }> {
  const projectId = process.env.FCM_PROJECT_ID as string
  const accessToken = await fcmAccessToken()
  const invalid: string[] = []
  let sent = 0

  await Promise.all(tokens.map(async token => {
    try {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            android: { priority: 'high', notification: { channel_id: 'reva_orders' } },
          },
        }),
      })
      if (res.ok) sent++
      else if (res.status === 404 || res.status === 400) invalid.push(token)
    } catch { /* ignora un token fallido */ }
  }))
  return { sent, invalid }
}
