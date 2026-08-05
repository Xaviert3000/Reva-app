import { NextRequest, NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase/route-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Estados que el repartidor puede fijar (solo su tramo de entrega).
const COURIER_STATUSES = ['out_for_delivery', 'delivered'] as const

// GET /api/courier/orders → pedidos de entrega asignados al repartidor con sesión.
// Acepta cookie (web) o `Authorization: Bearer <token>` (app nativa) vía getRouteUser.
export async function GET(req: NextRequest) {
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminClient()
  // ¿Es repartidor? (para devolver también el nombre del negocio)
  const { data: courier } = await admin.from('couriers').select('biz_id,active,name').eq('user_id', user.id).maybeSingle()
  if (!courier || !courier.active) return NextResponse.json({ error: 'No es repartidor activo' }, { status: 403 })

  const { data, error } = await admin
    .from('orders')
    .select('id,status,fulfillment,customer_name,customer_phone,address,notes,total,eta_at,created_at,businesses:biz_id(name), order_items(name,qty)')
    .eq('courier_id', user.id)
    .in('status', ['ready', 'out_for_delivery', 'delivered'])
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data ?? [], courier: { name: courier.name } })
}

// PATCH /api/courier/orders → el repartidor marca "en camino" o "entregado".
// body: { id, status }
export async function PATCH(req: NextRequest) {
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const id: string | undefined = body.id
  const status: string = body.status
  if (!id || !(COURIER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: courier } = await admin.from('couriers').select('active').eq('user_id', user.id).maybeSingle()
  if (!courier || !courier.active) return NextResponse.json({ error: 'No es repartidor activo' }, { status: 403 })

  // Al salir "en camino" el repartidor puede fijar un ETA (minutos hasta llegar);
  // lo guardamos como hora absoluta para que el cliente vea la cuenta regresiva.
  const patch: Record<string, unknown> = { status }
  if (status === 'out_for_delivery') {
    const mins = Number(body.eta_minutes)
    if (Number.isFinite(mins) && mins > 0 && mins <= 240) {
      patch.eta_at = new Date(Date.now() + mins * 60_000).toISOString()
    }
  }

  // Al marcar ENTREGADO se exige el código de confirmación: el repartidor se lo
  // pide al cliente y lo captura. Se valida contra el guardado (que el repartidor
  // nunca ve). Sin coincidencia, no se cierra la entrega.
  if (status === 'delivered') {
    const { data: order } = await admin
      .from('orders')
      .select('confirmation_code,status')
      .eq('id', id)
      .eq('courier_id', user.id)
      .maybeSingle()
    if (!order) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    if (order.status !== 'delivered' && order.confirmation_code) {
      const given = typeof body.confirmation_code === 'string' ? body.confirmation_code.trim() : ''
      if (given !== order.confirmation_code) {
        return NextResponse.json({ error: 'code_mismatch' }, { status: 422 })
      }
    }
  }

  // Sólo puede tocar pedidos asignados a él.
  const { error } = await admin.from('orders').update(patch).eq('id', id).eq('courier_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
