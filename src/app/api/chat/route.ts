import { openrouterChat, type ChatMessage } from '@/lib/openrouter'
import { conciergeSystemPrompt } from '@/lib/ai-prompts'
import { loadPlatformConfig, resolvedPrompt, modelChain } from '@/lib/platform-config'
import type { Mode, Business, Service } from '@/lib/data'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, mode, city, businesses, catalog } = await req.json() as {
      messages: ChatMessage[]
      mode: Mode
      city?: string
      businesses?: Business[]
      catalog?: Record<string, Service[]>
    }

    const cfg = await loadPlatformConfig()
    const promptId = mode === 'explorer' ? 'concierge-explorer' : 'concierge-vecino'
    const systemMsg: ChatMessage = {
      role: 'system',
      content: conciergeSystemPrompt(mode, resolvedPrompt(cfg, promptId), city, businesses, catalog),
    }
    const fullMessages: ChatMessage[] = [systemMsg, ...messages]

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
