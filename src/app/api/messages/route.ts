import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { openrouterChat, type ChatMessage } from '@/lib/openrouter'
import { bizChatSystemPrompt } from '@/lib/ai-prompts'
import { loadPlatformConfig, resolvedPrompt, modelChain } from '@/lib/platform-config'
import type { Mode } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface DbMessage { id: string; biz_id: string; user_id: string; from_role: string; body: string; read_at: string | null; created_at: string }

// Chat cliente ↔ negocio, persistido en la tabla `messages`.
//  GET            → hilos del cliente (uno por negocio) para el inbox.
//  GET ?biz_id=   → mensajes de la conversación con ese negocio.
//  POST {biz_id, body} → guarda el mensaje del cliente, genera la respuesta del
//                        agente del negocio y también la guarda.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  const admin = createAdminClient()

  if (bizId) {
    const { data } = await admin
      .from('messages')
      .select('id,biz_id,user_id,from_role,body,read_at,created_at')
      .eq('user_id', user.id)
      .eq('biz_id', bizId)
      .order('created_at', { ascending: true })
    return NextResponse.json({ messages: data ?? [] })
  }

  // Inbox: todos los mensajes del cliente, agrupados por negocio.
  const { data: rows } = await admin
    .from('messages')
    .select('id,biz_id,user_id,from_role,body,read_at,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const byBiz = new Map<string, DbMessage[]>()
  for (const m of (rows ?? []) as DbMessage[]) {
    if (!byBiz.has(m.biz_id)) byBiz.set(m.biz_id, [])
    byBiz.get(m.biz_id)!.push(m)
  }
  const bizIds = [...byBiz.keys()]
  const names: Record<string, { name: string; grad_from: string | null; grad_to: string | null; mono: string | null }> = {}
  if (bizIds.length > 0) {
    const { data: bizRows } = await admin.from('businesses').select('id,name,grad_from,grad_to,mono').in('id', bizIds)
    for (const b of bizRows ?? []) names[b.id as string] = b as { name: string; grad_from: string | null; grad_to: string | null; mono: string | null }
  }
  const threads = bizIds.map(id => {
    const msgs = byBiz.get(id)!
    const last = msgs[msgs.length - 1]
    return { bizId: id, bizName: names[id]?.name ?? 'Negocio', grad_from: names[id]?.grad_from ?? null, grad_to: names[id]?.grad_to ?? null, mono: names[id]?.mono ?? null, last: last.body, created_at: last.created_at, messages: msgs }
  })
  return NextResponse.json({ threads })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { biz_id, body, mode } = await req.json() as { biz_id: string; body: string; mode?: Mode }
  const text = (body ?? '').trim()
  if (!biz_id || !text) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

  const admin = createAdminClient()

  // 1) Guarda el mensaje del cliente.
  const { data: userMsg, error: insErr } = await admin
    .from('messages')
    .insert({ biz_id, user_id: user.id, from_role: 'user', body: text })
    .select()
    .single()
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  // 2) Genera la respuesta del agente del negocio.
  let replyText = ''
  try {
    const { data: biz } = await admin.from('businesses').select('name,type,kind,hours').eq('id', biz_id).single()
    const { data: svcs } = await admin.from('services').select('name').eq('biz_id', biz_id).eq('active', true)
    const { data: hist } = await admin
      .from('messages')
      .select('from_role,body')
      .eq('user_id', user.id).eq('biz_id', biz_id)
      .order('created_at', { ascending: true })

    const cfg = await loadPlatformConfig()
    const system = bizChatSystemPrompt(
      {
        bizName: biz?.name ?? 'el negocio',
        bizType: biz?.kind ?? biz?.type ?? '',
        greeting: `Hola, soy el agente de ${biz?.name ?? 'este negocio'}.`,
        services: (svcs ?? []).map(s => s.name as string),
        hours: biz?.hours ?? '',
        depositPolicy: 'none',
        mode: mode ?? 'explorer',
      },
      resolvedPrompt(cfg, 'biz-chat'),
    )
    const apiMsgs: ChatMessage[] = (hist ?? []).map(h => ({
      role: (h.from_role === 'biz' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: h.from_role === 'reva' ? `[Reva] ${h.body}` : (h.body as string),
    }))
    const res = await openrouterChat([{ role: 'system', content: system }, ...apiMsgs], { stream: false, max_tokens: 300, ...modelChain(cfg) })
    if (res.ok) {
      const json = await res.json()
      replyText = json?.choices?.[0]?.message?.content?.trim() ?? ''
    }
  } catch { /* sin IA: se guarda un aviso abajo */ }

  if (!replyText) replyText = 'Gracias por tu mensaje — el negocio te responderá en breve.'

  const { data: replyMsg } = await admin
    .from('messages')
    .insert({ biz_id, user_id: user.id, from_role: 'biz', body: replyText })
    .select()
    .single()

  return NextResponse.json({ userMessage: userMsg, reply: replyMsg })
}
