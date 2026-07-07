import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateRedemptionCode } from '@/lib/rove-db'

export const dynamic = 'force-dynamic'

// Llamado desde el Escáner del panel /biz para marcar un canje como usado.
// Requiere sesión (el dueño escanea desde su panel).
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { code, bizId } = await req.json()
  if (!code) return NextResponse.json({ error: 'code requerido' }, { status: 400 })

  const result = await validateRedemptionCode(code, bizId ?? '')
  if (!result.ok) {
    const status = result.error === 'not_found' ? 404 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ redemption: result.redemption })
}
