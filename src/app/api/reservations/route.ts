import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { issueStamp } from '@/lib/boomerangme'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { biz_id, slot, party, notes, deposit_amount } = body

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      user_id: user.id,
      biz_id,
      slot,
      party,
      notes,
      deposit_amount: deposit_amount ?? 0,
      status: 'confirmed',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Issue loyalty stamp via BoomerangMe (non-blocking)
  issueStamp(user.id, biz_id, 2).catch(console.error)

  return NextResponse.json({ reservation })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('reservations')
    .select('*, businesses(name, hood, type)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservations: data })
}
