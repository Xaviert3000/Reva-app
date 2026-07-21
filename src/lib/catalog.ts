// Catálogo — puente entre el panel del negocio y Supabase.
// Persiste los servicios (crear/editar/eliminar) y sus imágenes. Las imágenes
// viven en Supabase Storage (bucket `service-images`, una carpeta por negocio)
// y su URL pública se guarda en `services.image_url`.
//
// Igual que `inventory.ts`, todo está protegido por `supabaseEnabled`: sin
// credenciales de Supabase (modo demo) estas funciones son no-ops silenciosas y
// el panel sigue trabajando sólo con su estado local. Requiere que quien edita
// sea miembro del negocio (RLS de `services` y de `storage.objects`).
import { createClient } from './supabase/client'
import { supabaseEnabled } from './inventory'

const BUCKET = 'service-images'

// "$2,400" / "2400 MXN" → 2400 ; vacío / no numérico → null (se mostrará como
// "Cotización" al recargar). Mismo criterio que /api/biz/onboard.
export function parsePrice(raw: string): number | null {
  const n = Number(String(raw).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

// Sube la imagen del servicio al bucket y devuelve su URL pública. La ruta es
// `<biz_id>/<uuid>.<ext>` para que las políticas de storage validen la membresía
// por el primer segmento de la carpeta. Devuelve null si falla / está en demo.
export async function uploadServiceImage(bizId: string, file: File): Promise<string | null> {
  if (!supabaseEnabled || !bizId || !file) return null
  try {
    const supabase = createClient()
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `${bizId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    })
    if (error) throw error
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  } catch (e) {
    console.warn('[catalog] uploadServiceImage falló:', e)
    return null
  }
}

// Borra (best-effort) una imagen del bucket a partir de su URL pública. Se usa al
// eliminar un servicio para no dejar archivos huérfanos. No falla nunca.
export async function removeServiceImage(url: string | null | undefined): Promise<void> {
  if (!supabaseEnabled || !url) return
  try {
    const marker = `/${BUCKET}/`
    const i = url.indexOf(marker)
    if (i === -1) return // no es una URL de nuestro bucket (p.ej. data URL de demo)
    const path = decodeURIComponent(url.slice(i + marker.length))
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove([path])
  } catch (e) {
    console.warn('[catalog] removeServiceImage falló:', e)
  }
}

export interface ServiceInput {
  name: string
  description: string | null
  price: number | null
  price_label: string | null // texto exacto que escribió el dueño (ej. "Desde $200")
  duration_min: number | null
  scheduled: boolean
  active: boolean
  image_url: string | null
  stock: number | null
}

// Crea (id undefined → insert, devuelve el nuevo id) o actualiza un servicio.
// Devuelve el id persistido, o null si Supabase no está configurado / falló.
export async function saveService(
  bizId: string,
  id: string | undefined,
  input: ServiceInput,
): Promise<string | null> {
  if (!supabaseEnabled || !bizId) return null
  try {
    const supabase = createClient()
    if (id) {
      const { error } = await supabase.from('services').update(input).eq('id', id)
      if (error) throw error
      return id
    }
    const { data, error } = await supabase
      .from('services')
      .insert({ biz_id: bizId, ...input })
      .select('id')
      .single()
    if (error) throw error
    return data?.id ?? null
  } catch (e) {
    console.warn('[catalog] saveService falló:', e)
    return null
  }
}

// Elimina un servicio del catálogo. Devuelve true si se borró.
export async function deleteService(id: string): Promise<boolean> {
  if (!supabaseEnabled || !id) return false
  try {
    const supabase = createClient()
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) {
    console.warn('[catalog] deleteService falló:', e)
    return false
  }
}
