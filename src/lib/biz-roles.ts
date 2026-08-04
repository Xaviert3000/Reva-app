// Roles y permisos de los empleados de un negocio. Fuente única de verdad,
// compartida por el panel (/biz), la API de equipo y el enforcement server-side.
// Sin dependencias de servidor: se puede importar desde el cliente.

// Roles del personal de un negocio.
//  - owner:      el dueño (se crea al registrar el negocio). Acceso total.
//  - admin:      mano derecha del dueño. Acceso total (incluye gestionar equipo).
//  - encargado:  turno/piso. Acceso amplio configurable; ve el PIN de anular/reembolsar.
//  - caja:       cobra. Acceso acotado (por defecto solo Ventas); NO ve el PIN.
//  - repartidor: reparte. NO entra al panel del negocio — usa el panel /courier.
export type BizRole = 'owner' | 'admin' | 'encargado' | 'caja' | 'repartidor'

// Etiqueta visible por rol (ES/EN).
export const ROLE_LABEL: Record<BizRole, { es: string; en: string }> = {
  owner: { es: 'Dueño', en: 'Owner' },
  admin: { es: 'Admin', en: 'Admin' },
  encargado: { es: 'Encargado', en: 'Manager' },
  caja: { es: 'Caja', en: 'Cashier' },
  repartidor: { es: 'Repartidor', en: 'Courier' },
}

// Roles que un dueño/admin puede asignar al invitar (owner no es asignable).
export const ASSIGNABLE_ROLES: BizRole[] = ['admin', 'encargado', 'caja', 'repartidor']

// Catálogo de módulos del panel, agrupado igual que el menú (NAV_GROUPS). Los
// `items` son los "submódulos" (las vistas). El id coincide con el id de la vista
// en /biz, para poder filtrar el menú y validar el acceso con el mismo dato.
export const MODULE_GROUPS: { id: string; es: string; en: string; items: { id: string; es: string; en: string }[] }[] = [
  { id: 'ops', es: 'Operación', en: 'Operations', items: [
    { id: 'requests', es: 'Solicitudes', en: 'Requests' },
    { id: 'orders', es: 'Pedidos', en: 'Orders' },
    { id: 'agenda', es: 'Agenda', en: 'Agenda' },
    { id: 'messages', es: 'Mensajes', en: 'Messages' },
    { id: 'comunicados', es: 'Comunicados', en: 'Announcements' },
  ] },
  { id: 'sales', es: 'Ventas', en: 'Sales', items: [
    { id: 'pos', es: 'Punto de venta', en: 'Point of sale' },
    { id: 'kiosk', es: 'Autoservicio', en: 'Self-service' },
    { id: 'scanner', es: 'Escáner', en: 'Scanner' },
    { id: 'sales', es: 'Ventas', en: 'Sales' },
    { id: 'promos', es: 'Promociones', en: 'Promotions' },
  ] },
  { id: 'catalog', es: 'Catálogo', en: 'Catalog', items: [
    { id: 'catalog', es: 'Catálogo', en: 'Catalog' },
    { id: 'inventory', es: 'Inventario', en: 'Inventory' },
    { id: 'destacado', es: 'Destacado', en: 'Featured' },
  ] },
  { id: 'analysis', es: 'Análisis', en: 'Analytics', items: [
    { id: 'metrics', es: 'Métricas', en: 'Metrics' },
    { id: 'reports', es: 'Informes', en: 'Reports' },
  ] },
]

// Todos los ids de submódulo (vistas) que existen.
export const ALL_MODULE_IDS: string[] = MODULE_GROUPS.flatMap(g => g.items.map(i => i.id))

// Permisos por defecto que sugiere cada rol al invitar. owner/admin no se listan
// porque ven todo (bypass). El dueño puede ajustar la lista por empleado.
export const DEFAULT_MODULES: Record<'encargado' | 'caja', string[]> = {
  // Encargado: todo menos análisis (métricas/informes) por defecto.
  encargado: ALL_MODULE_IDS.filter(id => id !== 'metrics' && id !== 'reports'),
  // Caja: solo lo necesario para cobrar.
  caja: ['pos', 'kiosk', 'scanner', 'sales'],
}

// Permisos guardados por empleado. `modules` es la lista blanca de submódulos.
export type BizPermissions = { modules: string[] }

// ¿El rol ve TODO sin importar `permissions`? (dueño y admin).
export function isFullAccess(role: BizRole): boolean {
  return role === 'owner' || role === 'admin'
}

// ¿El rol puede gestionar el equipo (invitar/quitar empleados)? Solo dueño/admin.
export function canManageTeam(role: BizRole): boolean {
  return isFullAccess(role)
}

// ¿El rol puede ver y configurar el PIN de autorización para anular/reembolsar?
// Solo dueño, admin y encargado.
export function canSeeVoidPin(role: BizRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'encargado'
}

// ¿El rol trabaja en el panel del negocio? El repartidor NO — usa /courier.
export function worksInBizPanel(role: BizRole): boolean {
  return role !== 'repartidor'
}

// ¿Este empleado puede entrar al submódulo `moduleId`? owner/admin siempre; el
// resto según su lista de permisos.
export function canAccessModule(role: BizRole, permissions: BizPermissions | null, moduleId: string): boolean {
  if (isFullAccess(role)) return true
  if (!worksInBizPanel(role)) return false
  const mods = permissions?.modules ?? DEFAULT_MODULES[role as 'encargado' | 'caja'] ?? []
  return mods.includes(moduleId)
}

// Normaliza a un rol válido (defensa ante valores viejos: 'staff' → admin).
export function normalizeRole(raw: string | null | undefined): BizRole {
  if (raw === 'owner' || raw === 'admin' || raw === 'encargado' || raw === 'caja' || raw === 'repartidor') return raw
  if (raw === 'staff') return 'admin'
  return 'admin'
}
