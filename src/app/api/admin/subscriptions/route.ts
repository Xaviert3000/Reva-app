import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Suscripciones al Plan Reva para el super admin. Reúne, por negocio, el estado
// del plan y el próximo cobro, más el historial de facturas (cobros aplicados) y
// las facturas futuras estimadas (próximo periodo de cada plan vigente).

type BizRow = {
  id: string
  name: string | null
  mono: string | null
  grad_from: string | null
  grad_to: string | null
  plan_status: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  plan_amount: number | string | null
  plan_cancel_at_period_end: boolean | null
  stripe_subscription_id: string | null
}

type InvoiceRow = {
  id: string
  biz_id: string | null
  amount: number | string | null
  currency: string | null
  status: string | null
  period_end: string | null
  due_date: string | null
  paid_at: string | null
  hosted_invoice_url: string | null
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()

  const [{ data: bizData, error: bizErr }, { data: invData, error: invErr }] = await Promise.all([
    db.from('businesses')
      .select('id,name,mono,grad_from,grad_to,plan_status,trial_ends_at,current_period_end,plan_amount,plan_cancel_at_period_end,stripe_subscription_id')
      .order('name', { ascending: true }),
    db.from('invoices')
      .select('id,biz_id,amount,currency,status,period_end,due_date,paid_at,hosted_invoice_url')
      .order('created_at', { ascending: false })
      .limit(500),
  ])
  if (bizErr) return NextResponse.json({ error: bizErr.message }, { status: 500 })
  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

  const bizRows = (bizData ?? []) as BizRow[]
  const invRows = (invData ?? []) as InvoiceRow[]
  const bizById = new Map(bizRows.map(b => [b.id, b]))

  const grad = (b: BizRow | undefined): [string, string] => [b?.grad_from || '#5FA6B0', b?.grad_to || '#2E6E78']
  const monoOf = (b: BizRow | undefined) => b?.mono || (b?.name || 'R').charAt(0).toUpperCase()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  // Suscripciones (una por negocio). Sólo las que tienen plan real o prueba.
  const subscriptions = bizRows
    .filter(b => b.plan_status && b.plan_status !== 'none')
    .map(b => ({
      biz_id: b.id,
      biz_name: b.name || 'Negocio',
      mono: monoOf(b),
      grad: grad(b),
      status: b.plan_status,
      trial_ends_at: b.trial_ends_at,
      current_period_end: b.current_period_end,
      amount: Number(b.plan_amount) || 300,
      cancel_at_period_end: !!b.plan_cancel_at_period_end,
      has_subscription: !!b.stripe_subscription_id,
    }))

  // Facturas emitidas (cobros aplicados y pendientes).
  const invoices = invRows.map(iv => {
    const b = bizById.get(iv.biz_id || '')
    return {
      id: iv.id,
      biz_id: iv.biz_id,
      biz_name: b?.name || 'Negocio',
      mono: monoOf(b),
      grad: grad(b),
      amount: Number(iv.amount) || 0,
      currency: iv.currency || 'mxn',
      status: iv.status || 'open',
      period_end: iv.period_end,
      due_date: iv.due_date,
      paid_at: iv.paid_at,
      hosted_invoice_url: iv.hosted_invoice_url,
    }
  })

  // Facturas futuras estimadas: para cada plan vigente (activo o en prueba y no
  // cancelado), el siguiente cobro por su monto en la fecha de fin de periodo.
  const upcoming = subscriptions
    .filter(s => (s.status === 'active' || s.status === 'trialing') && !s.cancel_at_period_end)
    .map(s => {
      const date = s.current_period_end || (s.status === 'trialing' ? s.trial_ends_at : null)
      return date ? { biz_id: s.biz_id, biz_name: s.biz_name, mono: s.mono, grad: s.grad, amount: s.amount, date } : null
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a!.date!).getTime() - new Date(b!.date!).getTime())

  // Agregados.
  const activeCount = subscriptions.filter(s => s.status === 'active').length
  const trialCount = subscriptions.filter(s => s.status === 'trialing').length
  const pastDueCount = subscriptions.filter(s => s.status === 'past_due').length
  const mrr = subscriptions.filter(s => s.status === 'active').reduce((n, s) => n + s.amount, 0)
  const paidInvoices = invoices.filter(iv => iv.status === 'paid')
  const paidTotal = paidInvoices.reduce((n, iv) => n + iv.amount, 0)
  const paidMonth = paidInvoices
    .filter(iv => iv.paid_at && new Date(iv.paid_at).getTime() >= monthStart)
    .reduce((n, iv) => n + iv.amount, 0)

  return NextResponse.json({
    subscriptions,
    invoices,
    upcoming,
    totals: { mrr, activeCount, trialCount, pastDueCount, paidTotal, paidMonth, upcomingTotal: upcoming.reduce((n, u) => n + u!.amount, 0) },
  })
}
