import { NextRequest, NextResponse } from 'next/server'
import { getAllRewards, reviewReward } from '@/lib/rove-db'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  return NextResponse.json({ rewards: await getAllRewards() })
}

// Admin aprueba, rechaza o pausa una recompensa.
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { rewardId, decision, ticketCost, rejectionReason } = await req.json()

  if (!rewardId || !decision) {
    return NextResponse.json({ error: 'rewardId y decision requeridos' }, { status: 400 })
  }
  if (!['active', 'rejected', 'paused'].includes(decision)) {
    return NextResponse.json({ error: 'decision inválida' }, { status: 400 })
  }

  const reward = await reviewReward(rewardId, decision, ticketCost, rejectionReason)
  if (!reward) return NextResponse.json({ error: 'Recompensa no encontrada' }, { status: 404 })

  return NextResponse.json({ reward })
}
