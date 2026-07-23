// CRUD de promociones del negocio (pestaña Promociones → Ofertas del panel).
// Persiste en la tabla `promotions` (kind='oferta'). RLS deja al dueño gestionar
// las de su negocio, así que se usa el cliente con la sesión del usuario.
//
// Mapeo sobre columnas de la tabla `promotions`:
//   title      ← título
//   body       ← descripción
//   discount   ← tipo de promo (Descuento | 2x1 | Regalo | Precio especial)
//   image_url  ← foto de la promoción (bucket `service-images`)
//   start_date ← inicio de vigencia (NULL = sin fecha de inicio)
//   end_date   ← fin de vigencia (NULL = sin fecha de fin)
//   days       ← días en que aplica (0=Dom..6=Sáb ; vacío = todos)
//   start_time ← horario desde ('HH:MM' ; NULL = todo el día)
//   end_time   ← horario hasta
// start_date, end_date, days, start_time y end_time vacíos = promoción permanente.
import { createClient } from './supabase/client'

export type PromoType = 'Descuento' | '2x1' | 'Regalo' | 'Precio especial'
const PROMO_TYPES: PromoType[] = ['Descuento', '2x1', 'Regalo', 'Precio especial']
const asType = (v: string | null): PromoType => (PROMO_TYPES.includes(v as PromoType) ? (v as PromoType) : 'Descuento')

export interface Promo {
  id: string
  title: string
  type: PromoType
  detail: string
  imageUrl: string | null
  startDate: string | null   // 'YYYY-MM-DD'
  endDate: string | null
  days: number[]             // 0=Dom..6=Sáb ; vacío = todos
  startTime: string | null   // 'HH:MM' ; null = todo el día
  endTime: string | null
  active: boolean
  canjes: number
}

export interface PromoInput {
  title: string
  type: PromoType
  detail: string
  imageUrl: string | null
  startDate: string | null
  endDate: string | null
  days: number[]
  startTime: string | null
  endTime: string | null
  active: boolean
}

const enabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL

