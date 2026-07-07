// Config del Agente de IA POR NEGOCIO: tono, instrucciones del dueño, límite de
// descuento y encendido/apagado. La edita el dueño en /biz → Ajustes → Agente de
// IA y la consumen la pestaña Mensajes (/api/biz-chat) y —cuando se cablee— la
// decisión de reservas (/api/biz-agent). En el demo se persiste vía localStorage
// por negocio; en producción esto vendría del backend.

export type AgentTone = 'Cálido' | 'Neutral' | 'Formal'

export interface BizAgentConfig {
  on: boolean
  tone: AgentTone
  instructions: string
  maxDiscount: number // % máximo de descuento que la IA puede ofrecer
  autoReplyOffHours: boolean // la IA contesta sola los mensajes SOLO fuera de horario
}

export const DEFAULT_AGENT_CONFIG: BizAgentConfig = {
  on: true,
  tone: 'Cálido',
  instructions: 'Sé amable, confirma rápido y ofrece la terraza si hay disponibilidad. No prometas descuentos arriba del límite.',
  maxDiscount: 10,
  autoReplyOffHours: false,
}

const KEY = (bizId: string) => `reva_biz_agent_${bizId}`

const isTone = (v: unknown): v is AgentTone => v === 'Cálido' || v === 'Neutral' || v === 'Formal'

// Normaliza un objeto arbitrario (p. ej. el jsonb `businesses.agent_config`)
// a una config válida, rellenando con los valores por defecto.
export function parseAgentConfig(raw: unknown): BizAgentConfig {
  const p = (raw ?? {}) as Partial<BizAgentConfig>
  return {
    on: typeof p.on === 'boolean' ? p.on : DEFAULT_AGENT_CONFIG.on,
    tone: isTone(p.tone) ? p.tone : DEFAULT_AGENT_CONFIG.tone,
    instructions: typeof p.instructions === 'string' ? p.instructions : DEFAULT_AGENT_CONFIG.instructions,
    maxDiscount: Number.isFinite(p.maxDiscount) ? Number(p.maxDiscount) : DEFAULT_AGENT_CONFIG.maxDiscount,
    autoReplyOffHours: typeof p.autoReplyOffHours === 'boolean' ? p.autoReplyOffHours : DEFAULT_AGENT_CONFIG.autoReplyOffHours,
  }
}

export function loadAgentConfig(bizId: string): BizAgentConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_AGENT_CONFIG }
  try {
    const raw = localStorage.getItem(KEY(bizId))
    if (!raw) return { ...DEFAULT_AGENT_CONFIG }
    return parseAgentConfig(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_AGENT_CONFIG }
  }
}

export function saveAgentConfig(bizId: string, c: BizAgentConfig) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY(bizId), JSON.stringify(c)) } catch { /* ignore */ }
}
