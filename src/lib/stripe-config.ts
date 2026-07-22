// Config compartida de qué cobros de Stripe están habilitados en la plataforma.
// La define el super admin (/admin → Integraciones); el resto de la plataforma
// la consume. En el demo se sincroniza vía localStorage; en producción esto
// vendría del backend. Las llaves reales viven en variables de entorno
// (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
// y las usa el cliente en ./stripe.ts.

export type StripeOption = { id: string; label: string; labelEn?: string; desc: string; descEn?: string; on: boolean }

export const STRIPE_OPTIONS_DEFAULT: StripeOption[] = [
  { id: 'deposits', label: 'Depósitos de reserva', labelEn: 'Booking deposits', desc: 'Cobra un depósito para asegurar la reserva', descEn: 'Charge a deposit to secure the booking', on: true },
  { id: 'featured', label: 'Pagos de Destacados', labelEn: 'Featured payments', desc: 'Cobra las campañas Premium y Destacado', descEn: 'Charge Premium and Featured campaigns', on: true },
  { id: 'refunds', label: 'Reembolsos automáticos', labelEn: 'Automatic refunds', desc: 'Devuelve el depósito al confirmar la visita', descEn: 'Return the deposit when the visit is confirmed', on: true },
  { id: 'noshow', label: 'Cargo por no-show', labelEn: 'No-show charge', desc: 'Retén y cobra si el cliente no se presenta', descEn: 'Hold and charge if the customer doesn’t show', on: false },
  { id: 'connect', label: 'Pagos a negocios (Connect)', labelEn: 'Payouts to businesses (Connect)', desc: 'Transfiere automáticamente a cada negocio', descEn: 'Automatically transfers to each business', on: false },
]

export type StripeConfig = { connected: boolean; options: StripeOption[] }

const KEY = 'reva_stripe_config'

export function loadStripeConfig(): StripeConfig {
  if (typeof window === 'undefined') return { connected: false, options: STRIPE_OPTIONS_DEFAULT }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { connected: false, options: STRIPE_OPTIONS_DEFAULT }
    const parsed = JSON.parse(raw) as { connected?: boolean; options?: { id: string; on: boolean }[] }
    const options = STRIPE_OPTIONS_DEFAULT.map(d => ({ ...d, on: parsed.options?.find(o => o.id === d.id)?.on ?? d.on }))
    return { connected: !!parsed.connected, options }
  } catch {
    return { connected: false, options: STRIPE_OPTIONS_DEFAULT }
  }
}

export function saveStripeConfig(c: StripeConfig) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify({ connected: c.connected, options: c.options.map(o => ({ id: o.id, on: o.on })) }))
  } catch {
    // ignore
  }
}

// Detecta el modo a partir del prefijo de la clave publicable.
export function stripeMode(pk: string): 'live' | 'test' | null {
  const v = pk.trim()
  if (v.startsWith('pk_live_')) return 'live'
  if (v.startsWith('pk_test_')) return 'test'
  return null
}
