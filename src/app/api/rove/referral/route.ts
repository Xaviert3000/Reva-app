import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReferralStats, applyReferralCode } from '@/lib/rove-db'

export const dynamic = 'force-dynamic'

// GET — devuelve el código y stats del usuario con sesión.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ code: '', link: '', totalReferred: 0, completed: 0, pending: 0 })

  const stats = await getReferralStats(user.id)
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reva-app-ten.vercel.app'
  return NextResponse.json({
    code: stats.code,
    link: `${BASE}/join?ref=${stats.code}`,
    totalReferred: stats.totalReferred,
    completed: stats.completed,
    pending: stats.pending,
  })
}

// POST — el usuario con sesión aplica un código de referido.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'code requerido' }, { status: 400 })

  const result = await applyReferralCode(code, user.id)
  if (!result.ok) {
    const status = result.error === 'code_not_found' ? 404 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ ok: true })
}
