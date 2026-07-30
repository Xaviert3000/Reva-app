import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Proxy (antes "middleware", renombrado en Next 16). Refresca la sesión de
// Supabase en cada request para que las route handlers y Server Components
// siempre vean un token vigente. Ver src/lib/supabase/proxy.ts.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Corre en todo excepto assets estáticos. IMPORTANTE: NO excluir `/api`,
  // porque es justo ahí donde se hacen las escrituras que necesitan el token
  // ya refrescado.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
