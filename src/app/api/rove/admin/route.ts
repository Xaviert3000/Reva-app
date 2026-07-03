import { NextRequest, NextResponse } from 'next/server'
import { getAllRewards, reviewReward } from '@/lib/rove-rewards'

export async function GET() {
  return NextResponse.json({ rewards: getAllRewards() })
}

// Admin aprueba, rechaza o pausa una recompensa.
export async function PATCH(req: NextRequest) {
  const { rewardId, decision, ticketCost, rejectionReason } = await req.json()

  if (!rewardId || !decision) {
    return NextResponse.json({ error: 'rewardId y decision requeridos' }, { status: 400 })
  }
  if (!['active', 'rejected', 'paused'].includes(decision)) {
    return NextResponse.json({ error: 'decision inválida' }, { status: 400 })
  }

  const reward = reviewReward(rewardId, decision, ticketCost, rejectionReason)
  if (!reward) return NextResponse.json({ error: 'Recompensa no encontrada' }, { status: 404 })

  return NextResponse.json({ reward })
}
