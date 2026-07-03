const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export interface OpenRouterOptions {
  model?: string
  models?: string[]      // cadena de respaldo cross-model (el 1º es el principal)
  temperature?: number
  max_tokens?: number
  stream?: boolean
  retries?: number       // reintentos ante 429/5xx/red (default 3)
  timeoutMs?: number     // timeout por intento, solo a la conexión (default 30s)
  signal?: AbortSignal
}

const DEFAULT_MODEL = () => process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'

// Cadena de respaldo entre MODELOS. Vacía por defecto (confiamos en el ruteo entre
// proveedores que OpenRouter ya hace para un mismo modelo). Para una red de
// seguridad extra ante saturación, define:
//   OPENROUTER_FALLBACK_MODELS="anthropic/claude-3.5-haiku,google/gemini-flash-1.5"
// Verifica los slugs vigentes en https://openrouter.ai/models
const FALLBACK_MODELS = () =>
  (process.env.OPENROUTER_FALLBACK_MODELS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// Backoff exponencial con jitter: ~0.5s, 1s, 2s, 4s… (tope 8s)
function backoffMs(attempt: number): number {
  return Math.min(8000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250)
}

// Respeta el header Retry-After (segundos) si viene; si no, usa backoff.
function retryAfterMs(res: Response, attempt: number): number {
  const ra = res.headers.get('retry-after')
  if (ra) {
    const secs = Number(ra)
    if (!Number.isNaN(secs)) return Math.min(15000, secs * 1000)
  }
  return backoffMs(attempt)
}

export async function openrouterChat(
  messages: ChatMessage[],
  opts: OpenRouterOptions = {},
): Promise<Response> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY not set')

  const retries = opts.retries ?? 3
  const timeoutMs = opts.timeoutMs ?? 30000
  const models = opts.models ?? [opts.model ?? DEFAULT_MODEL(), ...FALLBACK_MODELS()]

  const body = JSON.stringify({
    model: models[0],
    ...(models.length > 1 ? { models } : {}), // activa el fallback nativo de OpenRouter
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.max_tokens ?? 512,
    stream: opts.stream ?? false,
  })

  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    const ctrl = new AbortController()
    const onAbort = () => ctrl.abort()
    opts.signal?.addEventListener('abort', onAbort, { once: true })
    // El timeout solo protege el establecimiento de conexión: se limpia en cuanto
    // llegan las cabeceras, así que NO corta el streaming del cuerpo.
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)

    try {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
          'X-Title': 'Reva · Los Cabos AI Concierge',
        },
        body,
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      opts.signal?.removeEventListener('abort', onAbort)

      // Reintenta saturación (429) y errores de servidor (5xx). 4xx (auth, bad
      // request) NO se reintentan: fallarían igual.
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await res.body?.cancel()
        await sleep(retryAfterMs(res, attempt))
        continue
      }
      return res
    } catch (e) {
      clearTimeout(timer)
      opts.signal?.removeEventListener('abort', onAbort)
      if (opts.signal?.aborted) throw e // cancelado por el cliente: no reintentar
      lastErr = e
      if (attempt < retries) { await sleep(backoffMs(attempt)); continue }
      throw e
    }
  }
  throw lastErr ?? new Error('OpenRouter request failed')
}

// Extrae el JSON aunque el modelo lo envuelva en ```fences``` o texto extra.
function extractJSON(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim()
  const first = content.indexOf('{')
  const last = content.lastIndexOf('}')
  if (first !== -1 && last > first) return content.slice(first, last + 1)
  return content.trim()
}

export async function openrouterJSON<T>(
  messages: ChatMessage[],
  opts: OpenRouterOptions = {},
): Promise<T> {
  const res = await openrouterChat(messages, { ...opts, stream: false })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }
  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? ''
  return JSON.parse(extractJSON(content)) as T
}
