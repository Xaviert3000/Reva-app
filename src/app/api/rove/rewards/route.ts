import { NextRequest, NextResponse } from 'next/server'
import { getActiveRewards, proposeReward } from '@/lib/rove-db'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ rewards: await getActiveRewards() })
}

// Negocios proponen recompensas — llegan en estado 'pending' hasta que admin apruebe.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { bizId, bizName, bizLetter, bizColor, title, description, ticketCost, category, stock, validDays } = body

  if (!bizId || !title || !ticketCost || !category) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // El proponente debe ser miembro del negocio.
  const { data: membership } = await createAdminClient()
    .from('biz_members').select('biz_id').eq('user_id', user.id).eq('biz_id', bizId).maybeSingle()
  if (!membership) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const reward = await proposeReward(bizId, bizName ?? bizId, bizLetter ?? bizId[0].toUpperCase(), bizColor ?? '#888', {
    title,
    description: description ?? '',
    ticketCost: Number(ticketCost),
    category,
    stock: stock ?? null,
    validDays: validDays ?? 30,
  })

  return NextResponse.json({ reward }, { status: 201 })
}
