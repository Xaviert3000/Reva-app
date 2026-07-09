import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Canjea el `code` del correo de confirmación (flujo PKCE) por una sesión y
// redirige a la app. Supabase manda al usuario aquí tras verificar el correo;
// sin este intercambio el enlace caía en `/?code=...` sin iniciar sesión.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` permite mandar a los negocios a /biz; por defecto la app cliente.
  const next = searchParams.get('next') ?? '/app'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Sin code o con error: manda a login con aviso.
  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
