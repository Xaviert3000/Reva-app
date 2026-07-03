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
      .update({ featured: false, tier: null, featured_until: null })
      .eq('id', bizId)
    if (error) throw error
    return true
  } catch (e) {
    console.warn('[featured] clearFeatured falló:', e)
    return false
  }
}
