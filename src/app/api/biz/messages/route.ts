import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface DbMessage { id: string; biz_id: string; user_id: string; from_role: string; body: string; read_at: string | null; created_at: string }

async function ownedBizIds(userId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId)
  return (data ?? []).map(r => r.biz_id as string)
}

// Inbox del negocio: hilos agrupados por cliente, con su nombre.
//  GET ?biz_id= → hilos del negocio.
//  POST {biz_id, user_id, body} → el negocio responde (guarda from_role='biz').
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  const owned = await ownedBizIds(user.id)
  if (!bizId || !owned.includes(bizId)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('messages')
    .select('id,biz_id,user_id,from_role,body,read_at,created_at')
    .eq('biz_id', bizId)
    .order('created_at', { ascending: true })

  const byUser = new Map<string, DbMessage[]>()
  for (const m of (rows ?? []) as DbMessage[]) {
    if (!byUser.has(m.user_id)) byUser.set(m.user_id, [])
    byUser.get(m.user_id)!.push(m)
  }
  const userIds = [...byUser.keys()]
  const names: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profs } = await admin.from('profiles').select('id,full_name').in('id', userIds)
    for (const p of profs ?? []) names[p.id as string] = (p.full_name as string) || ''
  }

  const threads = userIds.map(uid => {
    const msgs = byUser.get(uid)!
    const last = msgs[msgs.length - 1]
    const unread = msgs.some(m => m.from_role === 'user' && !m.read_at)
    return {
      userId: uid,
      who: names[uid] || 'Cliente',
      last: last.body,
      created_at: last.created_at,
      unread,
      messages: msgs,
    }
  })
  return NextResponse.json({ threads })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { biz_id, user_id, body } = await req.json()
  const text = (body ?? '').trim()
  if (!biz_id || !user_id || !text) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

  const owned = await ownedBizIds(user.id)
  if (!owned.includes(biz_id)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data: msg, error } = await admin
    .from('messages')
    .insert({ biz_id, user_id, from_role: 'biz', body: text })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: msg })
}
