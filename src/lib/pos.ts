// Punto de venta — puente entre el panel del negocio y Supabase.
// Registra cada venta cobrada (encabezado en `pos_sales` + renglones en
// `pos_sale_items`, migración 003) con snapshot de nombre y precio al momento de
// vender, y los datos de la transacción cuando el pago fue con Tarjeta o
// Transferencia (auth_code / card_last4 / reference, migración 019).
//
// Igual que `inventory.ts` y `catalog.ts`, todo está protegido por
// `supabaseEnabled`: sin credenciales de Supabase (modo demo) es un no-op
// silencioso y el panel sigue trabajando sólo con su estado local. Requiere que
// quien cobra sea miembro del negocio (RLS de `pos_sales` / `pos_sale_items`).
import { createClient } from './supabase/client'
import { supabaseEnabled } from './inventory'

// Los ids de servicio del catálogo real son UUID; en demo pueden no serlo. Sólo
// enlazamos service_id cuando es un UUID válido (la FK lo exige); si no, va null
// y el renglón conserva igual el nombre y precio como snapshot.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface SaleItemInput { service_id?: string; name: string; unit_price: number; qty: number }
export interface SaleInput {
  method: string          // 'efectivo' | 'tarjeta' | 'transferencia'
  subtotal: number        // base sin IVA (total - IVA)
  tax_amount: number      // IVA incluido/agregado
  tax_rate: number
  total: number
  item_count: number
  auth_code?: string      // Tarjeta: código de autorización
  card_last4?: string     // Tarjeta: últimos 4 dígitos
  reference?: string      // Transferencia: folio / comprobante
  cash_received?: number  // Efectivo: monto recibido del cliente
  change_due?: number     // Efectivo: cambio devuelto
  folio?: string          // Folio imprimible del ticket (el que ve el cliente)
  items: SaleItemInput[]
}

// Inserta la venta y sus renglones. Devuelve el id de la venta, o null si
// Supabase no está configurado / falló (el POS ya mostró la confirmación local).
export async function recordSale(bizId: string, sale: SaleInput): Promise<string | null> {
  if (!supabaseEnabled || !bizId) return null
  try {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('pos_sales')
      .insert({
        biz_id: bizId,
        cashier_id: userData.user?.id ?? null,
        subtotal: sale.subtotal,
        tax_amount: sale.tax_amount,
        tax_rate: sale.tax_rate,
        total: sale.total,
        item_count: sale.item_count,
        payment_method: sale.method,
        auth_code: sale.auth_code ?? null,
        card_last4: sale.card_last4 ?? null,
        reference: sale.reference ?? null,
      })
      .select('id')
      .single()
    if (error) throw error
    const saleId = data?.id as string | undefined
    if (!saleId) return null

    const rows = sale.items.map(it => ({
      sale_id: saleId,
      service_id: it.service_id && UUID_RE.test(it.service_id) ? it.service_id : null,
      name: it.name,
      unit_price: it.unit_price,
      qty: it.qty,
    }))
    if (rows.length > 0) {
      const { error: itemsErr } = await supabase.from('pos_sale_items').insert(rows)
      if (itemsErr) throw itemsErr
    }

    // Guarda el folio imprimible como paso aditivo y best-effort: si la columna
    // `folio` aún no existe (migración 020 sin aplicar) esto falla en silencio
    // pero la venta YA quedó registrada. Así el folio nunca puede romper el
    // guardado de ventas.
    if (sale.folio) {
      const { error: folioErr } = await supabase.from('pos_sales').update({ folio: sale.folio }).eq('id', saleId)
      if (folioErr) console.warn('[pos] no se pudo guardar el folio (¿migración 020?):', folioErr.message)
    }

    // Efectivo recibido / cambio, también aditivo y best-effort: si las columnas
    // aún no existen (migración 027 sin aplicar) esto falla en silencio pero la
    // venta YA quedó registrada. Sólo se guarda cuando el dueño capturó el monto.
    if (sale.cash_received != null) {
      const { error: cashErr } = await supabase.from('pos_sales')
        .update({ cash_received: sale.cash_received, change_due: sale.change_due ?? 0 }).eq('id', saleId)
      if (cashErr) console.warn('[pos] no se pudo guardar el efectivo recibido (¿migración 027?):', cashErr.message)
    }
    return saleId
  } catch (e) {
    console.warn('[pos] recordSale falló:', e)
    return null
  }
}
