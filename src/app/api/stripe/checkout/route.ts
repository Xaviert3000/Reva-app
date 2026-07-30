import { NextRequest, NextResponse } from 'next/server'
import { getStripe, commissionAmount, PLAN_MONTHLY_AMOUNT } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { biz_id, biz_name, amount, reservation_id, type, tier, days, service_id, featured_kind, event } = await req.json()

  // ── Suscripción al Plan Reva ($300/mes, 15 días de prueba) ──────────────
  // El dueño "activa el plan" desde /biz. Creamos una suscripción de Stripe que
  // respeta lo que quede de la prueba gratis y luego cobra mensualmente. El
  // webhook sincroniza estado, próximo cobro y facturas.
  if (type === 'subscription') {
    const admin = createAdminClient()
    const { data: member } = await admin.from('biz_members').select('biz_id').eq('user_id', user.id).eq('biz_id', biz_id).maybeSingle()
    if (!member) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const { data: biz } = await admin
      .from('businesses')
      .select('stripe_customer_id, stripe_subscription_id, plan_status, trial_ends_at, plan_amount')
      .eq('id', biz_id)
      .single()

    if (biz?.stripe_subscription_id && biz.plan_status === 'active') {
      return NextResponse.json({ error: 'Este negocio ya tiene un plan activo.' }, { status: 409 })
    }

    // Reutiliza el customer de Stripe del negocio o crea uno nuevo y lo guarda,
    // para que todas sus facturas queden bajo el mismo cliente.
    let customerId = biz?.stripe_customer_id ?? null
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email ?? undefined,
        name: biz_name || undefined,
        metadata: { biz_id: String(biz_id) },
      })
      customerId = customer.id
      await admin.from('businesses').update({ stripe_customer_id: customerId }).eq('id', biz_id)
    }

    // Días de prueba que aún quedan (>=1). Si ya venció, se cobra de inmediato.
    const trialMs = biz?.trial_ends_at ? new Date(biz.trial_ends_at).getTime() - Date.now() : 0
    const trialDays = Math.max(0, Math.ceil(trialMs / 86_400_000))
    const planAmount = Number(biz?.plan_amount) || PLAN_MONTHLY_AMOUNT

    const subSession = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: { name: 'Plan Reva', description: 'Suscripción mensual a la plataforma Reva' },
          unit_amount: Math.round(planAmount * 100),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: { biz_id: String(biz_id), user_id: user.id, type: 'subscription' },
      },
      metadata: { user_id: user.id, biz_id: String(biz_id), type: 'subscription' },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/biz?plan=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/biz?plan=cancelled`,
    })

    return NextResponse.json({ url: subSession.url })
  }

  // Al destacar un EVENTO guardamos sus datos ya (draft): sólo se vuelven visibles
  // cuando el webhook ponga featured=true al confirmarse el pago. Verificamos que
  // quien paga sea miembro del negocio antes de escribir en su fila.
  if (type === 'featured' && featured_kind === 'event' && event && typeof event === 'object') {
    const admin = createAdminClient()
    const { data: member } = await admin.from('biz_members').select('biz_id').eq('user_id', user.id).eq('biz_id', biz_id).maybeSingle()
    if (!member) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    const ev = {
      title: String(event.title ?? '').trim().slice(0, 120),
      date: String(event.date ?? '').trim().slice(0, 40) || null,
      description: String(event.description ?? '').trim().slice(0, 400) || null,
      image_url: String(event.image_url ?? '').trim() || null,
    }
    if (!ev.title) return NextResponse.json({ error: 'El evento necesita un título' }, { status: 400 })
    // A staging (pending): el webhook lo promueve a featured_event al confirmar el
    // pago. No tocamos el destacado activo por si el dueño cancela.
    await admin.from('businesses').update({ featured_event_pending: ev }).eq('id', biz_id)
  }

  // Un depósito lo paga el cliente y va al NEGOCIO; Reva se queda la comisión.
  // Un "Destacado" lo paga el negocio a Reva, así que no se reparte.
  let paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData | undefined
  if (type === 'deposit') {
    const admin = createAdminClient()
    const { data: biz } = await admin
      .from('businesses')
      .select('stripe_account_id, stripe_charges_enabled')
      .eq('id', biz_id)
      .single()

    if (!biz?.stripe_account_id || !biz.stripe_charges_enabled) {
      return NextResponse.json(
        { error: 'El negocio aún no completó su conexión con Stripe para recibir pagos.' },
        { status: 409 },
      )
    }

    paymentIntentData = {
      application_fee_amount: commissionAmount(amount), // 2% para Reva
      transfer_data: { destination: biz.stripe_account_id },
    }
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: 'mxn',
        product_data: {
          name: type === 'deposit'
            ? `Depósito · ${biz_name}`
            : `Destacado · ${biz_name}`,
          description: type === 'deposit'
            ? 'Depósito para reserva via Reva'
            : 'Destacado en la plataforma Reva',
        },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    ...(paymentIntentData ? { payment_intent_data: paymentIntentData } : {}),
    // El tier y los días viajan en la metadata para que el webhook active el
    // nivel correcto por la duración correcta recién cuando el pago se confirme.
    metadata: {
      user_id: user.id,
      biz_id,
      reservation_id: reservation_id ?? '',
      type,
      ...(tier ? { tier } : {}),
      ...(days != null ? { days: String(days) } : {}),
      ...(service_id ? { service_id: String(service_id) } : {}),
      // Qué se destaca: 'event' | 'service' | 'business'. El webhook lo usa para
      // dejar featured_event / featured_service_id de forma excluyente.
      ...(featured_kind ? { featured_kind: String(featured_kind) } : {}),
    },
    // Un depósito lo paga el cliente desde /app; un Destacado lo paga el negocio
    // desde /biz, así que cada uno regresa a su propio panel.
    success_url: type === 'featured'
      ? `${process.env.NEXT_PUBLIC_APP_URL}/biz?featured=success`
      : `${process.env.NEXT_PUBLIC_APP_URL}/app?payment=success`,
    cancel_url: type === 'featured'
      ? `${process.env.NEXT_PUBLIC_APP_URL}/biz?featured=cancelled`
      : `${process.env.NEXT_PUBLIC_APP_URL}/app?payment=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
