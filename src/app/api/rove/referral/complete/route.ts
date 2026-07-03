import { NextRequest, NextResponse } from 'next/server'
import { completeReferral } from '@/lib/rove-rewards'

// Llamado internamente cuando el usuario referido completa su primera reserva.
export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

  const result = completeReferral(userId)
  return NextResponse.json(result)
}
