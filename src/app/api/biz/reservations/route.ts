import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Reservas del negocio para el panel del dueño.
//  GET  ?biz_id=... → lista las reservas del negocio con el nombre del cliente.
//  PATCH { id, status } → confirma/rechaza/actualiza el estado de una reserva.
// La sesión (cookie) identifica al dueño; los datos se leen con el admin client
// para poder unir el perfil del cliente (RLS no deja leer perfiles ajenos).
export const dynamic = 'force-dynamic'

async function ownedBizIds(userId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId)
  return (data ?? []).map(r => r.biz_id as string)
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizIds = await ownedBizIds(user.id)
  if (bizIds.length === 0) return NextResponse.json({ reservations: [] })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  const targetIds = bizId ? bizIds.filter(id => id === bizId) : bizIds
  if (targetIds.length === 0) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from('reservations')
    .select('id,biz_id,user_id,service_id,slot,party,notes,status,deposit_paid,created_at')
    .in('biz_id', targetIds)
    .order('slot', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Nombre del cliente desde profiles (una sola consulta).
  const userIds = [...new Set((rows ?? []).map(r => r.user_id).filter(Boolean))] as string[]
  const names: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profs } = await admin.from('profiles').select('id,full_name').in('id', userIds)
    for (const p of profs ?? []) names[p.id as string] = (p.full_name as string) || ''
  }

  const reservations = (rows ?? []).map(r => ({
    ...r,
    guest_name: r.user_id ? (names[r.user_id] || 'Cliente') : 'Cliente',
  }))

  return NextResponse.json({ reservations })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id, status } = await req.json()
  const allowed = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']
  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: rsv } = await admin.from('reservations').select('id,biz_id').eq('id', id).maybeSingle()
  if (!rsv) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  const bizIds = await ownedBizIds(user.id)
  if (!bizIds.includes(rsv.biz_id as string)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { error } = await admin.from('reservations').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
