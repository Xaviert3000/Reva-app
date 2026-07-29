// Traduce los campos de un producto del catálogo entre español e inglés para que
// el Autoservicio (kiosko) los muestre en el idioma que elige el cliente.
// El dueño escribe en UN idioma (`source`); aquí generamos el otro y devolvemos el
// objeto bilingüe `i18n` listo para guardar en `services.i18n`.
//
// Se llama desde el editor del catálogo al guardar (ver lib/catalog.ts). Server-side
// porque la API key de OpenRouter es secreta. Si falla, el llamador guarda sin
// traducción y el kiosko cae al texto base.
import { openrouterJSON, type ChatMessage } from '@/lib/openrouter'
import { enforceRateLimit } from '@/lib/rate-limit'

export const maxDuration = 20

type Lang = 'es' | 'en'
type Bi = { es: string; en: string }

interface Body {
  name?: string
  description?: string
  category?: string
  source?: Lang
}

const LANG_NAME: Record<Lang, string> = { es: 'Spanish', en: 'English' }

export async function POST(req: Request) {
  // Límite generoso: el dueño traduce su propio catálogo (el botón "Traducir todo"
  // dispara una petición por producto). Scope propio para no chocar con el chat.
  const limited = enforceRateLimit(req, 'translate', 120, 60_000)
  if (limited) return limited
  try {
    const { name = '', description = '', category = '', source = 'es' } = (await req.json()) as Body
    const src: Lang = source === 'en' ? 'en' : 'es'
    const tgt: Lang = src === 'es' ? 'en' : 'es'

    const name0 = name.trim()
    const desc0 = description.trim()
    const cat0 = category.trim()

    // Si no hay nada que traducir, devuelve el bilingüe con el mismo texto en ambos.
    const bi = (v: string): Bi => ({ [src]: v, [tgt]: v } as Bi)
    if (!name0 && !desc0 && !cat0) {
      return Response.json({ i18n: { name: bi(''), sub: bi(''), category: bi('') } })
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          `You translate short restaurant/shop menu fields from ${LANG_NAME[src]} to ${LANG_NAME[tgt]}. ` +
          `Translate naturally as a menu would read — concise, appetizing, no explanations. ` +
          `Keep brand/proper names, measurements and prices unchanged. Preserve capitalization style. ` +
          `If a field is empty, return it empty. Reply ONLY with JSON: {"name":"...","description":"...","category":"..."}.`,
      },
      {
        role: 'user',
        content: JSON.stringify({ name: name0, description: desc0, category: cat0 }),
      },
    ]

    let tr: { name?: string; description?: string; category?: string } = {}
    try {
      tr = await openrouterJSON(messages, { temperature: 0.2, max_tokens: 300 })
    } catch {
      // Si la IA falla, cae a repetir el texto base en ambos idiomas (mejor eso que
      // romper el guardado del producto).
      tr = { name: name0, description: desc0, category: cat0 }
    }

    // Compón el objeto bilingüe: idioma fuente = texto original, destino = traducción.
    const pair = (orig: string, trans?: string): Bi =>
      ({ [src]: orig, [tgt]: (trans ?? '').trim() || orig } as Bi)

    const i18n = {
      name: pair(name0, tr.name),
      sub: pair(desc0, tr.description),
      category: pair(cat0, tr.category),
    }
    return Response.json({ i18n })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
}
