import { NextResponse } from 'next/server'
import { getBalance, getTicketHistory } from '@/lib/rove-rewards'

// Demo: siempre resuelve como el usuario demo.
// En producción: leer userId de la sesión Supabase.
const DEMO_USER_ID = 'demo-user'

export async function GET() {
  const balance = getBalance(DEMO_USER_ID)
  const history = getTicketHistory(DEMO_USER_ID)
  return NextResponse.json({ balance, history })
}
