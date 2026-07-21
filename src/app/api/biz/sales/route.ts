import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Historial de ventas del Punto de venta para el panel del dueño.
//  GET  ?biz_id=... → lista las ventas del negocio (encabezado + renglones), más
//        recientes primero, para el módulo "Ventas".
//  PATCH { id, status, reason? } → cambia el estatus de una venta:
//        'void' (anulada) | 'refunded' (reembolsada) | 'paid' (reactivar).
//        Anular/reembolsar la saca de Informes (las métricas sólo cuentan 'paid').
// La sesión (cookie) identifica al dueño; se opera con el admin client tras
// verificar que la venta pertenece a un negocio del dueño.
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

  const bizId = req.nextUrl.searchParams.get('biz_id')
  const owned = await ownedBizIds(user.id)
  if (!bizId || !owned.includes(bizId)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from('pos_sales')
    .select('id,total,subtotal,tax_amount,item_count,payment_method,auth_code,card_last4,reference,status,note,created_at,pos_sale_items(name,qty,unit_price,service_id,service:services(stock))')
    .eq('biz_id', bizId)
    .order('created_at', { ascending: false })
    .limit(400)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Folio imprimible (best-effort): si la columna `folio` aún no existe
  // (migración 020 sin aplicar) esta consulta devuelve error y usamos un folio
  // derivado del id — así el historial nunca se rompe por eso.
  const folioById = new Map<string, string>()
  const { data: folRows } = await admin.from('pos_sales').select('id,folio').eq('biz_id', bizId).limit(400)
  for (const f of (folRows ?? []) as { id: string; folio: string | null }[]) if (f.folio) folioById.set(f.id, f.folio)

  type Item = { name: string; qty: number; unit_price: number; service_id: string | null; service: { stock: number | null } | null }
  type Row = {
    id: string; total: number | null; subtotal: number | null
    tax_amount: number | null; item_count: number | null; payment_method: string | null
    auth_code: string | null; card_last4: string | null; reference: string | null
    status: string; note: string | null; created_at: string; pos_sale_items: Item[] | null
  }
  // El embed to-one `service:services(stock)` devuelve un objeto en runtime, pero
  // los tipos generados de PostgREST lo infieren como arreglo; por eso el cast vía
  // unknown (la forma real coincide con Row).
  const sales = ((rows ?? []) as unknown as Row[]).map(s => ({
    id: s.id,
    // Folio visible: el impreso si ya se guardó (migración 020), o uno derivado
    // del id como respaldo para ventas antiguas.
    folio: folioById.get(s.id) || s.id.slice(0, 6).toUpperCase(),
    total: Number(s.total ?? 0),
    subtotal: Number(s.subtotal ?? 0),
    tax_amount: Number(s.tax_amount ?? 0),
    item_count: Number(s.item_count ?? 0),
    method: s.payment_method,
    auth_code: s.auth_code,
    card_last4: s.card_last4,
    reference: s.reference,
    status: s.status,
    note: s.note,
    created_at: s.created_at,
    // `tracked` = el producto tiene inventario controlado (stock not null); sólo
    // esos se pueden devolver al inventario al anular/reembolsar.
    items: (s.pos_sale_items ?? []).map(it => ({
      name: it.name, qty: it.qty, unit_price: Number(it.unit_price ?? 0),
      service_id: it.service_id, tracked: !!it.service_id && it.service != null && it.service.stock != null,
    })),
  }))

  return NextResponse.json({ sales })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id, status, reason, restock } = await req.json()
  const allowed = ['paid', 'refunded', 'void']
  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: sale } = await admin.from('pos_sales').select('id,biz_id,status').eq('id', id).maybeSingle()
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

  const owned = await ownedBizIds(user.id)
  if (!owned.includes(sale.biz_id as string)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const patch: Record<string, unknown> = { status }
  // Guarda el motivo (opcional) en `note`; al reactivar como 'paid' lo limpia.
  if (status === 'paid') patch.note = null
  else if (typeof reason === 'string' && reason.trim()) patch.note = reason.trim().slice(0, 300)

  const { error } = await admin.from('pos_sales').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reposición de inventario (best-effort): sólo cuando el dueño lo pidió y la
  // venta pasa de 'paid' a anulada/reembolsada (evita doble reposición si ya no
  // estaba pagada). El RPC sólo suma a productos con seguimiento; si aún no
  // existe (migración 021 sin aplicar) el cambio de estatus ya se guardó y sólo
  // reportamos que no se repuso.
  let restocked = false
  if (restock === true && sale.status === 'paid' && (status === 'void' || status === 'refunded')) {
    const { data: itemRows } = await admin.from('pos_sale_items').select('service_id,qty').eq('sale_id', id)
    const items = (itemRows ?? [])
      .filter(r => r.service_id)
      .map(r => ({ service_id: r.service_id as string, qty: Number(r.qty ?? 0) }))
    if (items.length > 0) {
      const { error: rpcErr } = await admin.rpc('increment_service_stock', { p_biz_id: sale.biz_id, p_items: items })
      if (rpcErr) console.warn('[sales] no se pudo reponer inventario (¿migración 021?):', rpcErr.message)
      else restocked = true
    }
  }

  return NextResponse.json({ ok: true, restocked })
}
