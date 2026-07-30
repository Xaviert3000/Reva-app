import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Usuarios reales de la app para el super-admin. Incluye tanto a los clientes
// (perfiles de la app) como a los dueños de negocio (biz_members), marcados con
// `type` para distinguirlos; los repartidores (couriers) sí se excluyen porque
// son personal operativo. Junta email/teléfono desde auth.users y agrega la
// actividad: reservas, pedidos, reseñas, gasto y saldo Reva+. Solo lectura,
// mismo patrón que /api/admin/reservations.

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  type: 'owner' | 'customer'
  bizName: string
  mode: string
  lang: string
  created_at: string
  reservas: number
  pedidos: number
  resenas: number
  gasto: number
  tickets: number
}

// Trae TODOS los usuarios de auth por páginas (la API pagina de a 1000).
async function listAllAuthUsers(admin: ReturnType<typeof createAdminClient>) {
  const map = new Map<string, { email: string; phone: string }>()
  const perPage = 1000
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage })
    const users = data?.users ?? []
    for (const u of users) {
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>
      const phone = (u.phone as string) || (meta.phone as string) || (meta.telefono as string) || ''
      map.set(u.id, { email: u.email ?? '', phone })
    }
    if (users.length < perPage) break
  }
  return map
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()

  // Perfiles + membresías de negocio (para marcar dueños y su negocio) +
  // repartidores (esos sí se excluyen, son personal operativo).
  const [{ data: profiles, error }, { data: members }, { data: couriers }, authUsers] = await Promise.all([
    db.from('profiles').select('id,full_name,mode,lang,created_at').order('created_at', { ascending: false }).limit(5000),
    db.from('biz_members').select('user_id, businesses(name)'),
    db.from('couriers').select('user_id'),
    listAllAuthUsers(db),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Dueños de negocio → id → nombre de su negocio (el primero si tiene varios).
  const ownerBiz: Record<string, string> = {}
  for (const m of members ?? []) {
    const u = m.user_id as string | null
    if (!u) continue
    const biz = m.businesses as { name: string | null } | { name: string | null }[] | null
    const name = Array.isArray(biz) ? (biz[0]?.name ?? '') : (biz?.name ?? '')
    if (!(u in ownerBiz)) ownerBiz[u] = name || ''
  }
  const owners = new Set(Object.keys(ownerBiz))

  const exclude = new Set<string>()
  for (const c of couriers ?? []) if (c.user_id) exclude.add(c.user_id as string)

  const clientRows = (profiles ?? []).filter(p => !exclude.has(p.id as string))
  const ids = new Set(clientRows.map(p => p.id as string))

  // Agregados de actividad. Consultas ligeras (solo columnas necesarias) que
  // luego contamos/sumamos por usuario en memoria.
  const reservas: Record<string, number> = {}
  const pedidos: Record<string, number> = {}
  const resenas: Record<string, number> = {}
  const gasto: Record<string, number> = {}
  const tickets: Record<string, number> = {}

  const [res, ord, rev, pay, rt] = await Promise.all([
    db.from('reservations').select('user_id,status').limit(20000),
    db.from('orders').select('user_id,total,status,paid_at').limit(20000),
    db.from('reviews').select('user_id').limit(20000),
    db.from('payments').select('user_id,amount,type,status').eq('type', 'deposit').eq('status', 'paid').limit(20000),
    db.from('rove_tickets').select('user_id,delta').limit(50000),
  ])

  for (const r of res.data ?? []) {
    const u = r.user_id as string | null
    if (!u || !ids.has(u)) continue
    if (r.status === 'cancelled' || r.status === 'no_show') continue
    reservas[u] = (reservas[u] ?? 0) + 1
  }
  for (const o of ord.data ?? []) {
    const u = o.user_id as string | null
    if (!u || !ids.has(u)) continue
    pedidos[u] = (pedidos[u] ?? 0) + 1
    if (o.paid_at) gasto[u] = (gasto[u] ?? 0) + Number(o.total ?? 0)
  }
  for (const r of rev.data ?? []) {
    const u = r.user_id as string | null
    if (!u || !ids.has(u)) continue
    resenas[u] = (resenas[u] ?? 0) + 1
  }
  for (const p of pay.data ?? []) {
    const u = p.user_id as string | null
    if (!u || !ids.has(u)) continue
    gasto[u] = (gasto[u] ?? 0) + Number(p.amount ?? 0)
  }
  for (const t of rt.data ?? []) {
    const u = t.user_id as string | null
    if (!u || !ids.has(u)) continue
    tickets[u] = (tickets[u] ?? 0) + Number(t.delta ?? 0)
  }

  const customers: Customer[] = clientRows.map(p => {
    const id = p.id as string
    const auth = authUsers.get(id)
    return {
      id,
      name: (p.full_name as string) || '',
      email: auth?.email ?? '',
      phone: auth?.phone ?? '',
      type: owners.has(id) ? 'owner' : 'customer',
      bizName: ownerBiz[id] ?? '',
      mode: (p.mode as string) || 'explorer',
      lang: (p.lang as string) || 'es',
      created_at: p.created_at as string,
      reservas: reservas[id] ?? 0,
      pedidos: pedidos[id] ?? 0,
      resenas: resenas[id] ?? 0,
      gasto: gasto[id] ?? 0,
      tickets: tickets[id] ?? 0,
    }
  })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const stats = {
    total: customers.length,
    nuevosMes: customers.filter(c => c.created_at && new Date(c.created_at).getTime() >= monthStart).length,
    activos: customers.filter(c => c.reservas + c.pedidos + c.resenas > 0).length,
    vecinos: customers.filter(c => c.mode === 'vecino').length,
    duenos: customers.filter(c => c.type === 'owner').length,
  }

  return NextResponse.json({ customers, stats })
}
