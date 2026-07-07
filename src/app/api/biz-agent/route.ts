import { openrouterJSON, type ChatMessage } from '@/lib/openrouter'
import { bizAgentSystemPrompt, bizAgentUserPrompt } from '@/lib/ai-prompts'
import { loadPlatformConfig, resolvedPrompt, modelChain } from '@/lib/platform-config'
import { enforceRateLimit } from '@/lib/rate-limit'

export const maxDuration = 30

export interface BizAgentRequest {
  bizId: string
  bizName: string
  bizType: string
  incomingRequest: {
    partySize: number
    preferredTime: string
    preferredDate: string
    guestNote?: string
  }
  bizConfig: {
    openHours: string
    maxPartySize: number
    availableSlots: string[]
    depositRequired: boolean
    depositAmount?: number
    autoApprove: boolean
  }
}

export interface BizAgentResponse {
  decision: 'approved' | 'counter' | 'declined'
  approvedTime?: string
  counterTime?: string
  counterNote?: string
  declineReason?: string
  depositRequired: boolean
  depositAmount?: number
  confirmationNote: string
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'ai')
  if (limited) return limited
  try {
    const body: BizAgentRequest = await req.json()
    const { bizName, bizType, incomingRequest, bizConfig } = body

    if (bizConfig.autoApprove && bizConfig.availableSlots.includes(incomingRequest.preferredTime)) {
      const response: BizAgentResponse = {
        decision: 'approved',
        approvedTime: incomingRequest.preferredTime,
        depositRequired: bizConfig.depositRequired,
        depositAmount: bizConfig.depositAmount,
        confirmationNote: `Mesa confirmada para ${incomingRequest.partySize} personas a las ${incomingRequest.preferredTime}.`,
      }
      return Response.json(response)
    }

    const cfg = await loadPlatformConfig()
    const messages: ChatMessage[] = [
      { role: 'system', content: bizAgentSystemPrompt(bizName, bizType, resolvedPrompt(cfg, 'biz-agent')) },
      {
        role: 'user',
        content: bizAgentUserPrompt({
          partySize: incomingRequest.partySize,
          preferredTime: incomingRequest.preferredTime,
          preferredDate: incomingRequest.preferredDate,
          guestNote: incomingRequest.guestNote,
          openHours: bizConfig.openHours,
          maxPartySize: bizConfig.maxPartySize,
          availableSlots: bizConfig.availableSlots,
          depositRequired: bizConfig.depositRequired,
          depositAmount: bizConfig.depositAmount,
        }),
      },
    ]

    const result = await openrouterJSON<BizAgentResponse>(messages, {
      temperature: 0.2,
      max_tokens: 300,
      ...modelChain(cfg),
    })

    return Response.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
