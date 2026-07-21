import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Métricas reales del negocio para el panel. Devuelve:
//  - El payload histórico (Fase 5) que ya consumen MetricsView/PromosView.
//  - Un objeto `modules` con KPIs reales por periodo (d1/d7/d30/d90) para Informes,
//    calculados 100% desde datos reales (reservations, pos_sales, messages, reviews,
//    rove_*, featured_events). Sin números ficticios.
async function ownedBizIds(userId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId)
  return (data ?? []).map(r => r.biz_id as string)
}

// Clave de día en UTC (YYYY-MM-DD); alineada con date_trunc('day', ...) de las vistas.
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

const DAY_MS = 86_400_000

// ¿`dateStr` cae en los últimos `n` días (ventana actual)?
function withinDays(dateStr: string | null, n: number, now: number): boolean {
  if (!dateStr) return false
  const t = new Date(dateStr).getTime()
  return t >= now - n * DAY_MS && t <= now
}

// Crecimiento % de una serie diaria: ventana actual vs. ventana anterior de igual tamaño.
function windowSum(map: Map<string, number>, n: number, offset: number): number {
  let s = 0
  const today = new Date()
  for (let i = offset; i < offset + n; i++) {
    const d = new Date(today); d.setUTCDate(today.getUTCDate() - i)
    s += map.get(dayKey(d)) ?? 0
  }
  return s
}
function growthOf(map: Map<string, number>, n: number): number {
  const cur = windowSum(map, n, 0)
  const prev = windowSum(map, n, n)
  if (prev === 0) return cur > 0 ? 100 : 0
  return Math.round(((cur - prev) / prev) * 100)
}
const pct = (part: number, total: number) => total > 0 ? Math.round((part / total) * 100) : 0

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  const owned = await ownedBizIds(user.id)
  if (!bizId || !owned.includes(bizId)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const now = Date.now()
  const since = new Date(now - 90 * DAY_MS).toISOString()

  const [
    { data: rsvs }, { data: salesDaily }, { count: redeemedCount },
    { data: salesRows }, { data: msgs }, { data: reviews },
    { data: redemptions }, { data: featDaily }, { count: promoCount },
    { data: bizRow },
  ] = await Promise.all([
    admin.from('reservations').select('slot,created_at,status,source,user_id').eq('biz_id', bizId).gte('created_at', since),
    admin.from('pos_sales_daily').select('day,revenue').eq('biz_id', bizId).gte('day', since),
    admin.from('rove_redemptions').select('id', { count: 'exact', head: true }).eq('biz_id', bizId),
    // Ventas con sus renglones (para conteo, ticket, % tarjeta y la tabla de detalle).
    admin.from('pos_sales').select('id,total,payment_method,auth_code,card_last4,reference,status,created_at,pos_sale_items(name,qty)').eq('biz_id', bizId).gte('created_at', since),
    admin.from('messages').select('from_role,read_at,user_id,created_at').eq('biz_id', bizId).gte('created_at', since),
    admin.from('reviews').select('rating').eq('biz_id', bizId),
    admin.from('rove_redemptions').select('created_at').eq('biz_id', bizId).gte('created_at', since),
    admin.from('featured_events_daily').select('day,impressions,clicks').eq('biz_id', bizId).gte('day', since),
    admin.from('promotions').select('id', { count: 'exact', head: true }).eq('biz_id', bizId).eq('active', true),
    admin.from('businesses').select('capacity').eq('id', bizId).maybeSingle(),
  ])

  type Rsv = { slot: string | null; created_at: string; status: string; source: string | null; user_id: string | null }
  type Sale = { id: string; total: number | null; payment_method: string | null; auth_code: string | null; card_last4: string | null; reference: string | null; status: string; created_at: string; pos_sale_items: { name: string; qty: number }[] | null }
  type Msg = { from_role: string; read_at: string | null; user_id: string | null; created_at: string }
  const R = (rsvs ?? []) as Rsv[]
  const S = (salesRows ?? []) as Sale[]
  const M = (msgs ?? []) as Msg[]
  const capacity = Math.max(1, Number(bizRow?.capacity ?? 50))

  // ── Series diarias reales (para crecimiento y tablas de detalle) ──
  const resByDay = new Map<string, number>()   // reservas no canceladas por fecha efectiva (slot||created_at)
  const recByDay = new Map<string, number>()    // solicitudes recibidas por created_at
  const revByDay = new Map<string, number>()    // ingreso por día (vista)
  const salesByDay = new Map<string, number>()  // nº de tickets por día
  const msgByDay = new Map<string, number>()    // mensajes por día
  const canjeByDay = new Map<string, number>()  // canjes por día
  const impByDay = new Map<string, number>()
  const clickByDay = new Map<string, number>()

  const add = (m: Map<string, number>, k: string, v = 1) => m.set(k, (m.get(k) ?? 0) + v)

  const stampHolders = new Set<string>()
  const visitsByUser = new Map<string, number>()
  for (const r of R) {
    if (r.status === 'cancelled') continue
    const eff = r.slot || r.created_at
    add(resByDay, dayKey(new Date(eff)))
    add(recByDay, dayKey(new Date(r.created_at)))
    if (r.user_id) { stampHolders.add(r.user_id); visitsByUser.set(r.user_id, (visitsByUser.get(r.user_id) ?? 0) + 1) }
  }
  for (const s of salesDaily ?? []) add(revByDay, dayKey(new Date(s.day as string)), Number(s.revenue ?? 0))
  for (const s of S) if (s.status === 'paid') add(salesByDay, dayKey(new Date(s.created_at)))
  for (const m of M) add(msgByDay, dayKey(new Date(m.created_at)))
  for (const rd of redemptions ?? []) add(canjeByDay, dayKey(new Date(rd.created_at as string)))
  for (const f of featDaily ?? []) { add(impByDay, dayKey(new Date(f.day as string)), Number(f.impressions ?? 0)); add(clickByDay, dayKey(new Date(f.day as string)), Number(f.clicks ?? 0)) }

  // ── Snapshots (no dependen del periodo) ──
  const revaCards = stampHolders.size
  const distinctUsers = visitsByUser.size
  const recurrentes = [...visitsByUser.values()].filter(v => v >= 2).length
  const recurrentesPct = pct(recurrentes, distinctUsers)
  const sinLeer = M.filter(m => m.from_role === 'user' && !m.read_at).length
  const ratings = (reviews ?? []).map(r => Number(r.rating)).filter(n => n > 0)
  const satisfaccion = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0

  // Tiempo de respuesta promedio (minutos): media(primer reply del negocio − mensaje del cliente).
  function avgRespMin(n: number): number {
    const byUser = new Map<string, { t: number; role: string }[]>()
    for (const m of M) {
      if (!m.user_id || !withinDays(m.created_at, n, now)) continue
      const arr = byUser.get(m.user_id) ?? []
      arr.push({ t: new Date(m.created_at).getTime(), role: m.from_role })
      byUser.set(m.user_id, arr)
    }
    let sum = 0, count = 0
    for (const arr of byUser.values()) {
      arr.sort((a, b) => a.t - b.t)
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i].role === 'user' && (arr[i + 1].role === 'biz' || arr[i + 1].role === 'reva')) { sum += arr[i + 1].t - arr[i].t; count++ }
      }
    }
    return count ? Math.round(sum / count / 60_000) : 0
  }

  // ── KPIs reales por periodo ──
  function buildPeriod(n: number) {
    // Solicitudes (por created_at) + Agenda/Vía Reva (por fecha efectiva).
    let recibidas = 0, reqConfComp = 0, reqCompleted = 0, reqPending = 0
    let agReservas = 0, agTotal = 0, agConfComp = 0, agNoShow = 0
    let viaTot = 0, viaReva = 0
    for (const r of R) {
      if (withinDays(r.created_at, n, now)) {
        recibidas++
        if (r.status === 'confirmed' || r.status === 'completed') reqConfComp++
        if (r.status === 'completed') reqCompleted++
        if (r.status === 'pending') reqPending++
      }
      const eff = r.slot || r.created_at
      if (withinDays(eff, n, now)) {
        agTotal++
        if (r.status === 'confirmed' || r.status === 'completed') agConfComp++
        if (r.status === 'no_show') agNoShow++
        if (r.status !== 'cancelled') { agReservas++; viaTot++; if ((r.source ?? 'reva') === 'reva') viaReva++ }
      }
    }

    // POS (tickets pagados en la ventana).
    let ventas = 0, ingreso = 0, tarjeta = 0
    for (const s of S) {
      if (s.status !== 'paid' || !withinDays(s.created_at, n, now)) continue
      ventas++; ingreso += Number(s.total ?? 0)
      if (/tarjeta|card|tpv/i.test(s.payment_method ?? '')) tarjeta++
    }

    // Promos / Destacado.
    let canjes = 0
    for (const rd of redemptions ?? []) if (withinDays(rd.created_at as string, n, now)) canjes++
    let imp = 0, clk = 0
    for (const f of featDaily ?? []) if (withinDays(f.day as string, n, now)) { imp += Number(f.impressions ?? 0); clk += Number(f.clicks ?? 0) }

    // Conversaciones distintas en la ventana.
    const convUsers = new Set<string>()
    for (const m of M) if (m.user_id && withinDays(m.created_at, n, now)) convUsers.add(m.user_id)

    const ocupacion = Math.min(100, pct(agReservas, capacity * n))

    return {
      series: lastDays(n).map(k => ({
        reservas: resByDay.get(k) ?? 0,
        recibidas: recByDay.get(k) ?? 0,
        ingreso: revByDay.get(k) ?? 0,
        ventas: salesByDay.get(k) ?? 0,
        mensajes: msgByDay.get(k) ?? 0,
      })),
      requests: { recibidas, autoConf: pct(reqConfComp, recibidas), negociacion: reqPending, conversion: pct(reqCompleted, recibidas) },
      agenda: { reservas: agReservas, ocupacion, confirmadas: pct(agConfComp, agTotal), noShows: pct(agNoShow, agTotal) },
      messages: { conversaciones: convUsers.size, sinLeer, respPromMin: avgRespMin(n), satisfaccion },
      pos: { ventas, ingreso: Math.round(ingreso), ticketProm: ventas ? Math.round(ingreso / ventas) : 0, pagoTarjeta: pct(tarjeta, ventas) },
      promos: { sellos: agReservas, canjes, recurrentes: recurrentesPct, lealtad: revaCards },
      featured: { impresiones: imp, clics: clk, ctr: imp ? Math.round((clk / imp) * 1000) / 10 : 0, clicksGrowth: growthOf(clickByDay, n) },
      metrics: { ingresoAtribuido: Math.round(ingreso), viaReva: pct(viaReva, viaTot), rove: revaCards, crecimiento: growthOf(revByDay, n) },
      trends: {
        requests: growthOf(recByDay, n),
        agenda: growthOf(resByDay, n),
        messages: growthOf(msgByDay, n),
        pos: growthOf(revByDay, n),
        promos: growthOf(resByDay, n),
        featured: growthOf(clickByDay, n),
        metrics: growthOf(revByDay, n),
      },
    }
  }

  // Tabla de detalle POS: ventas reales recientes con su producto, método de pago
  // y el comprobante de la transacción (tarjeta ····1234 / autorización / referencia).
  const methodLabel = (m: string | null) => {
    const s = (m ?? '').toLowerCase()
    if (s === 'efectivo') return 'Efectivo'
    if (s === 'tarjeta') return 'Tarjeta'
    if (s === 'transferencia') return 'Transferencia'
    return m || '—'
  }
  const refText = (s: Sale) => {
    const parts: string[] = []
    if (s.card_last4) parts.push(`····${s.card_last4}`)
    if (s.auth_code) parts.push(`Aut ${s.auth_code}`)
    if (s.reference) parts.push(`Ref ${s.reference}`)
    return parts.join(' · ') || '—'
  }
  // Folio imprimible por venta (best-effort): si la columna `folio` aún no existe
  // (migración 020 sin aplicar) la consulta devuelve error y seguimos con el
  // folio derivado del id — así Informes nunca se rompe por esto.
  const folioById = new Map<string, string>()
  const { data: folRows } = await admin.from('pos_sales').select('id,folio').eq('biz_id', bizId).gte('created_at', since)
  for (const f of (folRows ?? []) as { id: string; folio: string | null }[]) if (f.folio) folioById.set(f.id, f.folio)

  const txPos = S.filter(s => s.status === 'paid')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 14)
    .map(s => {
      const items = s.pos_sale_items ?? []
      const producto = items.length === 0 ? 'Venta' : items.length === 1 ? items[0].name : `${items[0].name} +${items.length - 1}`
      return { folio: folioById.get(s.id) || s.id.slice(0, 6).toUpperCase(), hora: new Date(s.created_at).toISOString().slice(11, 16), producto, metodo: methodLabel(s.payment_method), ref: refText(s), total: Number(s.total ?? 0) }
    })

  const modules = { d1: buildPeriod(1), d7: buildPeriod(7), d30: buildPeriod(30), d90: buildPeriod(90) }

  // ── Payload histórico (compatibilidad con MetricsView/PromosView) ──
  const seriesFor = (n: number, src: Map<string, number>) => lastDays(n).map(k => src.get(k) ?? 0)
  const resSeries = { d7: seriesFor(7, resByDay), d30: seriesFor(30, resByDay), d90: seriesFor(90, resByDay) }
  const revSeries = { d7: seriesFor(7, revByDay), d30: seriesFor(30, revByDay), d90: seriesFor(90, revByDay) }
  const todayKey = dayKey(new Date())
  const reservasHoy = resByDay.get(todayKey) ?? 0
  const ingreso7 = revSeries.d7.reduce((a, b) => a + b, 0)

  return NextResponse.json({
    reservasHoy,
    viaReva: modules.d90.metrics.viaReva,
    ingreso7,
    rove: revaCards,
    stampsWeek: resSeries.d7.reduce((a, b) => a + b, 0),
    rewardsRedeemed: redeemedCount ?? 0,
    resSeries,
    revSeries,
    modules,
    txPos,
    promoCount: promoCount ?? 0,
  })
}
