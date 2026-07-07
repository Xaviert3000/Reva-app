import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBalance, getTicketHistory } from '@/lib/rove-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ balance: 0, history: [] })
  const [balance, history] = await Promise.all([getBalance(user.id), getTicketHistory(user.id)])
  return NextResponse.json({ balance, history })
}
