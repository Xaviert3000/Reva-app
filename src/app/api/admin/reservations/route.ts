import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Estados que NO cuentan como reserva efectiva (canceladas / no-show).
const DEAD_STATUS = new Set(['cancelled', 'no_show'])

// Reservas recientes de toda la plataforma (con nombre del negocio) para el admin.
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('reservations')
    .select('id,biz_id,user_id,slot,party,status,notes,created_at, businesses(name,hood)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Nombre del cliente desde profiles.
  const userIds = [...new Set((data ?? []).map(r => r.user_id).filter(Boolean))] as string[]
  const names: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profs } = await db.from('profiles').select('id,full_name').in('id', userIds)
    for (const p of profs ?? []) names[p.id as string] = (p.full_name as string) || ''
  }
  const reservations = (data ?? []).map(r => ({ ...r, guest_name: r.user_id ? (names[r.user_id] || 'Cliente') : 'Cliente' }))

  // Agregados reales sobre TODAS las reservas (no solo las 200 recientes) para
  // el Resumen: total del mes en curso + conteo por negocio. Consulta ligera
  // (solo las columnas necesarias) para no traer payloads grandes.
  const stats = { month: 0, total: 0, byBiz: {} as Record<string, number> }
  const { data: allRes } = await db
    .from('reservations')
    .select('biz_id,slot,status,created_at')
    .limit(5000)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  for (const r of allRes ?? []) {
    if (DEAD_STATUS.has((r.status as string) || '')) continue
    stats.total += 1
    if (r.biz_id) stats.byBiz[r.biz_id as string] = (stats.byBiz[r.biz_id as string] ?? 0) + 1
    const when = r.slot || r.created_at
    if (when && new Date(when as string).getTime() >= monthStart) stats.month += 1
  }

  return NextResponse.json({ reservations, stats })
}
