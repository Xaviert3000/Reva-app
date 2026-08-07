import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBizMembership, requireBizManager } from '@/lib/biz-auth'

// Recursos agendables del negocio (profesionales / sillones).
//   GET   ?biz_id=..           → lista los recursos del negocio
//   POST  { biz_id, name, .. } → crea (dueño/admin)
//   PATCH { id, ..campos }     → actualiza (dueño/admin)
//   DELETE ?id=..              → elimina (dueño/admin)
export const dynamic = 'force-dynamic'

interface ResBody {
  id?: string
  biz_id?: string
  name?: string
  kind?: string
  active?: boolean
  hours_json?: unknown
  sort_order?: number
}

// biz_id dueño de un recurso, o null si no existe.
async function bizOfResource(id: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('resources').select('biz_id').eq('id', id).maybeSingle()
  return (data?.biz_id as string) ?? null
}

export async function GET(req: NextRequest) {
  const bizId = req.nextUrl.searchParams.get('biz_id')
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  // Basta con ser miembro del negocio (el editor de catálogo también los lee).
  if (!(await getBizMembership(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('resources')
    .select('id,name,kind,active,hours_json,sort_order')
    .eq('biz_id', bizId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resources: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ResBody
  const bizId = body.biz_id
  if (!bizId || !body.name?.trim()) return NextResponse.json({ error: 'biz_id y name requeridos' }, { status: 400 })
  if (!(await requireBizManager(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('resources')
    .insert({
      biz_id: bizId,
      name: body.name.trim(),
      kind: body.kind === 'station' ? 'station' : 'person',
      active: body.active ?? true,
      hours_json: body.hours_json ?? null,
      sort_order: body.sort_order ?? 0,
    })
    .select('id,name,kind,active,hours_json,sort_order')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resource: data })
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as ResBody
  if (!body.id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const bizId = await bizOfResource(body.id)
  if (!bizId) return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
  if (!(await requireBizManager(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) patch.name = body.name.trim()
  if (body.kind !== undefined) patch.kind = body.kind === 'station' ? 'station' : 'person'
  if (body.active !== undefined) patch.active = body.active
  if (body.hours_json !== undefined) patch.hours_json = body.hours_json
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order

  const admin = createAdminClient()
  const { error } = await admin.from('resources').update(patch).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  const bizId = await bizOfResource(id)
  if (!bizId) return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
  if (!(await requireBizManager(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin.from('resources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
