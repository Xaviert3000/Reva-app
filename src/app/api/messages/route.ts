import { NextRequest, NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase/route-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { openrouterChat, type ChatMessage } from '@/lib/openrouter'
import { bizChatSystemPrompt, promoContext } from '@/lib/ai-prompts'
import { loadPlatformConfig, resolvedPrompt, modelChain } from '@/lib/platform-config'
import { isOpenNow, bizLocalTimeLabel, normalizeWeekly, summarizeWeekly, type Mode, type BizOffer } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface DbMessage { id: string; biz_id: string; user_id: string; from_role: string; body: string; read_at: string | null; created_at: string; order_items: { serviceId: string; qty: number }[] | null }

// Instrucción de "armar el pedido" que se añade al system prompt del agente del
// negocio. Le da el catálogo de productos con su id y le pide terminar con un
// marcador oculto cuando el cliente confirma qué quiere pedir. La app usa ese
// marcador para pintar tarjetas "Agregar" y llenar el carrito de verdad.
function orderProtocol(
  products: { id: string; name: string; price: string }[],
  ctx: { openNow: boolean; hours: string; nowLabel: string },
): string {
  // Estado actual del negocio: el agente debe respetar el horario. El checkout
  // también bloquea pedidos si está cerrado, así que aceptar uno estando cerrado
  // sería un callejón sin salida para el cliente.
  const stateBlock = `

HORARIO Y ESTADO ACTUAL (respétalo SIEMPRE)
- Ahora mismo (hora local del negocio): ${ctx.nowLabel}.
- Horario del negocio: ${ctx.hours || 'no especificado'}.
- En este momento el negocio está ${ctx.openNow ? 'ABIERTO.' : 'CERRADO.'}${ctx.openNow ? '' : `
- Como está CERRADO: NO tomes pedidos de productos ni confirmes un pedido para pagar ahora (el pago está bloqueado fuera de horario). Con amabilidad, dile que ahorita están cerrados e indícale el horario (${ctx.hours || 'consultar horario'}) para que regrese a ordenar. NUNCA digas que sí puedes tomarle el pedido ahora. Las reservas para una fecha/hora futura sí las puedes seguir gestionando normalmente.`}`

  // Si no hay productos pedibles o el negocio está cerrado, solo damos el estado
  // (sin instrucciones para emitir el marcador de pedido).
  if (products.length === 0 || !ctx.openNow) return stateBlock

  const list = products.map(p => `  • ${p.name}${p.price ? ` (${p.price})` : ''} → id: ${p.id}`).join('\n')
  return `${stateBlock}

ARMAR EL PEDIDO (muy importante)
Estos son los productos que el cliente puede PEDIR y pagar en línea, con su id:
${list}
Cuando el cliente confirme qué producto(s) quiere y cuántos, ayúdalo a armar el pedido:
1. Responde normal, de forma breve y cálida, confirmando qué llevará.
2. Al FINAL de tu respuesta, en una línea aparte, agrega EXACTAMENTE este marcador oculto con los productos y cantidades, usando SOLO los ids de la lista de arriba:
   <!-- order: id*cantidad, id*cantidad -->
   Ejemplo: <!-- order: ${products[0].id}*2 -->
Reglas del marcador:
- Usa únicamente ids que existan en la lista de arriba. Si el cliente pide algo que no está, dilo y NO lo incluyas en el marcador.
- Solo agrega el marcador cuando el cliente ya haya confirmado qué quiere; no lo pongas si todavía está preguntando o dudando.
- No menciones el marcador ni los ids en el texto visible; el cliente solo verá tarjetas para agregar al pedido.`
}

// Extrae el marcador `<!-- order: id*qty, id*qty -->` de la respuesta del agente,
// lo quita del texto visible y devuelve las líneas de pedido válidas (ids que
// existen en el catálogo). Acepta separadores *, x o × y cantidad opcional (=1).
function parseOrderMarker(text: string, validIds: Set<string>): { text: string; order: { serviceId: string; qty: number }[] } {
  const order: { serviceId: string; qty: number }[] = []
  const m = text.match(/<!--\s*order:\s*([\s\S]*?)-->/i)
  if (m) {
    for (const raw of m[1].split(',')) {
      const item = raw.trim()
      if (!item) continue
      const pair = item.match(/^(.+?)\s*[*x×]\s*(\d+)\s*$/i)
      const id = (pair ? pair[1] : item).trim()
      const qty = pair ? Math.max(1, Math.min(99, parseInt(pair[2], 10))) : 1
      if (!validIds.has(id)) continue
      const existing = order.find(o => o.serviceId === id)
      if (existing) existing.qty = Math.min(99, existing.qty + qty)
      else order.push({ serviceId: id, qty })
    }
  }
  // Quita cualquier comentario HTML del texto visible (incluye el marcador).
  const clean = text.replace(/<!--[\s\S]*?-->/g, '').replace(/\n{3,}/g, '\n\n').trim()
  return { text: clean, order }
}

// Chat cliente ↔ negocio, persistido en la tabla `messages`.
//  GET            → hilos del cliente (uno por negocio) para el inbox.
//  GET ?biz_id=   → mensajes de la conversación con ese negocio.
//  POST {biz_id, body} → guarda el mensaje del cliente, genera la respuesta del
//                        agente del negocio y también la guarda.
export async function GET(req: NextRequest) {
  // Acepta cookie (web) o Bearer token (app nativa).
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  const admin = createAdminClient()

  if (bizId) {
    const { data } = await admin
      .from('messages')
      .select('id,biz_id,user_id,from_role,body,read_at,created_at,order_items')
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
  // Acepta cookie (web) o Bearer token (app nativa).
  const { user } = await getRouteUser(req)
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
  // Productos que el agente decidió agregar al pedido (id + cantidad), parseados
  // del marcador oculto de su respuesta. Se devuelven a la app para pintar las
  // tarjetas "Agregar" y armar el carrito de verdad.
  let order: { serviceId: string; qty: number }[] = []
  try {
    const { data: biz } = await admin.from('businesses').select('name,type,kind,hours,hours_json,does_orders').eq('id', biz_id).single()
    const { data: svcs } = await admin.from('services').select('id,name,price,scheduled').eq('biz_id', biz_id).eq('active', true)
    // Promociones activas del negocio (kind='oferta') para que el agente las conozca.
    const { data: offerRows } = await admin
      .from('promotions')
      .select('id,title,body,discount,start_date,end_date,start_time,end_time,days')
      .eq('biz_id', biz_id).eq('kind', 'oferta').eq('active', true)
    const offers: BizOffer[] = (offerRows ?? []).map(o => ({
      id: o.id as string,
      type: (o.discount as string) || 'Descuento',
      title: (o.title as string) ?? '',
      detail: (o.body as string) || '',
      imageUrl: null,
      startDate: (o.start_date as string) || null,
      endDate: (o.end_date as string) || null,
      days: (o.days as number[]) ?? [],
      startTime: (o.start_time as string) || null,
      endTime: (o.end_time as string) || null,
    }))
    const { data: hist } = await admin
      .from('messages')
      .select('from_role,body')
      .eq('user_id', user.id).eq('biz_id', biz_id)
      .order('created_at', { ascending: true })

    // Productos pedibles: el negocio acepta pedidos y el servicio no usa calendario.
    const products = biz?.does_orders
      ? (svcs ?? []).filter(s => (s as { scheduled?: boolean }).scheduled === false)
          .map(s => ({ id: s.id as string, name: s.name as string, price: (s.price as string) ?? '' }))
      : []

    // Horario: si el negocio configuró horario semanal (por día), se usa para
    // saber si está abierto AHORA y se muestra el resumen legible en el prompt;
    // si no, cae al rango único legado.
    const bizWeekly = normalizeWeekly(biz?.hours_json)
    const bizHoursLabel = (bizWeekly ? summarizeWeekly(bizWeekly) : biz?.hours) ?? ''

    const cfg = await loadPlatformConfig()
    let system = bizChatSystemPrompt(
      {
        bizName: biz?.name ?? 'el negocio',
        bizType: biz?.kind ?? biz?.type ?? '',
        greeting: `Hola, soy el agente de ${biz?.name ?? 'este negocio'}.`,
        services: (svcs ?? []).map(s => s.name as string),
        hours: bizHoursLabel,
        depositPolicy: 'none',
        mode: mode ?? 'explorer',
      },
      resolvedPrompt(cfg, 'biz-chat'),
    )
    // Protocolo de pedido + estado del horario (en código, no en el prompt
    // editable, para que funcione aunque el dueño personalice el prompt): lista los
    // productos con su id, le dice si está abierto/cerrado y le pide cerrar el
    // pedido con un marcador oculto que la app convierte en carrito.
    const openNow = isOpenNow(biz?.hours, undefined, bizWeekly)
    system += orderProtocol(products, { openNow, hours: bizHoursLabel, nowLabel: bizLocalTimeLabel() })
    // Promociones (siempre, independiente del horario): el cliente puede preguntar
    // por ofertas a cualquier hora; cada oferta trae su propia ventana de días/horas.
    system += promoContext(offers)

    const apiMsgs: ChatMessage[] = (hist ?? []).map(h => ({
      role: (h.from_role === 'biz' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: h.from_role === 'reva' ? `[Reva] ${h.body}` : (h.body as string),
    }))
    const res = await openrouterChat([{ role: 'system', content: system }, ...apiMsgs], { stream: false, max_tokens: 300, ...modelChain(cfg) })
    if (res.ok) {
      const json = await res.json()
      replyText = json?.choices?.[0]?.message?.content?.trim() ?? ''
    }

    // Extrae el marcador `<!-- order: id*qty, ... -->` y lo quita del texto visible.
    // Estando CERRADO nunca ofrecemos tarjetas de pedido (el checkout lo bloquea):
    // solo limpiamos cualquier comentario que el modelo hubiera dejado.
    if (openNow) {
      const parsed = parseOrderMarker(replyText, new Set(products.map(p => p.id)))
      replyText = parsed.text
      order = parsed.order
    } else {
      replyText = replyText.replace(/<!--[\s\S]*?-->/g, '').replace(/\n{3,}/g, '\n\n').trim()
    }
  } catch { /* sin IA: se guarda un aviso abajo */ }

  if (!replyText) replyText = 'Gracias por tu mensaje — el negocio te responderá en breve.'

  const { data: replyMsg } = await admin
    .from('messages')
    .insert({ biz_id, user_id: user.id, from_role: 'biz', body: replyText, order_items: order.length ? order : null })
    .select()
    .single()

  return NextResponse.json({ userMessage: userMsg, reply: replyMsg, order })
}
