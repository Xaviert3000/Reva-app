import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Consulta el estado actual de la cuenta Connect de un negocio directo desde
// Stripe y lo persiste en Supabase. Se llama al volver del onboarding
// (return_url) — así no dependemos del webhook de "Cuentas conectadas".
export async function GET(req: NextRequest) {
  const biz_id = req.nextUrl.searchParams.get('biz_id')
  if (!biz_id) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: biz } = await supabase
    .from('businesses')
    .select('stripe_account_id')
    .eq('id', biz_id)
    .single()

  if (!biz?.stripe_account_id) {
    return NextResponse.json({ connected: false, charges_enabled: false, payouts_enabled: false })
  }

  try {
    const account = await stripe.accounts.retrieve(biz.stripe_account_id)
    const status = {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    }

    await supabase.from('businesses').update({
      stripe_charges_enabled: status.charges_enabled,
      stripe_payouts_enabled: status.payouts_enabled,
      stripe_details_submitted: status.details_submitted,
    }).eq('id', biz_id)

    return NextResponse.json({ connected: true, ...status })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de Stripe'
    return NextResponse.json({ connected: true, error: `Stripe: ${msg}`, charges_enabled: false, payouts_enabled: false }, { status: 502 })
  }
}
