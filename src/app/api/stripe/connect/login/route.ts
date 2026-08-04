import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Genera un Login Link de un solo uso al Stripe Express Dashboard del negocio.
// El dueño lo usa para ver su saldo, depósitos a su banco y calendario de pagos.
// El link expira en minutos, por eso se genera bajo demanda (no se persiste).
export async function POST(req: NextRequest) {
  const { biz_id } = await req.json()
  if (!biz_id) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })

  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: member } = await supabase.from('biz_members').select('biz_id').eq('user_id', user.id).eq('biz_id', biz_id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: biz } = await supabase
    .from('businesses')
    .select('stripe_account_id')
    .eq('id', biz_id)
    .single()

  if (!biz?.stripe_account_id) {
    return NextResponse.json({ error: 'Este negocio aún no ha conectado Stripe.' }, { status: 409 })
  }

  try {
    // createLoginLink sólo funciona en cuentas Express que ya completaron el
    // onboarding (details_submitted). Si no, Stripe responde con error y lo
    // reenviamos tal cual para que el dueño sepa que debe terminar su conexión.
    const link = await getStripe().accounts.createLoginLink(biz.stripe_account_id)
    return NextResponse.json({ url: link.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de Stripe'
    return NextResponse.json({ error: `Stripe: ${msg}` }, { status: 502 })
  }
}
