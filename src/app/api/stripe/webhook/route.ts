import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { finalizeKioskSession } from '@/lib/kiosk-finalize'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

// Convierte un timestamp Unix (segundos) de Stripe a ISO, o null.
function tsToISO(unix: number | null | undefined): string | null {
  return unix ? new Date(unix * 1000).toISOString() : null
}

// El fin del periodo en curso (próximo cobro) migró de la suscripción a sus
// items en versiones recientes de la API. Leemos donde esté presente.
function periodEndOf(sub: Stripe.Subscription): number | null {
  const anySub = sub as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } }
  return anySub.current_period_end ?? anySub.items?.data?.[0]?.current_period_end ?? null
}

// El id de suscripción de una factura también cambió de lugar entre versiones.
function subscriptionIdOf(inv: Stripe.Invoice): string | null {
  const anyInv = inv as unknown as {
    subscription?: string | { id: string } | null
    parent?: { subscription_details?: { subscription?: string | { id: string } } }
    lines?: { data?: { subscription?: string | { id: string } }[] }
  }
  const raw = anyInv.subscription
    ?? anyInv.parent?.subscription_details?.subscription
    ?? anyInv.lines?.data?.[0]?.subscription
    ?? null
  return typeof raw === 'string' ? raw : raw?.id ?? null
}

function customerIdOf(obj: { customer?: string | { id: string } | null }): string | null {
  return typeof obj.customer === 'string' ? obj.customer : obj.customer?.id ?? null
}

// Mapea el status de una suscripción de Stripe al que guardamos en businesses.
function planStatusOf(status: string): string {
  if (status === 'trialing') return 'trialing'
  if (status === 'active') return 'active'
  if (status === 'past_due' || status === 'unpaid') return 'past_due'
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled'
  return status
}

