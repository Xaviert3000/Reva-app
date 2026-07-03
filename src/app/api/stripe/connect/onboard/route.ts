import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Inicia (o reanuda) el onboarding de Stripe Connect Express de un negocio.
// Crea la cuenta conectada si no existe, guarda el acct_... en Supabase y
// devuelve un Account Link donde el negocio captura sus datos y banco.
export async function POST(req: NextRequest) {
  const { biz_id, email } = await req.json()
  if (!biz_id) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })

  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data: biz, error } = await supabase
    .from('businesses')
    .select('id, name, stripe_account_id')
    .eq('id', biz_id)
    .single()
  if (error || !biz) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  try {
    let accountId = biz.stripe_account_id

    // Crear la cuenta Express la primera vez. Destination charges: la plataforma
    // es el comercio de registro, así que basta la capacidad de transfers.
    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: 'express',
        country: 'MX',
        email: email || undefined,
        capabilities: { transfers: { requested: true } },
        business_profile: { name: biz.name },
        metadata: { biz_id: biz.id },
      })
      accountId = account.id
      await supabase.from('businesses').update({ stripe_account_id: accountId }).eq('id', biz.id)
    }

    const link = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/biz?stripe=refresh&biz=${biz.id}`, // link expirado → reintentar
      return_url: `${appUrl}/biz?stripe=return&biz=${biz.id}`,   // volvió del onboarding → refrescar estado
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: link.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de Stripe'
    return NextResponse.json({ error: `Stripe: ${msg}` }, { status: 502 })
  }
}
