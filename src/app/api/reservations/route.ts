import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRouteUser } from '@/lib/supabase/route-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeAvailability } from '@/lib/availability'
import { issueStamp } from '@/lib/boomerangme'
import { issueTickets, completeReferral } from '@/lib/rove-db'

export async function POST(req: NextRequest) {
  // Acepta cookie (web) o Bearer token (app nativa).
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { biz_id, service_id, slot, party, notes, deposit_amount } = body
  const preferredResource: string | null = body.resource_id ?? null

  // Asignación de recurso + anti-conflicto. Sólo para reservas con calendario
  // (slot + servicio): elegimos un recurso libre a esa hora y guardamos la
  // duración. Si no hay ninguno libre → 409 (el horario se acaba de ocupar). El
  // exclusion constraint de la BD es la red final a prueba de carreras.
  let resourceId: string | null = null
  let durationMin: number | null = null
  if (slot && service_id) {
    const date = String(slot).slice(0, 10)
    const time = String(slot).slice(11, 16)
    try {
      const day = await computeAvailability(biz_id, service_id, date)
      durationMin = day.durationMin
      const match = day.slots.find(s => s.time === time)
      if (!match || match.free <= 0) {
        return NextResponse.json({ error: 'Ese horario ya no está disponible.', code: 'slot_taken' }, { status: 409 })
      }
      // Respeta el recurso pedido si sigue libre; si no, el sugerido por el motor.
      const preferOk = preferredResource && day.slots.some(s => s.time === time && s.resourceId === preferredResource)
      resourceId = preferOk ? preferredResource : match.resourceId
    } catch {
      // Si el motor falla, continuamos sin asignar recurso (la reserva entra sin
      // blindaje de solapamiento, como antes) en vez de bloquear al cliente.
    }
  }

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
      resource_id: resourceId,
      duration_min: durationMin,
      party,
      notes,
      deposit_amount: deposit_amount ?? 0,
      // Entra como pendiente: el negocio la confirma/rechaza desde su panel.
      status: 'pending',
    })
    .select()
    .single()

  // 23P01 = violación del exclusion constraint: otro cliente tomó el slot en la
  // carrera entre computeAvailability y el insert.
  if (error?.code === '23P01') {
    return NextResponse.json({ error: 'Ese horario ya no está disponible.', code: 'slot_taken' }, { status: 409 })
  }
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
