// Verificación de super-admin (Fase 9). El acceso ya NO es una contraseña fija:
// el usuario inicia sesión con Supabase y su correo debe estar en la allowlist
// del entorno `ADMIN_EMAILS` (coma-separado) —super admins de arranque— o ser un
// miembro del equipo (`admin_team`) que ya aceptó su invitación (status 'activo').
// Server-only.
import { NextResponse } from 'next/server'
import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? 'admin@reva.mx')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

// Super admin "de arranque" definido por variable de entorno.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}

export type AdminRole = 'super_admin' | 'operador' | 'analista'
export type AdminSession = { userId: string; email: string; role: AdminRole }

// Módulos donde cada rol puede ESCRIBIR (mutar datos). El super admin puede todo.
// Operador: soporte, moderación y reservas. Analista: nada (solo lectura).
// Cualquier módulo fuera de la lista del operador queda reservado al super admin.
const WRITE_ACCESS: Record<AdminRole, readonly string[]> = {
  super_admin: [], // ver canWrite: el super admin siempre puede
  operador: ['support', 'moderation', 'reservations'],
  analista: [],
}

// ¿Puede este rol escribir (POST/PATCH/DELETE) en el módulo dado?
export function canWrite(role: AdminRole, moduleKey: string): boolean {
  if (role === 'super_admin') return true
  return WRITE_ACCESS[role].includes(moduleKey)
}

// Devuelve el usuario si tiene sesión y es admin; si no, null.
// Prioridad: allowlist de env (super admin) → equipo activado en `admin_team`.
export async function requireAdmin(): Promise<AdminSession | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const email = user.email

  if (isAdminEmail(email)) return { userId: user.id, email, role: 'super_admin' }

  // Miembro del equipo que ya aceptó su invitación (operador / analista).
  const db = createAdminClient()
  const { data } = await db.from('admin_team').select('role,status').eq('email', email.toLowerCase()).maybeSingle()
  if (data?.status === 'activo') {
    return { userId: user.id, email, role: data.role === 'analista' ? 'analista' : 'operador' }
  }
  return null
}

// Guard para handlers mutantes (POST/PATCH/DELETE). Devuelve `{ admin }` si la
// sesión puede escribir en el módulo, o `{ error }` con un 403 listo para
// retornar. Uso: `const g = await requireWriter('support'); if (g.error) return g.error`
export async function requireWriter(
  moduleKey: string,
): Promise<{ admin: AdminSession; error?: undefined } | { admin?: undefined; error: NextResponse }> {
  const admin = await requireAdmin()
  if (!admin) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
  if (!canWrite(admin.role, moduleKey)) {
    return { error: NextResponse.json({ error: 'No tienes permiso para esta acción.' }, { status: 403 }) }
  }
  return { admin }
}
