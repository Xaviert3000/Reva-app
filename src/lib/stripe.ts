import Stripe from 'stripe'

// Inicialización perezosa: el cliente sólo se crea la primera vez que se usa
// en runtime, nunca al importar el módulo. Esto evita que el build de Next
// falle al evaluar rutas cuando STRIPE_SECRET_KEY todavía no está disponible.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  _stripe = new Stripe(key, { apiVersion: '2026-05-27.dahlia' })
  return _stripe
}

// Comisión de la plataforma (Reva) sobre cada cobro repartido a un negocio
// vía Stripe Connect. 0.02 = 2%. La toma Reva; el resto va al negocio.
export const PLATFORM_COMMISSION = 0.02

// Comisión de la plataforma en centavos, a partir de un monto en la moneda base.
export function commissionAmount(amount: number): number {
  return Math.round(amount * 100 * PLATFORM_COMMISSION)
}