// Sincroniza el estado de la suscripción hacia la fila del negocio. Localiza el
// negocio por metadata, por id de suscripción o por customer (en ese orden).
async function syncSubscription(db: SupabaseClient, sub: Stripe.Subscription) {
  const bizId = sub.metadata?.biz_id || null
  const patch = {
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerIdOf(sub),
    plan_status: planStatusOf(sub.status),
    current_period_end: tsToISO(periodEndOf(sub)),
    trial_ends_at: tsToISO(sub.trial_end) ?? undefined,
    plan_cancel_at_period_end: !!sub.cancel_at_period_end,
  }
  // No pisamos trial_ends_at con undefined: sólo lo actualizamos si Stripe lo trae.
  if (patch.trial_ends_at === undefined) delete (patch as Record<string, unknown>).trial_ends_at

  let q = db.from('businesses').update(patch)
  if (bizId) q = q.eq('id', bizId)
  else if (patch.stripe_customer_id) q = q.eq('stripe_customer_id', patch.stripe_customer_id)
  else q = q.eq('stripe_subscription_id', sub.id)
  await q
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Los webhooks no tienen sesión de usuario ni cookies; usar la service role.
  const supabase = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { user_id, biz_id, reservation_id, type, tier, days, service_id } = session.metadata!

    if (type === 'kiosk') {
      // Pago con tarjeta por QR del Autoservicio. Respaldo del sondeo del kiosko:
      // registra la venta de forma idempotente (si el sondeo ya la registró, es
      // no-op). Garantiza que un pago confirmado SIEMPRE quede asentado, aunque el
      // navegador del kiosko se haya cerrado.
      await finalizeKioskSession(session.id)
      return NextResponse.json({ received: true })
    }

    if (type === 'order') {
      // Pedido ecommerce pagado: pasa a 'paid' para que el negocio lo prepare.
      const order_id = session.metadata!.order_id
      await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order_id)
      await supabase.from('payments').insert({
        user_id, biz_id,
        reservation_id: null,
        stripe_session_id: session.id,
        amount: session.amount_total! / 100,
        type: 'order',
        status: 'paid',
      })
      return NextResponse.json({ received: true })
    }

    if (type === 'subscription') {
      // La suscripción al Plan Reva se creó en Checkout. Vinculamos la sub al
      // negocio; el estado, el próximo cobro y las facturas llegan por los
      // eventos customer.subscription.* e invoice.*.
      const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      if (subId) {
        const sub = await getStripe().subscriptions.retrieve(subId)
        await syncSubscription(supabase, sub)
      }
      return NextResponse.json({ received: true })
    }

    if (type === 'deposit') {
      await supabase.from('reservations').update({ deposit_paid: true, status: 'confirmed' }).eq('id', reservation_id)
    } else if (type === 'featured') {
      // Recién ahora que Stripe confirmó el pago activamos la visibilidad.
      // `featured_until` marca el vencimiento del plan comprado. La fila pending de
      // featured_items (creada en checkout) se activa; el trigger recompone las
      // columnas de resumen en `businesses`. Permite varios destacados a la vez.
      const n = Number(days)
      const until = n > 0 ? new Date(Date.now() + n * 86_400_000).toISOString() : null

      // 1) Activa por session_id (la fila pending ya lo trae). `neq('active')`
      //    hace el reintento del webhook idempotente.
      let { data: rows } = await supabase.from('featured_items')
        .update({ status: 'active', featured_until: until })
        .eq('stripe_session_id', session.id)
        .neq('status', 'active')
        .select('id')

      // 2) Respaldo: si no matcheó por session_id (no se guardó al crear la
      //    sesión), actívala por el id de la metadata.
      if (!rows || rows.length === 0) {
        const fid = session.metadata!.featured_item_id
        if (fid) {
          const r = await supabase.from('featured_items')
            .update({ status: 'active', featured_until: until, stripe_session_id: session.id })
            .eq('id', fid).eq('status', 'pending').select('id')
          rows = r.data ?? null
        }
      }

      // 3) Respaldo total (flujo viejo sin fila pending): inserta desde la
      //    metadata, ignorando duplicados por session_id (idempotente).
      if (!rows || rows.length === 0) {
        const kind = session.metadata!.featured_kind || (service_id ? 'service' : 'business')
        await supabase.from('featured_items').upsert({
          biz_id,
          kind,
          tier: tier || 'destacado',
          featured_until: until,
          service_id: kind === 'service' ? (service_id || null) : null,
          event: null,
          stripe_session_id: session.id,
          status: 'active',
        }, { onConflict: 'stripe_session_id', ignoreDuplicates: true })
      }
    }

    await supabase.from('payments').insert({
      user_id, biz_id,
      // reservation_id es uuid; en pagos de Destacado no hay reserva asociada.
      reservation_id: reservation_id || null,
      stripe_session_id: session.id,
      amount: session.amount_total! / 100,
      type,
      status: 'paid',
    })
  } else if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    // Cambios de la suscripción del negocio: prueba, activación, morosidad,
    // cancelación. Refleja estado y próximo cobro en la fila del negocio.
    await syncSubscription(supabase, event.data.object as Stripe.Subscription)
  } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    // Factura mensual de la suscripción. La reflejamos en `invoices` (cobros
    // aplicados / próxima factura para el super admin) y, si se pagó, la sumamos
    // a `payments` como ingreso de Reva (tipo 'subscription').
    const inv = event.data.object as Stripe.Invoice
    const subId = subscriptionIdOf(inv)
    const customerId = customerIdOf(inv)

    // Localiza el negocio dueño de la factura por suscripción o por customer.
    let bizId: string | null = null
    if (subId) {
      const { data } = await supabase.from('businesses').select('id').eq('stripe_subscription_id', subId).maybeSingle()
      bizId = data?.id ?? null
    }
    if (!bizId && customerId) {
      const { data } = await supabase.from('businesses').select('id').eq('stripe_customer_id', customerId).maybeSingle()
      bizId = data?.id ?? null
    }

    const paid = event.type === 'invoice.paid'
    const line = inv.lines?.data?.[0] as unknown as { period?: { start?: number; end?: number } } | undefined
    const amount = (paid ? inv.amount_paid : inv.amount_due) / 100

    await supabase.from('invoices').upsert({
      id: inv.id!,
      biz_id: bizId,
      stripe_subscription_id: subId,
      amount,
      currency: inv.currency || 'mxn',
      status: inv.status || (paid ? 'paid' : 'open'),
      period_start: tsToISO(line?.period?.start),
      period_end: tsToISO(line?.period?.end),
      due_date: tsToISO(inv.due_date),
      paid_at: paid ? new Date().toISOString() : null,
      hosted_invoice_url: inv.hosted_invoice_url ?? null,
    }, { onConflict: 'id' })

    if (bizId) {
      if (paid) {
        // Ingreso real de Reva por el plan. Idempotente por stripe_session_id
        // (usamos el id de la factura, único por cobro mensual).
        await supabase.from('payments').upsert({
          biz_id: bizId,
          stripe_session_id: inv.id!,
          amount,
          type: 'subscription',
          status: 'paid',
        }, { onConflict: 'stripe_session_id' })
        await supabase.from('businesses').update({ plan_status: 'active' }).eq('id', bizId)
      } else {
        await supabase.from('businesses').update({ plan_status: 'past_due' }).eq('id', bizId)
      }
    }
  }

  return NextResponse.json({ received: true })
}
