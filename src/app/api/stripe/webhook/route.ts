import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

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

    if (type === 'deposit') {
      await supabase.from('reservations').update({ deposit_paid: true, status: 'confirmed' }).eq('id', reservation_id)
    } else if (type === 'featured') {
      // Recién ahora que Stripe confirmó el pago activamos la visibilidad. El
      // constraint de la BD exige tier junto a featured=true; el default es
      // 'destacado'. `featured_until` marca el vencimiento del plan comprado.
      const n = Number(days)
      const until = n > 0 ? new Date(Date.now() + n * 86_400_000).toISOString() : null
      await supabase.from('businesses').update({
        featured: true,
        tier: tier || 'destacado',
        featured_until: until,
        // Producto destacado elegido en el panel; null = "Todo el negocio".
        featured_service_id: service_id || null,
      }).eq('id', biz_id)
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
  } else if (event.type === 'account.updated') {
    // Llega sólo si el endpoint escucha el ámbito "Cuentas conectadas".
    // Redundante con el refresco pull de /api/stripe/connect/status.
    const account = event.data.object
    await supabase.from('businesses').update({
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
    }).eq('stripe_account_id', account.id)
  }

  return NextResponse.json({ received: true })
}
