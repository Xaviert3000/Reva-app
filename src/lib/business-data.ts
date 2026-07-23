// Loads businesses + catalog for the city the guest is currently in.
// Every municipio (Los Cabos included) is read live from Supabase — the 9
// Los Cabos businesses are seeded there (migration 011). The curated demo in
// data.ts is only a last-resort fallback so the app never sees an empty city
// (e.g. before migrations run). Rows are mapped onto the Business/Service
// interfaces so the UI doesn't branch on source.
import { createClient } from './supabase/client'
import { BIZ, CATALOG, slotsFromHours, type Business, type FeaturedTier, type Service, type ProactiveAlert, type AlertType, type BizOffer } from './data'

interface DbBusiness {
  id: string
  name: string
  type: string | null
  kind: string | null
  hood: string | null
  municipio: string | null
  hours: string | null
  rating: number | null
  local_fav: boolean | null
  featured: boolean | null
  tier: FeaturedTier | null
  featured_until: string | null
  featured_service_id: string | null
  grad_from: string | null
  grad_to: string | null
  mono: string | null
}

interface DbService {
  id: string
  biz_id: string
  name: string
  description: string | null
  price: number | null
  price_label: string | null
  category: string | null
  duration_min: number | null
  stock: number | null
  scheduled: boolean | null
  image_url: string | null
}

interface DbReview {
  biz_id: string
  body: string | null
  author: string | null
  lang: string | null
}

interface DbAlert {
  id: string
  biz_id: string
  alert_type: string | null
  title: string
  body: string | null
  cta: string | null
  start_time: string | null
  end_time: string | null
  days: number[] | null
  active: boolean | null
}

interface DbOffer {
  id: string
  biz_id: string
  title: string
  body: string | null
  discount: string | null
  image_url: string | null
  start_date: string | null
  end_date: string | null
  start_time: string | null
  end_time: string | null
  days: number[] | null
}

function mapService(s: DbService, grad: [string, string]): Service {
  return {
    id: s.id,
    name: s.name,
    sub: s.description || '',
    price: s.price_label ?? (s.price ? `$${s.price}` : 'Cotización'),
    category: s.category || 'General',
    grad,
    duration: s.duration_min ?? undefined,
    // false en la BD = producto/cotización sin calendario de reservas.
    scheduled: s.scheduled ?? undefined,
    // null en la BD = disponibilidad ilimitada (sin seguimiento de inventario).
    stock: s.stock ?? undefined,
    img: s.image_url ?? undefined,
  }
}

function mapReview(r: DbReview): { who: string; txt: string; es: boolean } {
  return { who: r.author || 'Cliente', txt: r.body || '', es: (r.lang ?? 'es') === 'es' }
}

function mapAlert(a: DbAlert): ProactiveAlert {
  return {
    id: a.id,
    bizId: a.biz_id,
    type: (a.alert_type as AlertType) || 'promo',
    title: a.title,
    body: a.body || '',
    cta: a.cta || '',
    startTime: a.start_time || '00:00',
    endTime: a.end_time || '23:59',
    days: a.days ?? [],
    active: a.active !== false,
  }
}

function mapOffer(o: DbOffer): BizOffer {
  return {
    id: o.id,
    type: o.discount || 'Descuento',
    title: o.title,
    detail: o.body || '',
    imageUrl: o.image_url || null,
    startDate: o.start_date || null,
    endDate: o.end_date || null,
    days: o.days ?? [],
    startTime: o.start_time || null,
    endTime: o.end_time || null,
  }
}

