import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

// Comisión de la plataforma (Reva) sobre cada cobro repartido a un negocio
// vía Stripe Connect. 0.02 = 2%. La toma Reva; el resto va al negocio.
export const PLATFORM_COMMISSION = 0.02

// Comisión de la plataforma en centavos, a partir de un monto en la moneda base.
export function commissionAmount(amount: number): number {
  return Math.round(amount * 100 * PLATFORM_COMMISSION)
}

