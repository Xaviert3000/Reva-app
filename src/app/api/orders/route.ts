import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/orders → pedidos del cliente con sesión (para la pestaña Reservas/Trips).
// Sólo los ya pagados en adelante; los pending_payment abandonados no se muestran.
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select('*, businesses(name, hood), order_items(name,qty,unit_price,line_total)')
    .eq('user_id', user.id)
    .neq('status', 'pending_payment')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data ?? [] })
}
