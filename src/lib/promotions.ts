// CRUD de promociones del negocio (pestaña Promociones → Ofertas del panel).
// Persiste en la tabla `promotions` (kind='oferta'). RLS deja al dueño gestionar
// las de su negocio, así que se usa el cliente con la sesión del usuario.
//
// Mapeo sobre columnas existentes (sin migración nueva):
//   title    ← título
//   body     ← detalle
//   discount ← tipo de promo (Descuento | 2x1 | Regalo | Precio especial)
//   cta      ← vigencia (texto libre)
import { createClient } from './supabase/client'

export type PromoType = 'Descuento' | '2x1' | 'Regalo' | 'Precio especial'
const PROMO_TYPES: PromoType[] = ['Descuento', '2x1', 'Regalo', 'Precio especial']
const asType = (v: string | null): PromoType => (PROMO_TYPES.includes(v as PromoType) ? (v as PromoType) : 'Descuento')

export interface Promo {
  id: string
  title: string
  type: PromoType
  detail: string
  vig: string
  active: boolean
  canjes: number
}

export interface PromoInput {
  title: string
  type: PromoType
  detail: string
  vig: string
  active: boolean
}

const enabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL

interface Row { id: string; title: string; body: string | null; discount: string | null; cta: string | null; active: boolean | null }
function mapRow(r: Row): Promo {
  return { id: r.id, title: r.title, type: asType(r.discount), detail: r.body || '', vig: r.cta || 'Permanente', active: !!r.active, canjes: 0 }
}

// null = Supabase no configurado (modo demo): el panel usa su seed local.
export async function fetchPromotions(bizId: string): Promise<Promo[] | null> {
  if (!enabled) return null
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('id,title,body,discount,cta,active')
    .eq('biz_id', bizId)
    .eq('kind', 'oferta')
    .order('created_at', { ascending: true })
  if (error) return null
  return (data ?? []).map(r => mapRow(r as Row))
}

export async function createPromotion(bizId: string, p: PromoInput): Promise<Promo | null> {
  if (!enabled) return null
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .insert({ biz_id: bizId, kind: 'oferta', title: p.title, body: p.detail, discount: p.type, cta: p.vig, active: p.active })
    .select('id,title,body,discount,cta,active')
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

  return mapRow(data as Row)
}

export async function updatePromotion(id: string, p: PromoInput): Promise<boolean> {
  if (!enabled) return false
  const supabase = createClient()
  const { error } = await supabase
    .from('promotions')
    .update({ title: p.title, body: p.detail, discount: p.type, cta: p.vig, active: p.active })
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
