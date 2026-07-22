import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLATFORM_COMMISSION } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// Ingresos reales de la plataforma para el super-admin. Lee la tabla `payments`
// (poblada por el webhook de Stripe) y separa lo que efectivamente gana Reva:
//  · featured / subscription → el monto completo es ingreso de Reva.
//  · deposit                 → sólo la comisión (2%); el resto va al negocio.
// Devuelve la lista cruda + agregados listos para pintar en el panel.

type PaymentRow = {
  id: string
  user_id: string | null
  biz_id: string | null
  amount: number | string
  currency: string | null
  type: string | null
  status: string | null
  created_at: string
  businesses: { name: string | null; mono: string | null; grad_from: string | null; grad_to: string | null } | null
}

// Parte del cobro que se queda Reva, según el tipo de pago.
function revaCut(type: string | null, amount: number): number {
  if (type === 'deposit') return amount * PLATFORM_COMMISSION
  // featured, subscription y cualquier otro cobro directo a Reva: monto completo.
  return amount
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('payments')
    .select('id,user_id,biz_id,amount,currency,type,status,created_at, businesses(name,mono,grad_from,grad_to)')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as unknown as PaymentRow[]

  // Nombre del cliente desde profiles (mismo patrón que /api/admin/reservations).
  const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))] as string[]
  const names: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profs } = await db.from('profiles').select('id,full_name').in('id', userIds)
    for (const p of profs ?? []) names[p.id as string] = (p.full_name as string) || ''
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  // Agregados.
  const byType: Record<string, { count: number; gross: number; revenue: number }> = {}
  let gmv = 0            // volumen total procesado por el sistema
  let platform = 0       // ingreso real de Reva (todo el histórico)
  let platformMonth = 0  // ingreso real de Reva (mes en curso)

  const payments = rows.map(r => {
    const amount = Number(r.amount) || 0
    const type = r.type || 'otro'
    const revenue = revaCut(r.type, amount)
    gmv += amount
    platform += revenue
    if (new Date(r.created_at).getTime() >= monthStart) platformMonth += revenue

    const t = byType[type] ?? (byType[type] = { count: 0, gross: 0, revenue: 0 })
    t.count += 1
    t.gross += amount
    t.revenue += revenue

    return {
      id: r.id,
      created_at: r.created_at,
      type,
      amount,
      revenue,
      currency: r.currency || 'mxn',
      biz_name: r.businesses?.name || 'Negocio',
      mono: r.businesses?.mono || (r.businesses?.name || 'R').charAt(0).toUpperCase(),
      grad: [r.businesses?.grad_from || '#5FA6B0', r.businesses?.grad_to || '#2E6E78'] as [string, string],
      guest_name: r.user_id ? (names[r.user_id] || 'Cliente') : 'Cliente',
    }
  })

  return NextResponse.json({
    payments,
    totals: {
      gmv,
      platform,
      platformMonth,
      count: payments.length,
      byType,
      commissionRate: PLATFORM_COMMISSION,
    },
  })
}