// Texto legible de la ventana de vigencia de una oferta (fechas + días + horario).
// Vacío en todo = "Permanente". Se usa en el panel y en la ficha del cliente.
export function promoWindowLabel(p: { startDate: string | null; endDate: string | null; days: number[]; startTime: string | null; endTime: string | null }, en = false): string {
  const parts: string[] = []
  const fmt = (d: string) => { const [y, m, day] = d.split('-'); const mo = (en ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'])[Number(m) - 1]; return `${Number(day)} ${mo}${y ? '' : ''}` }
  if (p.startDate && p.endDate) parts.push(`${fmt(p.startDate)} – ${fmt(p.endDate)}`)
  else if (p.startDate) parts.push((en ? 'From ' : 'Desde ') + fmt(p.startDate))
  else if (p.endDate) parts.push((en ? 'Until ' : 'Hasta ') + fmt(p.endDate))
  if (p.days.length > 0 && p.days.length < 7) {
    const names = en ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    parts.push([...p.days].sort((a, b) => a - b).map(d => names[d]).join(', '))
  }
  if (p.startTime && p.endTime) parts.push(`${p.startTime}–${p.endTime}`)
  return parts.length ? parts.join(' · ') : (en ? 'Permanent' : 'Permanente')
}

interface Row { id: string; title: string; body: string | null; discount: string | null; image_url: string | null; start_date: string | null; end_date: string | null; days: number[] | null; start_time: string | null; end_time: string | null; active: boolean | null }
function mapRow(r: Row): Promo {
  return {
    id: r.id,
    title: r.title,
    type: asType(r.discount),
    detail: r.body || '',
    imageUrl: r.image_url || null,
    startDate: r.start_date || null,
    endDate: r.end_date || null,
    days: r.days ?? [],
    startTime: r.start_time || null,
    endTime: r.end_time || null,
    active: !!r.active,
    canjes: 0,
  }
}

const OFFER_COLS = 'id,title,body,discount,image_url,start_date,end_date,days,start_time,end_time,active'

// Columnas a persistir para una oferta (kind='oferta').
function offerPayload(p: PromoInput) {
  return {
    title: p.title,
    body: p.detail,
    discount: p.type,
    image_url: p.imageUrl,
    start_date: p.startDate,
    end_date: p.endDate,
    days: p.days.length ? p.days : null,
    start_time: p.startTime,
    end_time: p.endTime,
    active: p.active,
  }
}

// null = Supabase no configurado (modo demo): el panel usa su seed local.
export async function fetchPromotions(bizId: string): Promise<Promo[] | null> {
  if (!enabled) return null
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .select(OFFER_COLS)
    .eq('biz_id', bizId)
    .eq('kind', 'oferta')
    .order('created_at', { ascending: true })
  if (error) return null
  return (data ?? []).map(r => mapRow(r as unknown as Row))
}

export async function createPromotion(bizId: string, p: PromoInput): Promise<Promo | null> {
  if (!enabled) return null
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .insert({ biz_id: bizId, kind: 'oferta', ...offerPayload(p) })
    .select(OFFER_COLS)
    .single()
  if (error || !data) return null

  // Encola la promoción para moderación del super-admin (RLS: miembro del negocio).
  supabase.from('businesses').select('name,mono,grad_from,grad_to').eq('id', bizId).single().then(({ data: b }) => {
    void supabase.from('moderation_queue').insert({
      biz_id: bizId,
      biz_name: b?.name ?? 'Negocio',
      mono: b?.mono ?? 'R',
      grad_from: b?.grad_from ?? null,
      grad_to: b?.grad_to ?? null,
      tipo: 'Promoción',
      nivel: 'Destacado',
      que: p.title,
      status: 'pending',
    })
  })

  return mapRow(data as unknown as Row)
}

export async function updatePromotion(id: string, p: PromoInput): Promise<boolean> {
  if (!enabled) return false
  const supabase = createClient()
  const { error } = await supabase
    .from('promotions')
    .update(offerPayload(p))
    .eq('id', id)
  return !error
}

export async function setPromotionActive(id: string, active: boolean): Promise<boolean> {
  if (!enabled) return false
  const supabase = createClient()
  const { error } = await supabase.from('promotions').update({ active }).eq('id', id)
  return !error
}

export async function deletePromotion(id: string): Promise<boolean> {
  if (!enabled) return false
  const supabase = createClient()
  const { error } = await supabase.from('promotions').delete().eq('id', id)
  return !error
}

// ── Alertas en vivo (kind='alerta') que ve el cliente en la ficha del negocio ──
export type AlertType = 'happy_hour' | 'evento' | 'promo' | 'ultimos_lugares'
export interface BizAlert {
  id: string
  alertType: AlertType
  title: string
  body: string
  cta: string
  startTime: string   // 'HH:MM'
  endTime: string
  days: number[]      // 0=Dom..6=Sáb ; vacío = todos los días
  active: boolean
}
export interface AlertInput {
  alertType: AlertType
  title: string
  body: string
  cta: string
  startTime: string
  endTime: string
  days: number[]
  active: boolean
}

interface AlertRow { id: string; alert_type: string | null; title: string; body: string | null; cta: string | null; start_time: string | null; end_time: string | null; days: number[] | null; active: boolean | null }
function mapAlert(r: AlertRow): BizAlert {
  return {
    id: r.id,
    alertType: (r.alert_type as AlertType) || 'promo',
    title: r.title,
    body: r.body || '',
    cta: r.cta || '',
    startTime: r.start_time || '00:00',
    endTime: r.end_time || '23:59',
    days: r.days ?? [],
    active: !!r.active,
  }
}

export async function fetchAlerts(bizId: string): Promise<BizAlert[] | null> {
  if (!enabled) return null
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('id,alert_type,title,body,cta,start_time,end_time,days,active')
    .eq('biz_id', bizId).eq('kind', 'alerta')
    .order('created_at', { ascending: true })
  if (error) return null
  return (data ?? []).map(r => mapAlert(r as AlertRow))
}

function alertPayload(a: AlertInput) {
  return {
    kind: 'alerta', alert_type: a.alertType, title: a.title, body: a.body, cta: a.cta,
    start_time: a.startTime, end_time: a.endTime, days: a.days.length ? a.days : null, active: a.active,
  }
}

export async function createAlert(bizId: string, a: AlertInput): Promise<BizAlert | null> {
  if (!enabled) return null
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .insert({ biz_id: bizId, ...alertPayload(a) })
    .select('id,alert_type,title,body,cta,start_time,end_time,days,active')
    .single()
  if (error || !data) return null
  return mapAlert(data as AlertRow)
}

export async function updateAlert(id: string, a: AlertInput): Promise<boolean> {
  if (!enabled) return false
  const supabase = createClient()
  const { error } = await supabase.from('promotions').update(alertPayload(a)).eq('id', id)
  return !error
}

export async function setAlertActive(id: string, active: boolean): Promise<boolean> {
  if (!enabled) return false
  const supabase = createClient()
  const { error } = await supabase.from('promotions').update({ active }).eq('id', id)
  return !error
}

export async function deleteAlert(id: string): Promise<boolean> {
  if (!enabled) return false
  const supabase = createClient()
  const { error } = await supabase.from('promotions').delete().eq('id', id)
  return !error
}
