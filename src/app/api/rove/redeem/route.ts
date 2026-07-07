import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redeemReward, getUserRedemptions } from '@/lib/rove-db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ redemptions: [] })
  return NextResponse.json({ redemptions: await getUserRedemptions(user.id) })
}
