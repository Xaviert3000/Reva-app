import { createClient } from './server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Resuelve el usuario autenticado de una API route aceptando DOS orígenes:
 *
 *  1. Cookie de sesión de Supabase (SSR) — como siempre lo usa la web.
 *  2. Cabecera `Authorization: Bearer <access_token>` — la usa la app NATIVA
 *     (iOS/Android), que mantiene la sesión con el SDK de Supabase y no comparte
 *     cookies con el servidor.
 *
 * Devuelve el cliente Supabase (para reutilizarlo) y el usuario (o null). Es
 * retro-compatible: la web sigue funcionando por cookie sin cambios.
 */
export async function getRouteUser(
  req: Request,
): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const supabase = await createClient()

  // 1) Sesión por cookie (web).
  const cookieAuth = await supabase.auth.getUser()
  if (cookieAuth.data.user) return { supabase, user: cookieAuth.data.user }

  // 2) Token Bearer (app nativa).
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  const token = header?.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : null
  if (token) {
    const bearerAuth = await supabase.auth.getUser(token)
    if (bearerAuth.data.user) return { supabase, user: bearerAuth.data.user }
  }

  return { supabase, user: null }
}
