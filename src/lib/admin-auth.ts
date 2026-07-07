// Verificación de super-admin (Fase 9). El acceso ya NO es una contraseña fija:
// el usuario inicia sesión con Supabase y su correo debe estar en la allowlist
// del entorno `ADMIN_EMAILS` (coma-separado). Server-only.
import { createClient } from './supabase/server'

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? 'admin@reva.mx')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}

// Devuelve el usuario si tiene sesión y es admin; si no, null.
export async function requireAdmin(): Promise<{ userId: string; email: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return { userId: user.id, email: user.email ?? '' }
}
