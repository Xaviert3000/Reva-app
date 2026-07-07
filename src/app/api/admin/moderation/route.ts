import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Cola de moderación para el super-admin.
//  GET   → submissions pendientes.
//  PATCH → { id, decision: 'approved' | 'rejected' }.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const db = createAdminClient()
  const { data, error } = await db
    .from('moderation_queue')
    .select('id,biz_id,biz_name,mono,grad_from,grad_to,tipo,nivel,que,status,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { id, decision } = await req.json()
  if (!id || (decision !== 'approved' && decision !== 'rejected')) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }
  const db = createAdminClient()
  const { error } = await db.from('moderation_queue').update({ status: decision }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