function mapBusiness(
  b: DbBusiness,
  grad: [string, string],
  reviews: Business['reviews'],
  alerts: ProactiveAlert[],
  offers: BizOffer[],
  img?: string,
): Business {
  const hours = b.hours || '09:00 – 21:00'
  const slots = slotsFromHours(hours, 60)
  // Destacado solo si el plan sigue vigente (o no tiene fecha de expiración).
  const isFeatured = !!b.featured && (!b.featured_until || new Date(b.featured_until).getTime() > Date.now())
  return {
    id: b.id,
    name: b.name,
    cat: b.kind || 'Comer',
    type: b.type || '',
    price: 2,
    rating: Number(b.rating) || 4.5,
    localFav: !!b.local_fav,
    dist: 0,
    hood: b.hood || b.municipio || '',
    open: true,
    hours,
    // Vencido = deja de estar destacado. `featured_until` NULL = sin expiración.
    featured: isFeatured,
    // Nivel real de la BD (migración 007). Si está destacado sin nivel
    // explícito, cae en 'destacado' por compatibilidad.
    tier: isFeatured ? (b.tier ?? 'destacado') : undefined,
    grad,
    img,
    mono: b.mono || b.name.charAt(0).toUpperCase(),
    en: `${b.name} — ${b.type || 'local favorite'} in ${b.hood || b.municipio}.`,
    es: `${b.name} — ${b.type || 'favorito local'} en ${b.hood || b.municipio}.`,
    tags: [],
    reviews,
    slots: slots.length > 0 ? slots : ['12:00', '14:00', '19:00'],
    alerts: alerts.length > 0 ? alerts : undefined,
    offers: offers.length > 0 ? offers : undefined,
  }
}

export interface CityData {
  businesses: Business[]
  catalog: Record<string, Service[]>
}

export const LOS_CABOS_DATA: CityData = { businesses: BIZ, catalog: CATALOG }

// Fetches real businesses + their active services, reviews and live alerts for a
// municipio (Los Cabos included — its 9 businesses are seeded in Supabase).
// Falls back to the curated demo data only if the city has nothing yet, so the
// app never renders an empty city.
export async function fetchCityData(municipio: string): Promise<CityData> {
  const supabase = createClient()
  const { data: bizRows, error } = await supabase
    .from('businesses')
    .select('id,name,type,kind,hood,municipio,hours,rating,local_fav,featured,tier,featured_until,featured_service_id,grad_from,grad_to,mono')
    .eq('municipio', municipio)

  if (error || !bizRows || bizRows.length === 0) {
    // Sin datos reales todavía: usa el demo curado solo para Los Cabos.
    return municipio === 'Los Cabos' ? LOS_CABOS_DATA : { businesses: [], catalog: {} }
  }

  const ids = bizRows.map(b => b.id)
  const [{ data: svcRows }, { data: revRows }, { data: alertRows }, { data: offerRows }] = await Promise.all([
    supabase
      .from('services')
      .select('id,biz_id,name,description,price,price_label,category,duration_min,stock,scheduled,image_url')
      .in('biz_id', ids)
      .eq('active', true),
    supabase
      .from('reviews')
      .select('biz_id,body,author,lang')
      .in('biz_id', ids),
    supabase
      .from('promotions')
      .select('id,biz_id,alert_type,title,body,cta,start_time,end_time,days,active')
      .in('biz_id', ids)
      .eq('kind', 'alerta')
      .eq('active', true),
    supabase
      .from('promotions')
      .select('id,biz_id,title,body,discount,image_url,start_date,end_date,start_time,end_time,days')
      .in('biz_id', ids)
      .eq('kind', 'oferta')
      .eq('active', true),
  ])

  const catalog: Record<string, Service[]> = {}
  const businesses = bizRows.map(b => {
    const grad: [string, string] = [b.grad_from || '#5FA6B0', b.grad_to || '#2E6E78']
    catalog[b.id] = (svcRows ?? []).filter(s => s.biz_id === b.id).map(s => mapService(s as DbService, grad))
    const reviews = (revRows ?? []).filter(r => r.biz_id === b.id).map(mapReview)
    const alerts = (alertRows ?? []).filter(a => a.biz_id === b.id).map(a => mapAlert(a as DbAlert))
    const offers = (offerRows ?? []).filter(o => o.biz_id === b.id).map(o => mapOffer(o as DbOffer))
    // Portada de la tarjeta en Discover: la imagen del producto que el negocio
    // eligió destacar; si no eligió uno (o no tiene imagen), cae a la primera
    // imagen del catálogo.
    const featuredImg = b.featured_service_id
      ? catalog[b.id].find(s => s.id === b.featured_service_id)?.img
      : undefined
    const cover = featuredImg ?? catalog[b.id].find(s => s.img)?.img
    return mapBusiness(b, grad, reviews, alerts, offers, cover)
  })

  return { businesses, catalog }
}
