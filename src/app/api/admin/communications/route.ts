import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireWriter } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Comunicados del super-admin hacia los negocios de la plataforma.
//   GET    → lista de comunicados enviados, cada uno con cuántos negocios lo
//            reciben (según su segmento) y cuántos ya lo leyeron.
//   POST   → { title, body, priority, audience, audienceValue, audienceIds }
//            crea y "envía" el comunicado.
//   DELETE → ?id=  elimina el comunicado (y sus acuses de lectura por cascada).
//
// Escribir es exclusivo del super admin (el módulo 'communications' no está en
// la lista de escritura de operador/analista → requireWriter lo restringe).

type Audience = 'all' | 'municipio' | 'category' | 'tier' | 'specific'
type CommRow = {
  id: string; title: string; body: string; priority: string
  audience: string; audience_value: string | null; audience_ids: string[] | null
  sent_by: string | null; created_at: string
}
type BizRow = { id: string; municipio: string | null; kind: string | null; type: string | null; tier: string | null }

// ¿El negocio `b` cae dentro del segmento del comunicado `c`?
function matches(c: CommRow, b: BizRow): boolean {
  switch (c.audience as Audience) {
    case 'all': return true
    case 'municipio': return !!c.audience_value && b.municipio === c.audience_value
    case 'category': return !!c.audience_value && (b.kind === c.audience_value || b.type === c.audience_value)
    case 'tier': return !!c.audience_value && b.tier === c.audience_value
    case 'specific': return (c.audience_ids ?? []).includes(b.id)
    default: return false
  }
}

// Inserta una notificación (con push vía trigger 034) por cada miembro de los
// negocios que caen en el segmento del comunicado. Devuelve cuántas insertó.
async function dispatchCommNotifications(
  db: ReturnType<typeof createAdminClient>,
  c: CommRow,
): Promise<number> {
  // Negocios destinatarios según el segmento.
  const { data: bizData } = await db.from('businesses').select('id,municipio,kind,type,tier')
  const targetIds = ((bizData ?? []) as BizRow[]).filter(b => matches(c, b)).map(b => b.id)
  if (targetIds.length === 0) return 0

  // Dueños/miembros de esos negocios (un push por usuario, sin duplicar).
  const { data: members } = await db.from('biz_members').select('user_id,biz_id').in('biz_id', targetIds)
  const userIds = [...new Set(((members ?? []) as { user_id: string | null }[]).map(m => m.user_id).filter(Boolean))] as string[]
  if (userIds.length === 0) return 0

  const title = c.priority === 'urgente' ? `🔴 ${c.title}` : `📣 ${c.title}`
  const shortBody = c.body.length > 200 ? c.body.slice(0, 197) + '…' : c.body
  const rows = userIds.map(uid => ({ user_id: uid, type: 'comunicado', title, body: shortBody, biz_name: 'Reva' }))
  const { error } = await db.from('notifications').insert(rows)
  if (error) return 0
  return rows.length
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const db = createAdminClient()

  const { data, error } = await db
    .from('business_communications')
    .select('id,title,body,priority,audience,audience_value,audience_ids,sent_by,created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (data ?? []) as CommRow[]

  // Universo de negocios para calcular destinatarios por segmento.
  const { data: bizData } = await db.from('businesses').select('id,municipio,kind,type,tier')
  const bizes = (bizData ?? []) as BizRow[]

  // Acuses de lectura agregados por comunicado.
  const readCount: Record<string, number> = {}
  const { data: reads } = await db.from('business_communication_reads').select('communication_id')
  for (const r of reads ?? []) {
    const k = r.communication_id as string
    readCount[k] = (readCount[k] ?? 0) + 1
  }

  const communications = rows.map(c => ({
    id: c.id,
    title: c.title,
    body: c.body,
    priority: c.priority,
    audience: c.audience,
    audienceValue: c.audience_value,
    audienceIds: c.audience_ids ?? [],
    sentBy: c.sent_by,
    createdAt: c.created_at,
    recipients: bizes.filter(b => matches(c, b)).length,
    reads: readCount[c.id] ?? 0,
  }))

  return NextResponse.json({ communications })
}

export async function POST(req: NextRequest) {
  const g = await requireWriter('communications'); if (g.error) return g.error
  const b = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })

  const title = String(b.title ?? '').trim()
  const body = String(b.body ?? '').trim()
  const priority = ['normal', 'importante', 'urgente'].includes(String(b.priority)) ? String(b.priority) : 'normal'
  const audience = ['all', 'municipio', 'category', 'tier', 'specific'].includes(String(b.audience)) ? String(b.audience) : 'all'
  const audienceValue = b.audienceValue != null ? String(b.audienceValue).trim() : null
  const audienceIds = Array.isArray(b.audienceIds) ? (b.audienceIds as unknown[]).map(String) : []

  if (!title) return NextResponse.json({ error: 'Falta el título.' }, { status: 400 })
  if (!body) return NextResponse.json({ error: 'Falta el mensaje.' }, { status: 400 })
  if ((audience === 'municipio' || audience === 'category' || audience === 'tier') && !audienceValue) {
    return NextResponse.json({ error: 'Selecciona el segmento destinatario.' }, { status: 400 })
  }
  if (audience === 'specific' && audienceIds.length === 0) {
    return NextResponse.json({ error: 'Selecciona al menos un negocio.' }, { status: 400 })
  }

  const db = createAdminClient()
  const commRow: CommRow = {
    id: '', title, body, priority, audience,
    audience_value: audience === 'all' || audience === 'specific' ? null : audienceValue,
    audience_ids: audience === 'specific' ? audienceIds : [],
    sent_by: g.admin.email, created_at: '',
  }
  const { data, error } = await db
    .from('business_communications')
    .insert({
      title: commRow.title, body: commRow.body, priority: commRow.priority, audience: commRow.audience,
      audience_value: commRow.audience_value, audience_ids: commRow.audience_ids, sent_by: commRow.sent_by,
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifica a los dueños/miembros de los negocios destinatarios. Insertar en
  // `notifications` dispara el push (trigger 034 → /api/push/send, APNs+FCM) y
  // también los alerta en la campana in-app por realtime. Es best-effort: si
  // algo falla, el comunicado ya quedó guardado igual.
  const pushed = await dispatchCommNotifications(db, commRow).catch(() => 0)

  return NextResponse.json({ ok: true, id: data?.id, notified: pushed })
}

export async function DELETE(req: NextRequest) {
  const g = await requireWriter('communications'); if (g.error) return g.error
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 })
  const db = createAdminClient()
  const { error } = await db.from('business_communications').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
