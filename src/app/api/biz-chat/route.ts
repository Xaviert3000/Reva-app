import { openrouterChat, type ChatMessage } from '@/lib/openrouter'
import { bizChatSystemPrompt } from '@/lib/ai-prompts'
import { loadPlatformConfig, resolvedPrompt, modelChain } from '@/lib/platform-config'
import type { Mode } from '@/lib/data'

export const maxDuration = 30

// Agente conversacional del negocio: responde dudas del cliente en la voz del
// negocio (pestaña Mensajes del panel /biz). Usa el prompt 'biz-chat' editable
// desde /admin → Integraciones → OpenRouter (promptOverride), o el default.
export async function POST(req: Request) {
  try {
    const { messages, bizName, bizType, greeting, services, hours, depositPolicy, depositAmount, mode, tone, instructions, maxDiscount } = await req.json() as {
      messages: ChatMessage[]
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
    }

    const cfg = await loadPlatformConfig()
    const system = bizChatSystemPrompt(
      { bizName, bizType, greeting, services, hours, depositPolicy, depositAmount, mode, tone, instructions, maxDiscount },
      resolvedPrompt(cfg, 'biz-chat'),
    )
    const fullMessages: ChatMessage[] = [{ role: 'system', content: system }, ...messages]

    const upstream = await openrouterChat(fullMessages, { stream: true, max_tokens: 300, ...modelChain(cfg) })

    if (!upstream.ok) {
      const err = await upstream.text()
      return new Response(JSON.stringify({ error: err }), { status: upstream.status })
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
}
