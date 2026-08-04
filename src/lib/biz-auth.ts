// Guardias server-side de acceso al negocio (por rol/permisos). Se usan en las
// rutas /api/biz/* para que los permisos no sean solo cosméticos: aunque un
// empleado conozca la URL de un módulo al que no tiene acceso, la API lo rechaza.
import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'
import { BizRole, BizPermissions, canAccessModule, isFullAccess, normalizeRole } from './biz-roles'

export interface BizMembership {
  userId: string
  bizId: string
  role: BizRole
  permissions: BizPermissions | null
}

// Devuelve la membresía del usuario en sesión para `bizId`, o null si no hay
// sesión o no es miembro de ese negocio.
export async function getBizMembership(bizId: string): Promise<BizMembership | null> {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('biz_members')
    .select('role,permissions')
    .eq('user_id', user.id)
    .eq('biz_id', bizId)
    .maybeSingle()
  if (!member) return null

  const perms = member.permissions as BizPermissions | null
  return { userId: user.id, bizId, role: normalizeRole(member.role as string), permissions: perms ?? null }
}

// Exige que el usuario en sesión sea miembro de `bizId` y (si se pasa moduleId)
// tenga acceso a ese submódulo. Devuelve la membresía o null si no cumple.
export async function requireBizAccess(bizId: string, moduleId?: string): Promise<BizMembership | null> {
  const m = await getBizMembership(bizId)
  if (!m) return null
  if (moduleId && !canAccessModule(m.role, m.permissions, moduleId)) return null
  return m
}

// Como requireBizAccess, pero basta con tener acceso a CUALQUIERA de los módulos
// dados (p. ej. la API de métricas la usan Métricas, Informes y Promociones).
export async function requireBizAnyModule(bizId: string, moduleIds: string[]): Promise<BizMembership | null> {
  const m = await getBizMembership(bizId)
  if (!m) return null
  if (moduleIds.some(id => canAccessModule(m.role, m.permissions, id))) return m
  return null
}

// Exige rol de gestión (dueño/admin) — p. ej. para administrar el equipo.
export async function requireBizManager(bizId: string): Promise<BizMembership | null> {
  const m = await getBizMembership(bizId)
  if (!m || !isFullAccess(m.role)) return null
  return m
}
