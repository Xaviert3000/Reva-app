import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Reservas recientes de toda la plataforma (con nombre del negocio) para el admin.
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('reservations')
    .select('id,biz_id,user_id,slot,party,status,notes,created_at, businesses(name,hood)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Nombre del cliente desde profiles.
  const userIds = [...new Set((data ?? []).map(r => r.user_id).filter(Boolean))] as string[]
  const names: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profs } = await db.from('profiles').select('id,full_name').in('id', userIds)
    for (const p of profs ?? []) names[p.id as string] = (p.full_name as string) || ''
  }
  const reservations = (data ?? []).map(r => ({ ...r, guest_name: r.user_id ? (names[r.user_id] || 'Cliente') : 'Cliente' }))

  return NextResponse.json({ reservations })
}
