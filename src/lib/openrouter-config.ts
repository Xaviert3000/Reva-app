// Config compartida de qué funciones de IA (vía OpenRouter) están habilitadas en
// la plataforma y de los prompts que usa la IA. La define el super admin
// (/admin → Integraciones); el resto de la plataforma la consume. En el demo se
// sincroniza vía localStorage; en producción esto vendría del backend. La llave
// real y el modelo viven en variables de entorno (OPENROUTER_API_KEY,
// OPENROUTER_MODEL) y los usa el cliente en ./openrouter.ts.

import { DEFAULT_PROMPTS, type PromptId } from './ai-prompts'

export type OROption = { id: string; label: string; labelEn?: string; desc: string; descEn?: string; on: boolean }

export const OR_OPTIONS_DEFAULT: OROption[] = [
  { id: 'concierge', label: 'Conserje IA', labelEn: 'AI concierge', desc: 'Chat que recomienda y reserva por el cliente', descEn: 'Chat that recommends and books for the customer', on: true },
  { id: 'negotiation', label: 'Negociación agente-a-agente', labelEn: 'Agent-to-agent negotiation', desc: 'Los agentes acuerdan disponibilidad y precio', descEn: 'Agents agree on availability and price', on: true },
  { id: 'bizagent', label: 'Agente del negocio', labelEn: 'Business agent', desc: 'Responde mensajes por cada negocio automáticamente', descEn: 'Answers messages for each business automatically', on: true },
  { id: 'translation', label: 'Traducción ES / EN', labelEn: 'ES / EN translation', desc: 'Traduce la conversación entre cliente y negocio', descEn: 'Translates the conversation between customer and business', on: false },
]

export const OR_DEFAULT_MODEL = 'openai/gpt-4o-mini'

export type ORConfig = { connected: boolean; options: OROption[]; prompts: Record<PromptId, string> }

const KEY = 'reva_openrouter_config'

function fullPrompts(stored?: Partial<Record<PromptId, string>>): Record<PromptId, string> {
  // Empieza de los defaults y sobreescribe con lo guardado (si lo hay).
  const out = { ...DEFAULT_PROMPTS }
  if (stored) for (const k of Object.keys(out) as PromptId[]) {
    if (typeof stored[k] === 'string') out[k] = stored[k] as string
  }
  return out
}

export function loadORConfig(): ORConfig {
  if (typeof window === 'undefined') return { connected: false, options: OR_OPTIONS_DEFAULT, prompts: fullPrompts() }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { connected: false, options: OR_OPTIONS_DEFAULT, prompts: fullPrompts() }
    const parsed = JSON.parse(raw) as { connected?: boolean; options?: { id: string; on: boolean }[]; prompts?: Partial<Record<PromptId, string>> }
    const options = OR_OPTIONS_DEFAULT.map(d => ({ ...d, on: parsed.options?.find(o => o.id === d.id)?.on ?? d.on }))
    return { connected: !!parsed.connected, options, prompts: fullPrompts(parsed.prompts) }
  } catch {
    return { connected: false, options: OR_OPTIONS_DEFAULT, prompts: fullPrompts() }
  }
}

export function saveORConfig(c: ORConfig) {
  if (typeof window === 'undefined') return
  try {
    // Solo persiste los prompts que difieren del default, para mantenerlo ligero.
    const prompts: Partial<Record<PromptId, string>> = {}
    for (const k of Object.keys(c.prompts) as PromptId[]) {
      if (c.prompts[k] !== DEFAULT_PROMPTS[k]) prompts[k] = c.prompts[k]
    }
    localStorage.setItem(KEY, JSON.stringify({
      connected: c.connected,
      options: c.options.map(o => ({ id: o.id, on: o.on })),
      prompts,
    }))
  } catch {
    // ignore
  }
}
