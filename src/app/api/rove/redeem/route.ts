import { NextRequest, NextResponse } from 'next/server'
import { redeemReward, getUserRedemptions } from '@/lib/rove-rewards'

const DEMO_USER_ID = 'demo-user'

export async function POST(req: NextRequest) {
  const { rewardId } = await req.json()
  if (!rewardId) return NextResponse.json({ error: 'rewardId requerido' }, { status: 400 })

  const result = redeemReward(DEMO_USER_ID, rewardId)

  if (!result.ok) {
    const status = result.error === 'insufficient_tickets' ? 400 : 404
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ redemption: result.redemption })
}

export async function GET() {
  return NextResponse.json({ redemptions: getUserRedemptions(DEMO_USER_ID) })
}
