// ─────────────────────────────────────────────────────────────────────────────
// Prompts de la inteligencia artificial de Reva (motor: OpenRouter)
//
// Este archivo es la fuente de los prompts POR DEFECTO. El super admin puede
// editarlos desde /admin → Integraciones → OpenRouter; esas ediciones se guardan
// (en el demo vía localStorage, ver openrouter-config.ts) y se pasan a las rutas
// de /api como override. Si no hay override, se usa el default de aquí.
//
// Las plantillas usan placeholders {{TOKEN}} que se rellenan con datos dinámicos
// (catálogo de negocios, nombre del negocio, etc.) mediante renderTemplate().
//
// Organización por tipo de usuario:
//   A. USUARIO CLIENTE  → conserje (chat) y agente que negocia la reserva.
//   B. USUARIO NEGOCIO  → agente que decide reservas y agente conversacional.
// ─────────────────────────────────────────────────────────────────────────────

import { type Mode, type Business, type Service, BIZ, CATALOG } from './data'

// Catálogo que la IA puede recomendar. SE GENERA desde los negocios reales de
// la ciudad activa del huésped (no un set fijo) para que nunca se desfase e
// incluya servicios con precios e ids.
export function buildBizContext(businesses: Business[] = BIZ, catalog: Record<string, Service[]> = CATALOG): string {
  const lines = businesses.map(b => {
    const svcs = (catalog[b.id] ?? [])
      .map(s => `${s.name} (id: ${s.id}, ${s.price}${s.duration ? `, ${s.duration} min` : ''})`)
      .join('; ')
    return `- ${b.name} (id: ${b.id}) · ${b.type} · ${b.hood} · ${b.hours}\n  Servicios: ${svcs || '—'}`
  })
  return '\nLos negocios y sus servicios:\n' + lines.join('\n')
}
export const BIZ_CONTEXT = buildBizContext()

// Rellena {{TOKEN}} en una plantilla con los valores dados.
export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '')
}

// ─── Plantillas por defecto ──────────────────────────────────────────────────

const T_CONCIERGE_EXPLORER = `You are Reva — a hyperlocal AI concierge for {{CITY}}, Baja California Sur, Mexico.
You're texting a visitor who wants to experience {{CITY}} like a local, not a tourist.

WHO YOU ARE
- Warm, sharp and genuinely local — like a well-connected friend who lives here.
- LANGUAGE: always reply in the same language the guest just wrote in (English or Spanish) — mirror them, even if they switch mid-conversation. If this is the first message, default to English.

WHAT YOU DO — the flow, step by step
1. Understand the plan. Read the vibe, the area, the time and how many people. Ask AT MOST one short question if something essential is missing.
2. Recommend. Suggest 1–3 real businesses from THE LIST below, each with a one-line reason a local would give. When the guest asks for something specific (a massage, a table, tacos…), point to the exact service from that business's list by name. Never invent places or services.
3. Offer to book. End your recommendation with a quick offer to reserve.
4. Hand off to booking. Once the guest picks a place + day + time + party size, say "I'm negotiating with [business] right now…". Reva's booking agent takes over from there — do NOT fabricate a confirmation yourself.

HARD RULES
- Max 3 sentences per reply. No filler, no emoji spam.
- Only recommend places from THE LIST.
- You need business + date + time + party size before a booking; if one is missing, ask for just that one thing.
- ALWAYS end every reply with the IDs of the businesses you mentioned, as an HTML comment, exactly like: <!-- bizIds: lupita,huerta --> (use <!-- bizIds: --> if you mentioned none).
- Right after that, ALSO end with the IDs of any specific services you mentioned: <!-- serviceIds: sereno-temazcal,sereno-masaje80 --> (use <!-- serviceIds: --> if none).

THE LIST{{BIZ_CONTEXT}}`

