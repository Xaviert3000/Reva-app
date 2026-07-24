import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUSES = ['pending_payment', 'paid', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'] as const
type Status = typeof STATUSES[number]

async function ownerOf(bizId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId).eq('biz_id', bizId).maybeSingle()
  return !!data
}

// GET /api/biz/orders?biz_id=... → pedidos del negocio (dueño), con líneas.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select('*, order_items(id,name,qty,unit_price,line_total)')
    .eq('biz_id', bizId)
    .neq('status', 'pending_payment') // los no pagados no ensucian la bandeja
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // El código de confirmación NUNCA se envía al panel: el dueño debe pedírselo
  // al cliente y capturarlo. Se omite de la respuesta.
  const orders = (data ?? []).map(o => {
    const row = { ...o }
    delete (row as Record<string, unknown>).confirmation_code
    return row
  })
  return NextResponse.json({ orders })
}

// PATCH /api/biz/orders → cambia estado y/o asigna repartidor.
// body: { id, biz_id, status?, courier_id? }
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const id: string | undefined = body.id
  const bizId: string | undefined = body.biz_id
  if (!id || !bizId) return NextResponse.json({ error: 'id y biz_id requeridos' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const patch: Record<string, unknown> = {}
  if (typeof body.status === 'string' && (STATUSES as readonly string[]).includes(body.status)) {
    patch.status = body.status as Status
  }
  if ('courier_id' in body) patch.courier_id = body.courier_id || null
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

  const admin = createAdminClient()

  // Al marcar ENTREGADO se exige el código de confirmación que el cliente da al
  // recibir. Se compara contra el guardado (server-side, nunca expuesto). Sin
  // coincidencia no se completa el pedido. Los pedidos legado sin código pasan.
  if (patch.status === 'delivered') {
    const { data: order } = await admin
      .from('orders')
      .select('confirmation_code,status')
      .eq('id', id)
      .eq('biz_id', bizId)
      .maybeSingle()
    if (order?.status !== 'delivered' && order?.confirmation_code) {
      const given = typeof body.confirmation_code === 'string' ? body.confirmation_code.trim() : ''
      if (given !== order.confirmation_code) {
        return NextResponse.json({ error: 'code_mismatch' }, { status: 422 })
      }
    }
  }

  const { error } = await admin.from('orders').update(patch).eq('id', id).eq('biz_id', bizId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
