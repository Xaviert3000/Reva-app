// Finalización de un pago con tarjeta por QR del Autoservicio (kiosk).
// Es la ÚNICA fuente de verdad para registrar la venta: la llaman tanto el sondeo
// del kiosko (/api/kiosk/checkout/status) como el webhook de Stripe. Es idempotente
// — quien gane el candado (`kiosk_checkouts.finalized_at`) registra la venta; el
// otro es un no-op. Server-only: usa el service role y la API secreta de Stripe.
import { getStripe } from './stripe'
import { createAdminClient } from './supabase/admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface StagedItem { service_id?: string | null; name: string; unit_price: number; qty: number }

export interface FinalizeResult {
  paid: boolean
  folio?: string
  last4?: string | null
  error?: string
}

// Registra (una sola vez) la venta del kiosko asociada a una sesión de Stripe
// pagada: la asienta en pos_sales + pos_sale_items, crea el pedido en el tablero de
// Pedidos y descuenta inventario. Si el pago aún no se confirma, devuelve paid:false.
export async function finalizeKioskSession(sessionId: string): Promise<FinalizeResult> {
  const admin = createAdminClient()

  // 1) Fila de staging creada al abrir el Checkout. Sin ella no hay nada que hacer.
  const { data: staged } = await admin
    .from('kiosk_checkouts')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()
  if (!staged) return { paid: false, error: 'checkout no encontrado' }

  // 2) Ya finalizada antes: devuelve el folio existente (idempotencia).
  if (staged.finalized_at) return { paid: true, folio: staged.folio as string }

  // 3) Confirma con Stripe que el pago se completó y obtiene los últimos 4.
  let last4: string | null = null
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge'],
    })
    if (session.metadata?.biz_id && session.metadata.biz_id !== staged.biz_id) {
      return { paid: false, error: 'negocio no coincide' }
    }
    if (session.payment_status !== 'paid') return { paid: false }
    const pi = session.payment_intent
    const charge = pi && typeof pi !== 'string' ? pi.latest_charge : null
    if (charge && typeof charge !== 'string') last4 = charge.payment_method_details?.card?.last4 ?? null
  } catch (e) {
    return { paid: false, error: e instanceof Error ? e.message : 'Stripe error' }
  }

  // 4) Candado atómico: sólo quien logra pasar finalized_at de null → now() registra.
  //    Una segunda llamada concurrente actualiza 0 filas y cae a devolver el folio ya
  //    registrado, sin duplicar la venta.
  const { data: locked } = await admin
    .from('kiosk_checkouts')
    .update({ finalized_at: new Date().toISOString() })
    .eq('stripe_session_id', sessionId)
    .is('finalized_at', null)
    .select('*')
    .maybeSingle()
  if (!locked) {
    const { data: again } = await admin
      .from('kiosk_checkouts').select('folio').eq('stripe_session_id', sessionId).maybeSingle()
    return { paid: true, folio: (again?.folio as string) ?? (staged.folio as string) }
  }

  const bizId = locked.biz_id as string
  const folio = locked.folio as string
  const items = (locked.items as StagedItem[]) ?? []
  const en = locked.lang === 'en'
  const orderType = locked.order_type as 'here' | 'togo' | null

  try {
    // 4a) Venta en pos_sales (ingresos) + renglones. stripe_session_id evita, además
    //     del candado, un doble registro por el índice único.
    const { data: sale, error: saleErr } = await admin
      .from('pos_sales')
      .insert({
        biz_id: bizId,
        cashier_id: null,
        subtotal: locked.subtotal,
        tax_amount: locked.tax_amount,
        tax_rate: locked.tax_rate,
        total: locked.total,
        item_count: locked.item_count,
        payment_method: 'tarjeta',
        card_last4: last4,
        reference: en ? 'Self-service' : 'Autoservicio',
        folio,
        stripe_session_id: sessionId,
      })
      .select('id')
      .single()
    if (saleErr) throw saleErr
    const saleId = sale?.id as string

    const saleItems = items.map(it => ({
      sale_id: saleId,
      service_id: it.service_id && UUID_RE.test(it.service_id) ? it.service_id : null,
      name: it.name,
      unit_price: it.unit_price,
      qty: it.qty,
    }))
    if (saleItems.length > 0) {
      const { error: siErr } = await admin.from('pos_sale_items').insert(saleItems)
      if (siErr) throw siErr
    }

    // 4b) Pedido en el tablero de Pedidos (preparación/entrega), igual que una venta
    //     en local: status 'paid', canal 'kiosk', #folio como nombre para llamar.
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        user_id: null,
        biz_id: bizId,
        status: 'paid',
        channel: 'kiosk',
        fulfillment: 'pickup',
        customer_name: `#${folio}`,
        notes: orderType === 'togo' ? 'Para llevar' : orderType === 'here' ? 'Comer aquí' : null,
        subtotal: locked.subtotal,
        delivery_fee: 0,
        total: locked.total,
        confirmation_code: null,
        paid_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    let orderId: string | null = null
    if (orderErr) {
      // El pedido es aditivo: si falla, la venta YA quedó registrada. No abortamos.
      console.warn('[kiosk-finalize] no se pudo crear el pedido:', orderErr.message)
    } else {
      orderId = order?.id as string
      const orderItems = items.map(it => ({
        order_id: orderId,
        service_id: it.service_id && UUID_RE.test(it.service_id) ? it.service_id : null,
        name: it.name,
        unit_price: it.unit_price,
        qty: it.qty,
        line_total: it.unit_price * it.qty,
      }))
      if (orderItems.length > 0) {
        const { error: oiErr } = await admin.from('order_items').insert(orderItems)
        if (oiErr) console.warn('[kiosk-finalize] no se pudieron crear los renglones del pedido:', oiErr.message)
      }
    }

    // 4c) Descuenta inventario (sólo productos con seguimiento) de forma atómica.
    const sold = items
      .filter(it => it.service_id && UUID_RE.test(it.service_id))
      .map(it => ({ service_id: it.service_id, qty: it.qty }))
    if (sold.length > 0) {
      const { error: stockErr } = await admin.rpc('decrement_service_stock', { p_biz_id: bizId, p_items: sold })
      if (stockErr) console.warn('[kiosk-finalize] no se pudo descontar inventario:', stockErr.message)
    }

    // Referencias, best-effort (no afectan la venta ya registrada).
    await admin.from('kiosk_checkouts').update({ pos_sale_id: saleId, order_id: orderId }).eq('id', locked.id)

    return { paid: true, folio, last4 }
  } catch (e) {
    // Falló el registro tras tomar el candado: lo liberamos para permitir reintento
    // (por el siguiente sondeo o por el webhook), evitando quedar "pagado sin venta".
    await admin.from('kiosk_checkouts').update({ finalized_at: null }).eq('id', locked.id)
    return { paid: false, error: e instanceof Error ? e.message : 'No se pudo registrar la venta' }
  }
}
