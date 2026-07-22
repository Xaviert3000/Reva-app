import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Módulo Destacados del super-admin. Deriva de datos reales:
//  · inventario por categoría × municipio: cupos (config editable) vs vendidos
//    (negocios featured vigentes) + lista de espera (activos sin destacar).
//  · negocios destacados ahora: cada campaña vigente con su producto, días
//    restantes e ingreso cobrado.
//  GET   → { inventory, active, totals }
//  PATCH → { categoria, municipio, premium_cap, destacado_cap }  (upsert de cupo)

const DEFAULT_PREMIUM_CAP = 2
const DEFAULT_DESTACADO_CAP = 8

type BizRow = {
  id: string; name: string | null; mono: string | null; kind: string | null; type: string | null
  municipio: string | null; tier: string | null; featured: boolean | null; featured_until: string | null
  featured_service_id: string | null; agent_active: boolean | null; grad_from: string | null; grad_to: string | null
}

const catOf = (b: BizRow) => b.kind || b.type || '—'
const munOf = (b: BizRow) => b.municipio || '—'
const isLiveFeatured = (b: BizRow) =>
  !!b.featured && !!b.tier && (!b.featured_until || new Date(b.featured_until).getTime() >= Date.now())

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const db = createAdminClient()

  const { data: bizData, error } = await db
    .from('businesses')
    .select('id,name,mono,kind,type,municipio,tier,featured,featured_until,featured_service_id,agent_active,grad_from,grad_to')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const bizes = (bizData ?? []) as unknown as BizRow[]

  // Cupos configurados (capacidad). Clave "categoria|||municipio".
  const { data: slotData } = await db.from('featured_slots').select('categoria,municipio,premium_cap,destacado_cap')
  const caps: Record<string, { premium: number; destacado: number }> = {}
  for (const s of slotData ?? []) {
    caps[`${s.categoria}|||${s.municipio}`] = { premium: s.premium_cap as number, destacado: s.destacado_cap as number }
  }

  const live = bizes.filter(isLiveFeatured)

  // Último pago de Destacado por negocio (para el ingreso mostrado).
  const liveIds = live.map(b => b.id)
  const lastPay: Record<string, number> = {}
  if (liveIds.length > 0) {
    const { data: pays } = await db
      .from('payments')
      .select('biz_id,amount,created_at')
      .eq('type', 'featured').eq('status', 'paid')
      .in('biz_id', liveIds)
      .order('created_at', { ascending: false })
    for (const p of pays ?? []) {
      const bid = p.biz_id as string
      if (bid && !(bid in lastPay)) lastPay[bid] = Number(p.amount) || 0 // el primero = el más reciente
    }
  }

  // Nombre del producto destacado (featured_service_id → services.name).
  const svcIds = [...new Set(live.map(b => b.featured_service_id).filter(Boolean))] as string[]
  const svcName: Record<string, string> = {}
  if (svcIds.length > 0) {
    const { data: svcs } = await db.from('services').select('id,name').in('id', svcIds)
    for (const s of svcs ?? []) svcName[s.id as string] = (s.name as string) || ''
  }

  // Inventario agrupado por categoría × municipio.
  type Group = { categoria: string; municipio: string; premiumSold: number; destacadoSold: number; waitlist: number }
  const groups: Record<string, Group> = {}
  const groupFor = (cat: string, mun: string) => {
    const k = `${cat}|||${mun}`
    return groups[k] ?? (groups[k] = { categoria: cat, municipio: mun, premiumSold: 0, destacadoSold: 0, waitlist: 0 })
  }
  for (const b of bizes) {
    const cat = catOf(b), mun = munOf(b)
    if (isLiveFeatured(b)) {
      const g = groupFor(cat, mun)
      if (b.tier === 'premium') g.premiumSold += 1
      else g.destacadoSold += 1
    } else if (b.agent_active) {
      // Activo sin visibilidad pagada = demanda potencial de cupo (lista de espera).
      groupFor(cat, mun).waitlist += 1
    }
  }
  // Asegura filas para combinaciones con cupo configurado aunque no tengan negocios.
  for (const s of slotData ?? []) groupFor(s.categoria as string, s.municipio as string)

  const inventory = Object.values(groups)
    .map(g => {
      const cap = caps[`${g.categoria}|||${g.municipio}`]
      return {
        categoria: g.categoria,
        municipio: g.municipio,
        premiumSold: g.premiumSold,
        premiumCap: cap?.premium ?? DEFAULT_PREMIUM_CAP,
        destacadoSold: g.destacadoSold,
        destacadoCap: cap?.destacado ?? DEFAULT_DESTACADO_CAP,
        waitlist: g.waitlist,
      }
    })
    .sort((a, b) => (b.premiumSold + b.destacadoSold) - (a.premiumSold + a.destacadoSold) || a.categoria.localeCompare(b.categoria))

  // Negocios destacados ahora.
  const active = live
    .map(b => {
      const dias = b.featured_until
        ? Math.max(0, Math.ceil((new Date(b.featured_until).getTime() - Date.now()) / 86_400_000))
        : null
      return {
        id: b.id,
        biz: b.name || 'Negocio',
        mono: b.mono || (b.name || 'R').charAt(0).toUpperCase(),
        cat: catOf(b),
        mun: munOf(b),
        nivel: b.tier === 'premium' ? 'Premium' : 'Destacado',
        que: b.featured_service_id ? (svcName[b.featured_service_id] || 'Producto destacado') : 'Todo el negocio',
        dias,
        amount: lastPay[b.id] ?? 0,
        grad: [b.grad_from || '#5FA6B0', b.grad_to || '#2E6E78'] as [string, string],
      }
    })
    .sort((a, b) => (a.dias ?? Infinity) - (b.dias ?? Infinity))

  const totals = inventory.reduce(
    (t, r) => ({
      premiumSold: t.premiumSold + r.premiumSold,
      premiumCap: t.premiumCap + r.premiumCap,
      destacadoSold: t.destacadoSold + r.destacadoSold,
      destacadoCap: t.destacadoCap + r.destacadoCap,
      waitlist: t.waitlist + r.waitlist,
    }),
    { premiumSold: 0, premiumCap: 0, destacadoSold: 0, destacadoCap: 0, waitlist: 0 },
  )

  return NextResponse.json({ inventory, active, totals })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { categoria, municipio, premium_cap, destacado_cap } = await req.json()
  if (!categoria || !municipio) return NextResponse.json({ error: 'Falta categoría o municipio' }, { status: 400 })
  const p = Number(premium_cap), d = Number(destacado_cap)
  if (!Number.isInteger(p) || !Number.isInteger(d) || p < 0 || d < 0) {
    return NextResponse.json({ error: 'Cupos inválidos' }, { status: 400 })
  }
  const db = createAdminClient()
  const { error } = await db
    .from('featured_slots')
    .upsert({ categoria, municipio, premium_cap: p, destacado_cap: d, updated_at: new Date().toISOString() }, { onConflict: 'categoria,municipio' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
