import { NextRequest, NextResponse } from 'next/server'
import { getCustomerStamps } from '@/lib/boomerangme'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stamps = await getCustomerStamps(user.id)
  return NextResponse.json({ stamps })
}
