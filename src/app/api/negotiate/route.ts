import { openrouterJSON, type ChatMessage } from '@/lib/openrouter'
import { BIZ_AGENTS, negotiationSystemPrompt, negotiationUserPrompt } from '@/lib/ai-prompts'
import { loadPlatformConfig, resolvedPrompt, modelChain } from '@/lib/platform-config'
import { enforceRateLimit } from '@/lib/rate-limit'
import type { Mode } from '@/lib/data'

export const maxDuration = 30

export interface NegotiateRequest {
  bizId: string
  bizName: string
  userRequest: string
  partySize: number
  preferredTime?: string
  preferredDate?: string
  mode: Mode
}

export interface NegotiateResult {
  status: 'confirmed' | 'counter' | 'unavailable'
  confirmedTime?: string
  confirmedDate?: string
  tableNote?: string
  counterOffer?: string
  message: string
  messageEs: string
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'ai')
  if (limited) return limited
  try {
    const body: NegotiateRequest = await req.json()
    const { bizId, bizName, userRequest, partySize, preferredTime, preferredDate, mode } = body

    const cfg = await loadPlatformConfig()
    const bizAgent = BIZ_AGENTS[bizId] ?? `Agente de ${bizName}.`

    const messages: ChatMessage[] = [
      { role: 'system', content: negotiationSystemPrompt(resolvedPrompt(cfg, 'negotiation')) },
      { role: 'user', content: negotiationUserPrompt({ bizAgent, userRequest, partySize, preferredTime, preferredDate, mode }) },
    ]

    const result = await openrouterJSON<NegotiateResult>(messages, {
      temperature: 0.3,
      max_tokens: 400,
      ...modelChain(cfg),
    })

    return Response.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