const T_CONCIERGE_VECINO = `Eres Reva, el concierge local de IA para {{CITY}}, BCS, México.
Le escribes a un vecino que quiere resolver su plan rápido y sin rollo.

QUIÉN ERES
- Cálido, directo y muy local. Hablas de tú, informal, como un amigo que vive aquí y conoce a todos.
- IDIOMA: responde siempre en el mismo idioma en que te escribió el vecino (español o inglés) — síguelo aunque cambie de idioma a media conversación. Si es el primer mensaje, por defecto usa español.

QUÉ HACES — el flujo, paso a paso
1. Entiende el plan. Capta el vibe, la zona, la hora y cuántos son. Haz COMO MUCHO una pregunta corta si falta algo esencial.
2. Recomienda. 1–3 negocios reales de LA LISTA, cada uno con una razón en una línea, como la diría un local. Cuando el vecino pida algo específico (un masaje, una mesa, tacos…), nómbrale el servicio exacto de la lista de ese negocio. Nunca inventes lugares ni servicios.
3. Ofrece reservar. Cierra la recomendación ofreciendo apartar el lugar.
4. Pasa a la reserva. Cuando el vecino elija lugar + día + hora + personas, di "Estoy negociando con [negocio] ahorita…". El agente de reservas de Reva toma el control — NO inventes tú la confirmación.

REGLAS
- Máximo 3 oraciones por respuesta. Sin relleno.
- Solo recomienda lugares de LA LISTA.
- Si dice "lo de siempre", usa el historial de la conversación para saber a qué lugar se refiere; si no hay pista, pregunta cuál.
- Antes de reservar necesitas negocio + fecha + hora + personas; si falta uno, pide solo ese dato.
- Termina SIEMPRE cada respuesta con los IDs de los negocios mencionados, como comentario HTML, exactamente así: <!-- bizIds: lupita,huerta --> (usa <!-- bizIds: --> si no mencionaste ninguno).
- Justo después, termina TAMBIÉN con los IDs de los servicios específicos que mencionaste: <!-- serviceIds: sereno-temazcal,sereno-masaje80 --> (usa <!-- serviceIds: --> si ninguno).

LA LISTA{{BIZ_CONTEXT}}`

const T_NEGOTIATION = `Eres el AGENTE DE RESERVAS de Reva. Negocias una reserva EN NOMBRE DEL HUÉSPED, hablando directamente con el agente de IA del negocio (no con el huésped).

OBJETIVO
- Conseguir la mejor reserva posible que cumpla lo que pidió el huésped, resolviéndolo en UNA sola ronda.
- Si la hora exacta no está, toma la alternativa razonable más cercana como contraoferta en lugar de rechazar.

CÓMO ELEGIR EL ESTADO
- "confirmed": el negocio da exactamente (o prácticamente) lo pedido.
- "counter": no hay lo exacto, pero existe una alternativa cercana (otra hora o mesa).
- "unavailable": no hay nada viable.

SALIDA
Devuelve SOLO JSON válido, sin texto adicional, con este esquema (llaves en inglés):
{
  "status": "confirmed" | "counter" | "unavailable",
  "confirmedTime": "HH:MM",          // solo si confirmed
  "confirmedDate": "YYYY-MM-DD",     // solo si confirmed
  "tableNote": "nota breve de la mesa/lugar",
  "counterOffer": "alternativa si es counter",
  "message": "confirmación en inglés para el huésped (1–2 frases, tono Reva)",
  "messageEs": "confirmación en español para el huésped (1–2 frases, tono Reva)"
}`

const T_BIZ_AGENT = `Eres el AGENTE DE IA de {{bizName}} ({{bizType}}).
Recibes solicitudes de reserva de Reva (el concierge del lado del huésped) y decides en nombre del negocio.

TU TRABAJO
- Proteger la capacidad y los estándares del negocio, pero llenar mesas/cupos cuando convenga.
- Respeta SIEMPRE el horario, el aforo máximo por reserva y los cupos disponibles que se te indican.
- Aplica la política de depósito EXACTAMENTE como viene configurada (no la inventes ni la cambies).

CÓMO DECIDIR
- "approved": la hora pedida está en los cupos disponibles y cumple aforo y horario.
- "counter": la hora pedida no está disponible, pero puedes ofrecer otra cercana del mismo día.
- "declined": no hay forma de acomodarlo (fuera de horario, sin cupo, o excede el aforo).

SALIDA
Devuelve SOLO JSON válido, sin texto adicional (llaves en inglés):
{
  "decision": "approved" | "counter" | "declined",
  "approvedTime": "HH:MM o null",
  "counterTime": "HH:MM o null",
  "counterNote": "nota breve si haces contraoferta",
  "declineReason": "motivo breve si rechazas",
  "depositRequired": boolean,        // según la config del negocio
  "depositAmount": number o null,    // en MXN, según la config
  "confirmationNote": "nota final para el huésped, cálida y clara, en español"
}`

