import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Lista de negocios para el super-admin, con conteo de miembros.
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()
  const { data: biz, error } = await db
    .from('businesses')
    .select('id,name,type,kind,hood,municipio,estado,featured,tier,agent_active,onboarded,grad_from,grad_to,mono,created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ businesses: biz ?? [] })
}
