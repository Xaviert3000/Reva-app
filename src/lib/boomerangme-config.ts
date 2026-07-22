// Config compartida de qué opciones de lealtad de BoomerangMe están habilitadas.
// La define el super admin (/admin → Integraciones) y los negocios (/biz →
// Promociones · Lealtad) la consumen. En el demo se sincroniza vía localStorage;
// en producción esto vendría del backend. Las API keys reales viven en variables
// de entorno (BOOMERANGME_API_KEY) y las usa el cliente en ./boomerangme.ts.

export type BMOption = { id: string; label: string; labelEn?: string; desc: string; descEn?: string; on: boolean }

export const BM_OPTIONS_DEFAULT: BMOption[] = [
  { id: 'stamps', label: 'Tarjeta de sellos', labelEn: 'Stamp card', desc: 'Sella visitas y entrega una recompensa al completar', descEn: 'Stamp visits and give a reward on completion', on: true },
  { id: 'cashback', label: 'Cashback', labelEn: 'Cashback', desc: 'Devuelve un % de cada compra como saldo', descEn: 'Return a % of each purchase as balance', on: true },
  { id: 'coupons', label: 'Cupones', labelEn: 'Coupons', desc: 'Ofertas canjeables por tiempo limitado', descEn: 'Time-limited redeemable offers', on: true },
  { id: 'discount', label: 'Descuentos', labelEn: 'Discounts', desc: 'Descuento fijo o por nivel de cliente', descEn: 'Flat discount or by customer tier', on: false },
  { id: 'membership', label: 'Membresía', labelEn: 'Membership', desc: 'Niveles VIP con beneficios recurrentes', descEn: 'VIP tiers with recurring perks', on: false },
  { id: 'multipass', label: 'Multipase', labelEn: 'Multi-pass', desc: 'Paquetes prepagados (ej. 10 clases)', descEn: 'Prepaid packages (e.g. 10 classes)', on: false },
  { id: 'referral', label: 'Referidos', labelEn: 'Referrals', desc: 'Recompensa a quien invita y al invitado', descEn: 'Reward the referrer and the invitee', on: true },
  { id: 'giftcard', label: 'Tarjeta de regalo', labelEn: 'Gift card', desc: 'Saldo regalable entre clientes', descEn: 'Giftable balance between customers', on: false },
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
