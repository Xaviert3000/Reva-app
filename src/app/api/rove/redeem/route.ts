import { NextRequest, NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase/route-auth'
import { redeemReward, getUserRedemptions } from '@/lib/rove-db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Acepta cookie (web) o Bearer token (app nativa).
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { rewardId } = await req.json()
  if (!rewardId) return NextResponse.json({ error: 'rewardId requerido' }, { status: 400 })

  const result = await redeemReward(user.id, rewardId)
  if (!result.ok) {
    const status = result.error === 'insufficient_tickets' ? 400 : 404
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ redemption: result.redemption })
}

export async function GET(req: NextRequest) {
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ redemptions: [] })
  return NextResponse.json({ redemptions: await getUserRedemptions(user.id) })
}
