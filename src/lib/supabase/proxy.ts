import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refresca la sesión de Supabase en CADA request antes de que la route handler
// (o el Server Component) lea las cookies. Sin esto, el access token caduca
// (~1 h) y —por la rotación del refresh token— el servidor deja de ver al
// usuario, provocando 403 "No autorizado" en escrituras (p. ej. agregar una
// categoría en /admin) aunque el panel siga pareciendo logueado.
//
// Patrón oficial @supabase/ssr: no ejecutar código entre createServerClient y
// getUser(), y propagar las cookies refrescadas tanto al request como a la
// respuesta.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: no colocar lógica entre la creación del cliente y getUser().
  // getUser() dispara el refresco del token cuando hace falta.
  await supabase.auth.getUser()

  return response
}
