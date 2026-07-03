// Config compartida de qué opciones de lealtad de BoomerangMe están habilitadas.
// La define el super admin (/admin → Integraciones) y los negocios (/biz →
// Promociones · Lealtad) la consumen. En el demo se sincroniza vía localStorage;
// en producción esto vendría del backend. Las API keys reales viven en variables
// de entorno (BOOMERANGME_API_KEY) y las usa el cliente en ./boomerangme.ts.

export type BMOption = { id: string; label: string; desc: string; on: boolean }

export const BM_OPTIONS_DEFAULT: BMOption[] = [
  { id: 'stamps', label: 'Tarjeta de sellos', desc: 'Sella visitas y entrega una recompensa al completar', on: true },
  { id: 'cashback', label: 'Cashback', desc: 'Devuelve un % de cada compra como saldo', on: true },
  { id: 'coupons', label: 'Cupones', desc: 'Ofertas canjeables por tiempo limitado', on: true },
  { id: 'discount', label: 'Descuentos', desc: 'Descuento fijo o por nivel de cliente', on: false },
  { id: 'membership', label: 'Membresía', desc: 'Niveles VIP con beneficios recurrentes', on: false },
  { id: 'multipass', label: 'Multipase', desc: 'Paquetes prepagados (ej. 10 clases)', on: false },
  { id: 'referral', label: 'Referidos', desc: 'Recompensa a quien invita y al invitado', on: true },
  { id: 'giftcard', label: 'Tarjeta de regalo', desc: 'Saldo regalable entre clientes', on: false },
]

export type BMConfig = { connected: boolean; options: BMOption[] }

const KEY = 'reva_bm_config'

export function loadBMConfig(): BMConfig {
  if (typeof window === 'undefined') return { connected: false, options: BM_OPTIONS_DEFAULT }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { connected: false, options: BM_OPTIONS_DEFAULT }
    const parsed = JSON.parse(raw) as { connected?: boolean; options?: { id: string; on: boolean }[] }
    const options = BM_OPTIONS_DEFAULT.map(d => ({ ...d, on: parsed.options?.find(o => o.id === d.id)?.on ?? d.on }))
    return { connected: !!parsed.connected, options }
  } catch {
    return { connected: false, options: BM_OPTIONS_DEFAULT }
  }
}

export function saveBMConfig(c: BMConfig) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify({ connected: c.connected, options: c.options.map(o => ({ id: o.id, on: o.on })) }))
  } catch {
    // ignore
  }
}
