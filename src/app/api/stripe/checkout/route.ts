import { NextRequest, NextResponse } from 'next/server'
import { getStripe, commissionAmount } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { biz_id, biz_name, amount, reservation_id, type } = await req.json()

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
    metadata: { user_id: user.id, biz_id, reservation_id, type },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?payment=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
