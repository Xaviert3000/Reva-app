import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Persiste ajustes del negocio (Fase 8): config del Agente IA, IVA y datos
// fiscales. La sesión identifica al dueño; se verifica la membresía y se escribe
// con el admin client.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const bizId: string | undefined = body.biz_id
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('biz_members').select('biz_id').eq('user_id', user.id).eq('biz_id', bizId).maybeSingle()
  if (!membership) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const patch: Record<string, unknown> = {}
  if (body.agent_config !== undefined) patch.agent_config = body.agent_config
  if (typeof body.tax_mode === 'string') patch.tax_mode = body.tax_mode
  if (typeof body.rfc === 'string') patch.rfc = body.rfc
  if (typeof body.address === 'string') patch.address = body.address
  if (typeof body.phone === 'string') patch.phone = body.phone
  // Municipio de operación: define en qué ciudad encuentran los clientes al
  // negocio en Discover (business-data.ts filtra por .eq('municipio', ...)).
  // Se limpia (trim) para que coincida exacto con el catálogo del cliente.
  if (typeof body.municipio === 'string') patch.municipio = body.municipio.trim() || null
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

  const { error } = await admin.from('businesses').update(patch).eq('id', bizId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
