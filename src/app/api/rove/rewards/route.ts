import { NextRequest, NextResponse } from 'next/server'
import { getActiveRewards, proposeReward } from '@/lib/rove-rewards'

export async function GET() {
  return NextResponse.json({ rewards: getActiveRewards() })
}

// Negocios proponen recompensas — llegan en estado 'pending' hasta que admin apruebe.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { bizId, bizName, bizLetter, bizColor, title, description, ticketCost, category, stock, validDays } = body

  if (!bizId || !title || !ticketCost || !category) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const reward = proposeReward(bizId, bizName ?? bizId, bizLetter ?? bizId[0].toUpperCase(), bizColor ?? '#888', {
    title,
    description: description ?? '',
    ticketCost: Number(ticketCost),
    category,
    stock: stock ?? null,
    validDays: validDays ?? 30,
  })

  return NextResponse.json({ reward }, { status: 201 })
}
