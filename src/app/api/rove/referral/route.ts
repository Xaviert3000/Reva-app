import { NextRequest, NextResponse } from 'next/server'
import { getReferralCode, getReferralStats, applyReferralCode } from '@/lib/rove-rewards'

const DEMO_USER_ID = 'demo-user'

// GET — devuelve el código y stats del usuario
export async function GET() {
  const stats = getReferralStats(DEMO_USER_ID)
  const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://reva.app'
  return NextResponse.json({
    code: stats.code,
    link: `${BASE}/join?ref=${stats.code}`,
    totalReferred: stats.totalReferred,
    completed: stats.completed,
    pending: stats.pending,
  })
}

// POST — nuevo usuario aplica un código de referido
export async function POST(req: NextRequest) {
  const { code, userId } = await req.json()
  if (!code || !userId) return NextResponse.json({ error: 'code y userId requeridos' }, { status: 400 })

  const result = applyReferralCode(code, userId)
  if (!result.ok) {
    const status = result.error === 'code_not_found' ? 404 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ referral: result.referral })
}
