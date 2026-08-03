// Visibilidad pagada (Destacado / Premium) — puente entre el panel del negocio
// (/biz → Destacado) y Supabase. El nivel vive en `businesses.tier` + el
// booleano `businesses.featured` (ver migración 007). La app del cliente (/app)
// lee ambos vía `featuredBadge()` para pintar ★ Premium o ✦ Destacado.
//
// Igual que `inventory.ts`, todo está protegido por `supabaseEnabled`: en modo
// demo (sin credenciales) estas funciones son no-ops silenciosas y el panel
// sigue con su estado local. Con Supabase configurado y sesión de miembro, el
// nivel persiste y se refleja en /app. El constraint de la BD exige que `tier`
// solo exista con `featured = true`, por eso ambas columnas se escriben juntas.
import { createClient } from './supabase/client'
import { supabaseEnabled } from './inventory'
import type { FeaturedTier } from './data'

// ── Varios destacados simultáneos (tabla `featured_items`, migración 045) ──────
// Un negocio puede tener varios destacados a la vez (Premium/Destacado para todo
// el negocio, eventos y/o productos). Estas funciones alimentan la lista del
// panel; las columnas de resumen de `businesses` las mantiene un trigger.

export type FeaturedKind = 'event' | 'service' | 'business'

export interface FeaturedEventData {
  title?: string
  date?: string | null
  description?: string | null
  image_url?: string | null
  days?: number[] | null
  start_time?: string | null
  end_time?: string | null
  terms?: string | null
}

export interface FeaturedItem {
  id: string
  kind: FeaturedKind
  tier: FeaturedTier
  featuredUntil: string | null
  serviceId: string | null
  event: FeaturedEventData | null
}

interface FeaturedItemRow {
  id: string
  kind: string
  tier: string
  featured_until: string | null
  service_id: string | null
  event: FeaturedEventData | null
}

function mapFeaturedItem(r: FeaturedItemRow): FeaturedItem {
  return {
    id: r.id,
    kind: (['event', 'service', 'business'].includes(r.kind) ? r.kind : 'business') as FeaturedKind,
    tier: r.tier === 'premium' ? 'premium' : 'destacado',
    featuredUntil: r.featured_until,
    serviceId: r.service_id,
    event: r.event ?? null,
  }
}

// Destacados ACTIVOS y vigentes del negocio (los que el dueño ve en el panel).
export async function fetchFeaturedItems(bizId: string): Promise<FeaturedItem[]> {
  if (!supabaseEnabled || !bizId) return []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('featured_items')
      .select('id,kind,tier,featured_until,service_id,event')
      .eq('biz_id', bizId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) throw error
    const now = Date.now()
    return (data ?? [])
      .map(r => mapFeaturedItem(r as FeaturedItemRow))
      .filter(i => !i.featuredUntil || new Date(i.featuredUntil).getTime() > now)
  } catch (e) {
    console.warn('[featured] fetchFeaturedItems falló:', e)
    return []
  }
}

// Pausa un destacado individual. El trigger recompone el resumen de `businesses`.
export async function pauseFeaturedItem(id: string): Promise<boolean> {
  if (!supabaseEnabled || !id) return false
  try {
    const supabase = createClient()
    const { error } = await supabase.from('featured_items').update({ status: 'paused' }).eq('id', id)
    if (error) throw error
    return true
  } catch (e) {
    console.warn('[featured] pauseFeaturedItem falló:', e)
    return false
  }
}

// Activa un nivel de visibilidad para el negocio (featured=true + tier) por
// `days` días — fija `featured_until` para que /app deje de mostrarlo al vencer.
// Regresa true si se guardó. Requiere ser miembro del negocio (RLS).
export async function activateFeatured(bizId: string, tier: FeaturedTier, days: number): Promise<boolean> {
  if (!supabaseEnabled || !bizId) return false
  try {
    const until = new Date(Date.now() + days * 86_400_000).toISOString()
    const supabase = createClient()
    const { error } = await supabase
      .from('businesses')
      .update({ featured: true, tier, featured_until: until })
      .eq('id', bizId)
    if (error) throw error
    return true
  } catch (e) {
    console.warn('[featured] activateFeatured falló:', e)
    return false
  }
}

// Pausa la visibilidad: featured=false y tier=null en una sola operación (para
// no violar el constraint que ata tier a featured). Regresa true si se guardó.
export async function clearFeatured(bizId: string): Promise<boolean> {
  if (!supabaseEnabled || !bizId) return false
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('businesses')
      .update({ featured: false, tier: null, featured_until: null, featured_service_id: null })
      .eq('id', bizId)
    if (error) throw error
    return true
  } catch (e) {
    console.warn('[featured] clearFeatured falló:', e)
    return false
  }
}
