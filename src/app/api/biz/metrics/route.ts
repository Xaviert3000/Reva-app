import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Métricas reales del negocio para el panel (Fase 5): reservas por día
// (tabla reservations) e ingreso por día (vista pos_sales_daily).
async function ownedBizIds(userId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId)
  return (data ?? []).map(r => r.biz_id as string)
}

// Clave de día en UTC (YYYY-MM-DD); alineada con date_trunc('day', ...) de la vista.
function dayKey(d: Date): string { return d.toISOString().slice(0, 10) }

// Las últimas `n` claves de día terminando hoy (índice 0 = hace n-1 días).
function lastDays(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    out.push(dayKey(d))
  }
  return out
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  const owned = await ownedBizIds(user.id)
  if (!bizId || !owned.includes(bizId)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const since = new Date(); since.setUTCDate(since.getUTCDate() - 90)
  const sinceIso = since.toISOString()

  const [{ data: rsvs }, { data: sales }, { count: redeemedCount }] = await Promise.all([
    admin.from('reservations').select('slot,created_at,status,source,user_id').eq('biz_id', bizId).gte('created_at', sinceIso),
    admin.from('pos_sales_daily').select('day,revenue').eq('biz_id', bizId).gte('day', sinceIso),
    // Recompensas Reva+ canjeadas en este negocio (histórico completo).
    admin.from('rove_redemptions').select('id', { count: 'exact', head: true }).eq('biz_id', bizId),
  ])

  // Reservas por día (usa slot si existe, si no created_at). Excluye canceladas.
  // Cada visita no cancelada cuenta como un "sello" de la Tarjeta Reva+; los
  // clientes con al menos una visita son las "tarjetas activas".
  const resByDay = new Map<string, number>()
  const stampHolders = new Set<string>()
  let reservasHoy = 0
  let revaCount = 0
  let totalCount = 0
  const todayKey = dayKey(new Date())
  for (const r of rsvs ?? []) {
    if (r.status === 'cancelled') continue
    const eff = (r.slot as string) || (r.created_at as string)
    const key = dayKey(new Date(eff))
    resByDay.set(key, (resByDay.get(key) ?? 0) + 1)
    if (key === todayKey) reservasHoy++
    if (r.user_id) stampHolders.add(r.user_id as string)
    totalCount++
    if ((r.source ?? 'reva') === 'reva') revaCount++
  }

  // Ingreso por día desde la vista pos_sales_daily.
  const revByDay = new Map<string, number>()
  for (const s of sales ?? []) {
    const key = dayKey(new Date(s.day as string))
    revByDay.set(key, (revByDay.get(key) ?? 0) + Number(s.revenue ?? 0))
  }

  const seriesFor = (n: number, src: Map<string, number>) => lastDays(n).map(k => src.get(k) ?? 0)
  const resSeries = { d7: seriesFor(7, resByDay), d30: seriesFor(30, resByDay), d90: seriesFor(90, resByDay) }
  const revSeries = { d7: seriesFor(7, revByDay), d30: seriesFor(30, revByDay), d90: seriesFor(90, revByDay) }

  const viaReva = totalCount > 0 ? Math.round((revaCount / totalCount) * 100) : 0
  const ingreso7 = revSeries.d7.reduce((a, b) => a + b, 0)

  // ── Métricas Reva+ reales ──
  // Tarjetas activas: clientes con al menos una visita registrada.
  // Sellos esta semana: visitas no canceladas de los últimos 7 días.
  // Recompensas canjeadas: canjes Reva+ de este negocio (rove_redemptions).
  const revaCards = stampHolders.size
  const stampsWeek = resSeries.d7.reduce((a, b) => a + b, 0)
  const rewardsRedeemed = redeemedCount ?? 0

  return NextResponse.json({
    reservasHoy,
    viaReva,
    ingreso7,
    rove: revaCards,
    stampsWeek,
    rewardsRedeemed,
    resSeries,
    revSeries,
  })
}
