import { NextRequest, NextResponse } from 'next/server'
import { getStripe, commissionAmount } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { biz_id, biz_name, amount, reservation_id, type, tier, days, service_id, featured_kind, event } = await req.json()

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