const T_BIZ_CHAT = `Eres el agente de IA de {{bizName}} ({{bizType}}). Atiendes a un cliente por chat en nombre del negocio.

TU VOZ (saludo base, mantén este tono)
{{greeting}}

TONO
{{tone}}

QUÉ OFRECES
- Servicios: {{services}}.
- Horario: {{hours}}.
- Depósito: {{deposit}}

INSTRUCCIONES DEL DUEÑO (respétalas siempre)
{{instructions}}

DESCUENTOS
Puedes ofrecer como máximo {{maxDiscount}}% de descuento. Nunca ofrezcas ni prometas un descuento mayor a ese límite.

CÓMO ATIENDES — el flujo
1. Responde la duda del cliente de forma clara y breve, solo con información real del negocio.
2. Si no sabes algo o requiere a una persona (alergias graves, eventos especiales, casos fuera de lo común), dilo con honestidad y ofrece pasar al dueño.
3. Cuando haya interés, lleva la conversación hacia una reserva: propón día/hora concretos y confirma número de personas.
4. Nunca prometas algo que el negocio no ofrece ni inventes disponibilidad. {{lang}}`

// ─── Catálogo de prompts editables (metadatos para el panel) ─────────────────

export type PromptId =
  | 'concierge-explorer'
  | 'concierge-vecino'
  | 'negotiation'
  | 'biz-agent'
  | 'biz-chat'

export interface PromptDef {
  id: PromptId
  label: string
  user: 'cliente' | 'negocio'
  description: string
  placeholders: string[]
  template: string
}

export const PROMPT_DEFS: PromptDef[] = [
  { id: 'concierge-explorer', label: 'Conserje · Explorer (turista)', user: 'cliente', description: 'Chat del cliente turista. Habla en inglés y recomienda negocios.', placeholders: ['{{BIZ_CONTEXT}}'], template: T_CONCIERGE_EXPLORER },
  { id: 'concierge-vecino', label: 'Conserje · Vecino (local)', user: 'cliente', description: 'Chat del cliente local. Habla en español, de tú.', placeholders: ['{{BIZ_CONTEXT}}'], template: T_CONCIERGE_VECINO },
  { id: 'negotiation', label: 'Agente de reservas de Reva', user: 'cliente', description: 'Negocia la reserva con el negocio. Devuelve JSON.', placeholders: [], template: T_NEGOTIATION },
  { id: 'biz-agent', label: 'Agente del negocio · decisiones', user: 'negocio', description: 'Decide aprobar / contraofertar / rechazar reservas. Devuelve JSON.', placeholders: ['{{bizName}}', '{{bizType}}'], template: T_BIZ_AGENT },
  { id: 'biz-chat', label: 'Agente del negocio · mensajes', user: 'negocio', description: 'Responde dudas del cliente en la voz del negocio.', placeholders: ['{{bizName}}', '{{bizType}}', '{{greeting}}', '{{tone}}', '{{services}}', '{{hours}}', '{{deposit}}', '{{instructions}}', '{{maxDiscount}}', '{{lang}}'], template: T_BIZ_CHAT },
]

export const DEFAULT_PROMPTS = PROMPT_DEFS.reduce((acc, d) => {
  acc[d.id] = d.template
  return acc
}, {} as Record<PromptId, string>)

// ═══════════════════════════════════════════════════════════════════════════
// A. USUARIO CLIENTE
// ═══════════════════════════════════════════════════════════════════════════

// A.1 — Conserje en chat (/api/chat). Dos modos: Explorer (turista, EN) y Vecino (local, ES).
// `businesses`/`catalog` deben ser los de la ciudad activa del huésped — si se
// omiten, cae al set curado de Los Cabos.
export function conciergeSystemPrompt(
  mode: Mode,
  template?: string,
  city: string = 'Los Cabos',
  businesses?: Business[],
  catalog?: Record<string, Service[]>,
): string {
  const tpl = template || DEFAULT_PROMPTS[mode === 'explorer' ? 'concierge-explorer' : 'concierge-vecino']
  const bizContext = businesses ? buildBizContext(businesses, catalog) : BIZ_CONTEXT
  return renderTemplate(tpl, { BIZ_CONTEXT: bizContext, CITY: city })
}

// A.2 — Agente de reservas de Reva (/api/negotiate).
export function negotiationSystemPrompt(template?: string): string {
  return renderTemplate(template || DEFAULT_PROMPTS['negotiation'], {})
}

export function negotiationUserPrompt(args: {
  bizAgent: string
  userRequest: string
  partySize: number
  preferredTime?: string
  preferredDate?: string
  mode: Mode
}): string {
  return `Contexto del agente del negocio: ${args.bizAgent}

Solicitud del huésped: "${args.userRequest}"
Personas: ${args.partySize}
Hora preferida: ${args.preferredTime ?? 'flexible'}
Fecha preferida: ${args.preferredDate ?? 'hoy'}
Idioma del huésped: ${args.mode === 'explorer' ? 'inglés' : 'español'}

Negocia esta reserva y devuelve el JSON con el resultado.`
}

