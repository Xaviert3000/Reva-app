import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUSES = ['pending_payment', 'paid', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'] as const
type Status = typeof STATUSES[number]

async function ownerOf(bizId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId).eq('biz_id', bizId).maybeSingle()
  return !!data
}

// Sólo enlazamos service_id cuando es un UUID válido (la FK lo exige); si no, el
// renglón conserva igual su nombre y precio como snapshot. Igual que lib/pos.ts.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface InStoreItem { service_id?: string; name: string; unit_price: number; qty: number }

// POST /api/biz/orders → crea un pedido hecho EN EL LOCAL (Punto de venta o
// Autoservicio) directamente como 'paid', para que entre al tablero de Pedidos y
// corra el flujo de preparación/entrega. No pasa por Stripe (ya se cobró en caja
// o en la pantalla): el pago se registró aparte en pos_sales. Sin user_id (no hay
// cliente con sesión) y sin confirmation_code (no se pide código al recoger).
// body: { biz_id, channel:'pos'|'kiosk', fulfillment?, customer_name?, notes?,
//         subtotal, total, items:[{service_id?,name,unit_price,qty}] }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const bizId: string | undefined = body.biz_id
  const channel: string = body.channel === 'kiosk' ? 'kiosk' : 'pos'
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const rawItems: InStoreItem[] = Array.isArray(body.items) ? body.items : []
  const items = rawItems
    .map(i => {
      const qty = Math.max(1, Math.min(999, Math.floor(Number(i.qty) || 1)))
      const unit = Number(i.unit_price) || 0
      const name = typeof i.name === 'string' ? i.name.trim() : ''
      if (!name) return null
      return {
        service_id: i.service_id && UUID_RE.test(i.service_id) ? i.service_id : null,
        name, unit_price: unit, qty, line_total: unit * qty,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  if (items.length === 0) return NextResponse.json({ error: 'Pedido vacío' }, { status: 400 })

  const subtotal = Number(body.subtotal) || items.reduce((s, p) => s + p.line_total, 0)
  const total = Number(body.total) || subtotal
  const fulfillment: 'pickup' | 'delivery' = body.fulfillment === 'delivery' ? 'delivery' : 'pickup'
  const customerName: string | null = typeof body.customer_name === 'string' ? body.customer_name.trim() || null : null
  const notes: string | null = typeof body.notes === 'string' ? body.notes.trim() || null : null

  // 'pending_payment' = orden de Autoservicio "pagar en caja": aún no cobrada, la
  // cajera la cobra desde el Punto de venta (busca el folio) y ahí pasa a 'paid'.
  // Cualquier otro valor → 'paid' directo (POS y kiosko ya cobrados).
  const pending = body.status === 'pending_payment'
  const admin = createAdminClient()
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: null,
      biz_id: bizId,
      status: pending ? 'pending_payment' : 'paid',
      channel,
      fulfillment,
      customer_name: customerName,
      notes,
      subtotal,
      delivery_fee: 0,
      total,
      confirmation_code: null, // sin código: se recoge/entrega en caja
      paid_at: pending ? null : new Date().toISOString(),
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    console.error('[biz/orders] POST insert order error', orderErr)
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 })
  }

  const { error: itemsErr } = await admin
    .from('order_items')
    .insert(items.map(p => ({ order_id: order.id, ...p })))
  if (itemsErr) {
    console.error('[biz/orders] POST insert items error', itemsErr)
    await admin.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, order_id: order.id })
}

// GET /api/biz/orders?biz_id=... → pedidos del negocio (dueño), con líneas.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // ?pending_counter=1 → sólo las órdenes de Autoservicio "pagar en caja" aún sin
  // cobrar (pending_payment + canal kiosk), para que la cajera las cobre en el POS.
  const pendingCounter = req.nextUrl.searchParams.get('pending_counter') === '1'
  const admin = createAdminClient()
  let query = admin
    .from('orders')
    .select('*, order_items(id,service_id,name,qty,unit_price,line_total)')
    .eq('biz_id', bizId)
    .order('created_at', { ascending: false })
  query = pendingCounter
    ? query.eq('status', 'pending_payment').eq('channel', 'kiosk')
    : query.neq('status', 'pending_payment') // los no pagados no ensucian la bandeja
  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // El código de confirmación NUNCA se envía al panel: el dueño debe pedírselo
  // al cliente y capturarlo. Se omite de la respuesta.
  const orders = (data ?? []).map(o => {
    const row = { ...o }
    delete (row as Record<string, unknown>).confirmation_code
    return row
  })
  return NextResponse.json({ orders })
}

// PATCH /api/biz/orders → cambia estado y/o asigna repartidor.
// body: { id, biz_id, status?, courier_id? }
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const id: string | undefined = body.id
  const bizId: string | undefined = body.biz_id
  if (!id || !bizId) return NextResponse.json({ error: 'id y biz_id requeridos' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const patch: Record<string, unknown> = {}
  if (typeof body.status === 'string' && (STATUSES as readonly string[]).includes(body.status)) {
    patch.status = body.status as Status
    // Al cobrar una orden "pagar en caja" (pending_payment → paid) sella la fecha
    // de pago, para que cuente igual que cualquier pedido pagado.
    if (body.status === 'paid') patch.paid_at = new Date().toISOString()
  }
  if ('courier_id' in body) patch.courier_id = body.courier_id || null
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

  const admin = createAdminClient()

  // Al marcar ENTREGADO se exige el código de confirmación que el cliente da al
  // recibir. Se compara contra el guardado (server-side, nunca expuesto). Sin
  // coincidencia no se completa el pedido. Los pedidos legado sin código pasan.
  if (patch.status === 'delivered') {
    const { data: order } = await admin
      .from('orders')
      .select('confirmation_code,status')
      .eq('id', id)
      .eq('biz_id', bizId)
      .maybeSingle()
    if (order?.status !== 'delivered' && order?.confirmation_code) {
      const given = typeof body.confirmation_code === 'string' ? body.confirmation_code.trim() : ''
      if (given !== order.confirmation_code) {
        return NextResponse.json({ error: 'code_mismatch' }, { status: 422 })
      }
    }
  }

  const { error } = await admin.from('orders').update(patch).eq('id', id).eq('biz_id', bizId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
