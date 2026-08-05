import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireBizManager } from '@/lib/biz-auth'
import { normalizeRole } from '@/lib/biz-roles'

export const dynamic = 'force-dynamic'

// Actividad de un empleado del negocio (para la ficha de detalle en Empleados).
//   GET ?biz_id=&member_id= → ventas cobradas + entregas hechas por ese miembro.
// Solo dueño/admin puede consultarlo. Las invitaciones pendientes no tienen
// actividad (aún no existe la cuenta), así que este endpoint solo aplica a
// miembros activos (biz_members), que sí tienen user_id.
export async function GET(req: NextRequest) {
  const bizId = req.nextUrl.searchParams.get('biz_id')
  const memberId = req.nextUrl.searchParams.get('member_id')
  if (!bizId || !memberId) return NextResponse.json({ error: 'biz_id y member_id requeridos' }, { status: 400 })
  if (!(await requireBizManager(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()
  const { data: member } = await db.from('biz_members').select('user_id,role').eq('id', memberId).eq('biz_id', bizId).maybeSingle()
  if (!member?.user_id) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
  const userId = member.user_id as string
  const role = normalizeRole(member.role as string)

  // Ventas cobradas por este empleado en el punto de venta (cashier_id).
  const { data: saleRows } = await db.from('pos_sales')
    .select('total,created_at').eq('biz_id', bizId).eq('cashier_id', userId).eq('status', 'paid')
  const sales = {
    count: saleRows?.length ?? 0,
    total: (saleRows ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0),
  }

  // Entregas completadas por este empleado como repartidor (orders.courier_id).
  const { data: deliveredRows } = await db.from('orders')
    .select('id,updated_at').eq('biz_id', bizId).eq('courier_id', userId).eq('status', 'delivered')
  // Entregas en curso ahora mismo (asignadas y aún no entregadas).
  const { count: activeDeliveries } = await db.from('orders')
    .select('id', { count: 'exact', head: true }).eq('biz_id', bizId).eq('courier_id', userId).in('status', ['out_for_delivery', 'ready', 'preparing'])
  const deliveries = {
    count: deliveredRows?.length ?? 0,
    active: activeDeliveries ?? 0,
  }

  // Última actividad conocida (venta o entrega más reciente).
  const stamps = [
    ...(saleRows ?? []).map(r => r.created_at as string),
    ...(deliveredRows ?? []).map(r => r.updated_at as string),
  ].filter(Boolean)
  const lastActiveAt = stamps.length ? stamps.reduce((a, b) => (a > b ? a : b)) : null

  return NextResponse.json({ role, sales, deliveries, lastActiveAt })
}
