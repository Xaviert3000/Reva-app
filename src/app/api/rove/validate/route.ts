import { NextRequest, NextResponse } from 'next/server'
import { validateRedemptionCode } from '@/lib/rove-rewards'

// Llamado desde el Escáner del panel /biz para marcar un canje como usado.
export async function POST(req: NextRequest) {
  const { code, bizId } = await req.json()
  if (!code) return NextResponse.json({ error: 'code requerido' }, { status: 400 })

  const result = validateRedemptionCode(code, bizId ?? '')

  if (!result.ok) {
    const status = result.error === 'not_found' ? 404 : 400
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ redemption: result.redemption })
}
