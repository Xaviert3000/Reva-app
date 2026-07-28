import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRouteUser } from '@/lib/supabase/route-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { issueStamp } from '@/lib/boomerangme'
import { issueTickets, completeReferral } from '@/lib/rove-db'

export async function POST(req: NextRequest) {
  // Acepta cookie (web) o Bearer token (app nativa).
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { biz_id, service_id, slot, party, notes, deposit_amount } = body

  // Insert con service role y user_id explícito: funciona igual por cookie o por
  // Bearer (con Bearer no hay sesión de cookie, así que RLS de auth.uid() no aplica).
  const admin = createAdminClient()
  const { data: reservation, error } = await admin
    .from('reservations')
    .insert({
      user_id: user.id,
      biz_id,
      service_id: service_id ?? null,
      slot,
      party,
      notes,
      deposit_amount: deposit_amount ?? 0,
      // Entra como pendiente: el negocio la confirma/rechaza desde su panel.
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Issue loyalty stamp via BoomerangMe (non-blocking)
  issueStamp(user.id, biz_id, 2).catch(console.error)
  // Boletos Reva+ por la reserva; si el usuario vino de un referido, acredita al referidor.
  issueTickets(user.id, 2, 'reservation', reservation.id).catch(console.error)
  completeReferral(user.id).catch(console.error)

  return NextResponse.json({ reservation })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('reservations')
    .select('*, businesses(name, hood, type)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservations: data })
}
