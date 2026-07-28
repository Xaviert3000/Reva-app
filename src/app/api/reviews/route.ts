import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRouteUser } from '@/lib/supabase/route-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { issueTickets } from '@/lib/rove-db'

// POST /api/reviews → alta de reseña del cliente sobre un negocio.
// Recibe { biz_id, rating (1-5), body?, lang? } y guarda al autor con sesión.
// Otorga 1 boleto Reva+ por reseña (regla review en TICKET_EARN_RULES).
export async function POST(req: NextRequest) {
  // Acepta cookie (web) o Bearer token (app nativa).
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const biz_id = typeof body.biz_id === 'string' ? body.biz_id : null
  const rating = Number(body.rating)
  const text: string | null = typeof body.body === 'string' ? body.body.trim() || null : null
  const lang: string = body.lang === 'en' ? 'en' : 'es'
  // Origen de la reseña (pedido o reserva) para no volver a pedirla al recargar.
  const order_id: string | null = typeof body.order_id === 'string' ? body.order_id : null
  const reservation_id: string | null = typeof body.reservation_id === 'string' ? body.reservation_id : null

  if (!biz_id) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return NextResponse.json({ error: 'rating debe ser 1-5' }, { status: 400 })

  // Nombre mostrado: metadatos de sesión → perfil → genérico.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  let author = (typeof meta.full_name === 'string' && meta.full_name.trim())
    || (typeof meta.name === 'string' && meta.name.trim())
    || null
  // Service role: funciona igual por cookie o por Bearer (con Bearer no hay
  // sesión de cookie, así que RLS de auth.uid() no aplica).
  const admin = createAdminClient()
  if (!author) {
    const { data: profile } = await admin
      .from('profiles').select('full_name').eq('id', user.id).single()
    author = profile?.full_name?.trim() || (lang === 'en' ? 'Reva guest' : 'Cliente Reva')
  }

  const { data: review, error } = await admin
    .from('reviews')
    .insert({ user_id: user.id, biz_id, rating, body: text, author, lang, order_id, reservation_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Boleto Reva+ por dejar la reseña (no bloqueante).
  issueTickets(user.id, 1, 'review', review.id).catch(console.error)

  return NextResponse.json({ review })
}

// GET /api/reviews → identifica qué pedidos/reservas ya reseñó el usuario, para
// que la pestaña Reservas muestre "Reseña publicada" tras recargar.
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('reviews')
    .select('order_id, reservation_id')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const orderIds = (data ?? []).map(r => r.order_id).filter(Boolean) as string[]
  const reservationIds = (data ?? []).map(r => r.reservation_id).filter(Boolean) as string[]
  return NextResponse.json({ orderIds, reservationIds })
}
