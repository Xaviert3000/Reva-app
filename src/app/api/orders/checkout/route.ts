import { NextRequest, NextResponse } from 'next/server'
import { getStripe, commissionAmount } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface ItemInput { service_id: string; qty: number }

// Crea un pedido (estado pending_payment) + sus líneas y abre un Checkout de
// Stripe Connect que cobra al cliente y transfiere al negocio (comisión 2% para
// Reva, igual que los depósitos). El webhook marca el pedido como pagado.
// Los precios NO se confían al cliente: se recalculan desde la BD por service_id.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const bizId: string | undefined = body.biz_id
  const items: ItemInput[] = Array.isArray(body.items) ? body.items : []
  const fulfillment: 'pickup' | 'delivery' = body.fulfillment === 'delivery' ? 'delivery' : 'pickup'
  const address: string | null = typeof body.address === 'string' ? body.address.trim() || null : null
  const customerName: string | null = typeof body.customer_name === 'string' ? body.customer_name.trim() || null : null
  const customerPhone: string | null = typeof body.customer_phone === 'string' ? body.customer_phone.trim() || null : null
  const notes: string | null = typeof body.notes === 'string' ? body.notes.trim() || null : null

  if (!bizId || items.length === 0) {
    return NextResponse.json({ error: 'Pedido vacío' }, { status: 400 })
  }
  if (fulfillment === 'delivery' && !address) {
    return NextResponse.json({ error: 'La entrega a domicilio necesita una dirección' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: biz } = await admin
    .from('businesses')
    .select('id,name,does_orders,pickup_enabled,delivery_enabled,delivery_fee,stripe_account_id,stripe_charges_enabled')
    .eq('id', bizId)
    .single()

  if (!biz || !biz.does_orders) {
    return NextResponse.json({ error: 'Este negocio no acepta pedidos' }, { status: 409 })
  }
  if (fulfillment === 'delivery' && !biz.delivery_enabled) {
    return NextResponse.json({ error: 'Este negocio no ofrece entrega a domicilio' }, { status: 409 })
  }
  if (!biz.stripe_account_id || !biz.stripe_charges_enabled) {
    return NextResponse.json(
      { error: 'El negocio aún no completó su conexión con Stripe para recibir pagos.' },
      { status: 409 },
    )
  }

  // Precios reales desde la BD (por service_id).
  const ids = items.map(i => i.service_id)
  const { data: svcRows } = await admin
    .from('services')
    .select('id,name,price')
    .in('id', ids)
    .eq('biz_id', bizId)

  const priced = items
    .map(i => {
      const svc = (svcRows ?? []).find(s => s.id === i.service_id)
      const qty = Math.max(1, Math.min(99, Math.floor(Number(i.qty) || 1)))
      const price = Number(svc?.price)
      if (!svc || !Number.isFinite(price) || price <= 0) return null
      return { service_id: svc.id, name: svc.name as string, unit_price: price, qty, line_total: price * qty }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  if (priced.length === 0) {
    return NextResponse.json({ error: 'Ningún producto del pedido tiene precio válido' }, { status: 400 })
  }

  const subtotal = priced.reduce((s, p) => s + p.line_total, 0)
  const deliveryFee = fulfillment === 'delivery' ? Number(biz.delivery_fee) || 0 : 0
  const total = subtotal + deliveryFee

  // Alta del pedido + líneas (service role: no dependemos de RLS de escritura).
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      biz_id: bizId,
      status: 'pending_payment',
      fulfillment,
      customer_name: customerName,
      customer_phone: customerPhone,
      address,
      notes,
      subtotal,
      delivery_fee: deliveryFee,
      total,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    console.error('orders/checkout: insert order error', orderErr)
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 })
  }

  const { error: itemsErr } = await admin
    .from('order_items')
    .insert(priced.map(p => ({ order_id: order.id, ...p })))
  if (itemsErr) {
    console.error('orders/checkout: insert items error', itemsErr)
    await admin.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 })
  }

  const lineItems = priced.map(p => ({
    price_data: {
      currency: 'mxn',
      product_data: { name: p.name },
      unit_amount: Math.round(p.unit_price * 100),
    },
    quantity: p.qty,
  }))
  if (deliveryFee > 0) {
    lineItems.push({
      price_data: { currency: 'mxn', product_data: { name: 'Entrega a domicilio' }, unit_amount: Math.round(deliveryFee * 100) },
      quantity: 1,
    })
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,
    line_items: lineItems,
    payment_intent_data: {
      application_fee_amount: commissionAmount(total), // 2% para Reva
      transfer_data: { destination: biz.stripe_account_id },
    },
    metadata: {
      type: 'order',
      order_id: order.id,
      biz_id: bizId,
      user_id: user.id,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?order=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?order=cancelled`,
  })

  return NextResponse.json({ url: session.url, order_id: order.id })
}
