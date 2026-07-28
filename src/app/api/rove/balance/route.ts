import { NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase/route-auth'
import { getBalance, getTicketHistory } from '@/lib/rove-db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Acepta cookie (web) o Bearer token (app nativa).
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ balance: 0, history: [] })
  const [balance, history] = await Promise.all([getBalance(user.id), getTicketHistory(user.id)])
  return NextResponse.json({ balance, history })
}
