// Config compartida de qué cobros de Stripe están habilitados en la plataforma.
// La define el super admin (/admin → Integraciones); el resto de la plataforma
// la consume. En el demo se sincroniza vía localStorage; en producción esto
// vendría del backend. Las llaves reales viven en variables de entorno
// (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
// y las usa el cliente en ./stripe.ts.

export type StripeOption = { id: string; label: string; desc: string; on: boolean }

export const STRIPE_OPTIONS_DEFAULT: StripeOption[] = [
  { id: 'deposits', label: 'Depósitos de reserva', desc: 'Cobra un depósito para asegurar la reserva', on: true },
  { id: 'featured', label: 'Pagos de Destacados', desc: 'Cobra las campañas Premium y Destacado', on: true },
  { id: 'refunds', label: 'Reembolsos automáticos', desc: 'Devuelve el depósito al confirmar la visita', on: true },
  { id: 'noshow', label: 'Cargo por no-show', desc: 'Retén y cobra si el cliente no se presenta', on: false },
  { id: 'connect', label: 'Pagos a negocios (Connect)', desc: 'Transfiere automáticamente a cada negocio', on: false },
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
