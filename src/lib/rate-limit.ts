// Rate-limit sencillo en memoria (ventana fija por clave). Protege las rutas de
// IA de abuso que quema créditos de OpenRouter. Nota: en serverless el estado es
// por instancia — no es un límite global perfecto, pero corta a un abusador que
// golpea una instancia caliente. Para un límite global usar Vercel Firewall/Upstash.

type Bucket = { count: number; reset: number }
const buckets = new Map<string, Bucket>()

// Purga perezosa para que el Map no crezca sin límite.
function purge(now: number) {
  if (buckets.size < 5000) return
  for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k)
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    purge(now)
    return { ok: true, retryAfter: 0 }
  }
  if (b.count >= limit) return { ok: false, retryAfter: Math.max(1, Math.ceil((b.reset - now) / 1000)) }
  b.count++
  return { ok: true, retryAfter: 0 }
}

// Identifica al cliente por IP (cabeceras de proxy de Vercel).
export function clientKey(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || ''
  return xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}

// Aplica el límite y devuelve una Response 429 si se excede; null si pasa.
export function enforceRateLimit(req: Request, scope: string, limit = 20, windowMs = 60_000): Response | null {
  const { ok, retryAfter } = rateLimit(`${scope}:${clientKey(req)}`, limit, windowMs)
  if (ok) return null
  return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Intenta en un momento.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
  })
}