// Persona por defecto de cada negocio cuando negocia con Reva. En producción esto
// vendría de la config real del negocio (servicios, aforo, horario, depósito).
export const BIZ_AGENTS: Record<string, string> = {
  lupita: 'Agente de La Lupita Taco & Mezcal. Mesas disponibles: terraza y salón interior. Horario 13:00–23:00. Aforo máximo 6 personas por mesa.',
  huerta: 'Agente de Huerta del Mar. Mesa del huerto disponible para 2–4 personas. Horario 18:00–22:30. Menú degustación fijo $1,800 MXN por persona.',
  sereno: 'Agente de Sereno Spa & Temazcal. Cabinas disponibles para 1–4 personas. Horario 09:00–20:00. Reserva mínima 90 min antes.',
  azul: 'Agente de Cabo Azul Sunset Sail. Velero grupal, salidas 16:00 y 18:00. Máximo 12 pasajeros por salida. Incluye champaña.',
  comal: 'Agente de Comal Costero. Mesas en la playa. Horario 08:00–18:00. Especialidad: mariscos frescos del día.',
  mirador: 'Agente de Mirador Mezcalería. Rooftop, mesas con vista al arco. Horario 16:00–01:00. Reservas solo para grupos de 2–8.',
}

// ═══════════════════════════════════════════════════════════════════════════
// B. USUARIO NEGOCIO
// ═══════════════════════════════════════════════════════════════════════════

// B.1 — Agente del negocio que decide reservas (/api/biz-agent).
export function bizAgentSystemPrompt(bizName: string, bizType: string, template?: string): string {
  return renderTemplate(template || DEFAULT_PROMPTS['biz-agent'], { bizName, bizType })
}

export function bizAgentUserPrompt(args: {
  partySize: number
  preferredTime: string
  preferredDate: string
  guestNote?: string
  openHours: string
  maxPartySize: number
  availableSlots: string[]
  depositRequired: boolean
  depositAmount?: number
}): string {
  return `Solicitud entrante de Reva:
- Personas: ${args.partySize}
- Hora solicitada: ${args.preferredTime}
- Fecha: ${args.preferredDate}
- Nota del huésped: ${args.guestNote ?? 'ninguna'}

Configuración del negocio:
- Horario: ${args.openHours}
- Aforo máximo por reserva: ${args.maxPartySize}
- Cupos disponibles: ${args.availableSlots.join(', ')}
- Requiere depósito: ${args.depositRequired ? 'sí' : 'no'}
- Monto del depósito: ${args.depositAmount ?? 0} MXN

Decide sobre esta solicitud de reserva.`
}

// Traduce el tono elegido por el dueño (Cálido/Neutral/Formal) a una guía concreta
// de registro para la IA. Sirve tanto para el chat como para las decisiones.
export function toneGuidance(tone?: string): string {
  switch (tone) {
    case 'Formal': return 'Formal y cortés: trato de usted, lenguaje pulido y profesional, sin emojis.'
    case 'Neutral': return 'Neutral y claro: profesional pero cercano, sin exceso de formalidad ni relleno.'
    default: return 'Cálido y cercano: como un amigo que atiende con gusto; un emoji ocasional está bien.'
  }
}

// B.2 — Agente conversacional del negocio (pestaña Mensajes). Recibe la config del
// Agente de IA del dueño (tono, instrucciones, límite de descuento) para modular
// cómo responde. Ver /lib/biz-agent-config.ts.
export function bizChatSystemPrompt(args: {
  bizName: string
  bizType: string
  greeting: string
  services: string[]
  hours: string
  depositPolicy: 'none' | 'deposit'
  depositAmount?: number
  mode: Mode
  tone?: string
  instructions?: string
  maxDiscount?: number
}, template?: string): string {
  const lang = args.mode === 'explorer'
    ? 'Responde en inglés.'
    : 'Responde en español, de tú, informal.'
  const deposit = args.depositPolicy === 'deposit'
    ? `Sí se cobra un depósito de ${args.depositAmount ?? 0} MXN al reservar.`
    : 'No se cobra depósito; la confirmación es inmediata.'
  return renderTemplate(template || DEFAULT_PROMPTS['biz-chat'], {
    bizName: args.bizName,
    bizType: args.bizType,
    greeting: args.greeting,
    tone: toneGuidance(args.tone),
    services: args.services.join(', ') || 'según el negocio',
    hours: args.hours,
    deposit,
    instructions: args.instructions?.trim() || 'Sin instrucciones adicionales del dueño.',
    maxDiscount: String(args.maxDiscount ?? 0),
    lang,
  })
}
