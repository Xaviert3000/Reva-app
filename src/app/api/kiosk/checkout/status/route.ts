import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { finalizeKioskSession } from '@/lib/kiosk-finalize'

export const dynamic = 'force-dynamic'

async function ownerOf(bizId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId).eq('biz_id', bizId).maybeSingle()
  return !!data
}

// Sondea el estado de un Checkout del kiosko. El kiosko lo llama cada pocos
// segundos mientras muestra el QR. Dispara la finalización idempotente: si el pago
// ya se completó, registra la venta (una sola vez, compartido con el webhook) y
// devuelve el folio para que el kiosko confirme la orden.
// GET /api/kiosk/checkout/status?id=<session_id>&biz_id=<uuid>
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  const bizId = req.nextUrl.searchParams.get('biz_id')
  if (!id || !bizId) return NextResponse.json({ error: 'id y biz_id requeridos' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const result = await finalizeKioskSession(id)
  return NextResponse.json({ paid: result.paid, folio: result.folio ?? null, last4: result.last4 ?? null })
}
