// Inventario — puente entre el panel del negocio y Supabase.
// El catálogo (existencias incluidas) vive en la tabla `services`; el descuento
// por venta se hace de forma atómica con el RPC `decrement_service_stock`.
//
// Todo aquí está protegido por `supabaseEnabled`: si el proyecto aún no tiene
// credenciales de Supabase (modo demo), estas funciones son no-ops silenciosas y
// el panel sigue trabajando sólo con su estado local. En cuanto se configuran las
// variables NEXT_PUBLIC_SUPABASE_* y el negocio existe con sesión, las
// existencias persisten y se sincronizan con la app del cliente (`/app`).
import { createClient } from './supabase/client'

// ¿Hay credenciales de Supabase en el entorno? (evita llamadas que van a fallar)
export const supabaseEnabled = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export interface StockRow { id: string; stock: number | null }

// Lee las existencias actuales del catálogo de un negocio. Devuelve `null` si
// Supabase no está configurado, para que el llamador use su estado local.
export async function fetchStock(bizId: string): Promise<StockRow[] | null> {
  if (!supabaseEnabled) return null
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('id,stock')
      .eq('biz_id', bizId)
    if (error) throw error
    return (data ?? []) as StockRow[]
  } catch (e) {
    console.warn('[inventory] fetchStock falló:', e)
    return null
  }
}

// Fija (o quita, con null) las existencias de un servicio. Requiere que quien
// edita sea miembro del negocio (RLS). Regresa true si se guardó.
export async function saveStock(serviceId: string, stock: number | null): Promise<boolean> {
  if (!supabaseEnabled || !serviceId) return false
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('services')
      .update({ stock })
      .eq('id', serviceId)
    if (error) throw error
    return true
  } catch (e) {
    console.warn('[inventory] saveStock falló:', e)
    return false
  }
}

export interface SoldItem { service_id: string; qty: number }

// Descuenta el inventario de las unidades vendidas, de forma atómica y sólo para
// productos con seguimiento. Devuelve el stock resultante por servicio, o null si
// Supabase no está configurado / falló (el POS ya actualizó su estado local).
export async function decrementStock(bizId: string, items: SoldItem[]): Promise<StockRow[] | null> {
  const clean = items.filter(i => i.service_id && i.qty > 0)
  if (!supabaseEnabled || clean.length === 0) return null
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('decrement_service_stock', {
      p_biz_id: bizId,
      p_items: clean,
    })
    if (error) throw error
    return (data ?? []) as StockRow[]
  } catch (e) {
    console.warn('[inventory] decrementStock falló:', e)
    return null
  }
}
