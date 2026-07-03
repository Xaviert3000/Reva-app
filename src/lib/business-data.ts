// Loads businesses + catalog for the city the guest is currently in.
// Los Cabos keeps the rich curated demo dataset (bilingual copy, reviews,
// alerts) baked into data.ts. Any other municipio is read live from Supabase
// (businesses/services tables) — real data, thinner shape, mapped onto the
// same Business/Service interfaces so the UI doesn't need to branch on source.
import { createClient } from './supabase/client'
import { BIZ, CATALOG, slotsFromHours, type Business, type Service } from './data'

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
  duration_min: number | null
  stock: number | null
}

function mapService(s: DbService, grad: [string, string]): Service {
  return {
    id: s.id,
    name: s.name,
    sub: s.description || '',
    price: s.price ? `$${s.price}` : 'Cotización',
    category: 'General',
    grad,
    duration: s.duration_min ?? undefined,
    // null en la BD = disponibilidad ilimitada (sin seguimiento de inventario).
    stock: s.stock ?? undefined,
  }
}

function mapBusiness(b: DbBusiness, grad: [string, string]): Business {
  const hours = b.hours || '09:00 – 21:00'
  const slots = slotsFromHours(hours, 60)
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
    featured: !!b.featured,
    grad,
    mono: b.mono || b.name.charAt(0).toUpperCase(),
    en: `${b.name} — ${b.type || 'local favorite'} in ${b.hood || b.municipio}.`,
    es: `${b.name} — ${b.type || 'favorito local'} en ${b.hood || b.municipio}.`,
    tags: [],
    reviews: [],
    slots: slots.length > 0 ? slots : ['12:00', '14:00', '19:00'],
  }
}

export interface CityData {
  businesses: Business[]
  catalog: Record<string, Service[]>
}

export const LOS_CABOS_DATA: CityData = { businesses: BIZ, catalog: CATALOG }

// Fetches real businesses + their active services for a given municipio.
// Falls back to the curated Los Cabos demo data if the city has nothing in
// Supabase yet (so the rest of the app never sees an empty city).
export async function fetchCityData(municipio: string): Promise<CityData> {
  if (municipio === 'Los Cabos') return LOS_CABOS_DATA

  const supabase = createClient()
  const { data: bizRows, error } = await supabase
    .from('businesses')
    .select('id,name,type,kind,hood,municipio,hours,rating,local_fav,featured,grad_from,grad_to,mono')
    .eq('municipio', municipio)

  if (error || !bizRows || bizRows.length === 0) return LOS_CABOS_DATA

  const ids = bizRows.map(b => b.id)
  const { data: svcRows } = await supabase
    .from('services')
    .select('id,biz_id,name,description,price,duration_min,stock')
    .in('biz_id', ids)
    .eq('active', true)

  const catalog: Record<string, Service[]> = {}
  const businesses = bizRows.map(b => {
    const grad: [string, string] = [b.grad_from || '#5FA6B0', b.grad_to || '#2E6E78']
    catalog[b.id] = (svcRows ?? []).filter(s => s.biz_id === b.id).map(s => mapService(s, grad))
    return mapBusiness(b, grad)
  })

  return { businesses, catalog }
}
