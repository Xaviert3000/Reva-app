import { NextRequest, NextResponse } from 'next/server'
import {
  bmConfigured,
  issueStampBySerial,
  addPointsBySerial,
  redeemRewardBySerial,
} from '@/lib/boomerangme'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 15

type ScanAction = 'stamp' | 'points' | 'redeem'

type ScanBody = {
  action?: ScanAction
  serial?: string
  businessId?: string
  count?: number
  rewardId?: string
}

// POST /api/scan — the /biz Escáner posts a decoded Rove card here to run a
// BoomerangMe transaction (accrue stamp / add points / redeem reward) against the
// business's campaign using the platform-level keys.
//
// TODO(auth): before production, authenticate the request as the owning business
// (e.g. Supabase session like /api/reservations) and verify it owns `businessId`.
// The BoomerangMe keys stay server-side in env and are never exposed to the client.
export async function POST(req: NextRequest) {
  let body: ScanBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { action, serial, businessId, count, rewardId } = body
  if (!action || !serial || !businessId) {
    return NextResponse.json({ ok: false, error: 'Faltan action, serial o businessId' }, { status: 400 })
  }
  if (action !== 'stamp' && action !== 'points' && action !== 'redeem') {
    return NextResponse.json({ ok: false, error: `Acción desconocida: ${action}` }, { status: 400 })
  }

  // Auth (Fase 9): el escáner corre en el panel del dueño. Verifica sesión y que
  // el usuario sea miembro del negocio que dice operar.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  const { data: membership } = await createAdminClient()
    .from('biz_members').select('biz_id').eq('user_id', user.id).eq('biz_id', businessId).maybeSingle()
  if (!membership) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 })

  // Demo fallback: while the platform hasn't connected BoomerangMe, acknowledge the
  // transaction as simulated so the Escáner keeps working end-to-end.
  if (!bmConfigured()) {
    return NextResponse.json({ ok: true, simulated: true, action, serial })
  }

  try {
    let result: unknown
    if (action === 'stamp') {
      result = await issueStampBySerial(serial, businessId, Math.max(1, count ?? 1))
    } else if (action === 'points') {
      result = await addPointsBySerial(serial, businessId, Math.max(1, count ?? 0))
    } else {
      result = await redeemRewardBySerial(serial, businessId, rewardId)
    }
    return NextResponse.json({ ok: true, simulated: false, result })
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Error de BoomerangMe'
    return NextResponse.json({ ok: false, error }, { status: 502 })
  }
}
