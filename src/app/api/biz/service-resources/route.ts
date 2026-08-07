import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBizMembership, requireBizManager } from '@/lib/biz-auth'

// Qué recursos (dentistas/sillones) realizan un servicio. Sin filas = cualquiera.
//   GET ?service_id=..                       → resource_ids del servicio
//   PUT { service_id, resource_ids: [...] }  → reemplaza el mapeo (dueño/admin)
export const dynamic = 'force-dynamic'

async function bizOfService(serviceId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('services').select('biz_id').eq('id', serviceId).maybeSingle()
  return (data?.biz_id as string) ?? null
}

export async function GET(req: NextRequest) {
  const serviceId = req.nextUrl.searchParams.get('service_id')
  if (!serviceId) return NextResponse.json({ error: 'service_id requerido' }, { status: 400 })
  const bizId = await bizOfService(serviceId)
  if (!bizId || !(await getBizMembership(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('service_resources').select('resource_id').eq('service_id', serviceId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resource_ids: (data ?? []).map(r => r.resource_id as string) })
}

export async function PUT(req: NextRequest) {
  const { service_id, resource_ids } = (await req.json()) as { service_id?: string; resource_ids?: string[] }
  if (!service_id) return NextResponse.json({ error: 'service_id requerido' }, { status: 400 })
  const bizId = await bizOfService(service_id)
  if (!bizId) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  if (!(await requireBizManager(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  // Sólo recursos que de verdad pertenecen a este negocio (evita mapear ajenos).
  const ids = [...new Set((resource_ids ?? []).filter(Boolean))]
  let valid: string[] = []
  if (ids.length > 0) {
    const { data: owned } = await admin.from('resources').select('id').eq('biz_id', bizId).in('id', ids)
    valid = (owned ?? []).map(r => r.id as string)
  }

  // Reemplaza el mapeo: borra el actual e inserta el nuevo (vacío = cualquiera).
  await admin.from('service_resources').delete().eq('service_id', service_id)
  if (valid.length > 0) {
    const { error } = await admin.from('service_resources').insert(valid.map(rid => ({ service_id, resource_id: rid })))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, resource_ids: valid })
}
