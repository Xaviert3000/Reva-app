import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Comunicados que el super-admin dirige a este negocio.
//   GET  ?biz_id= → comunicados que aplican al negocio (según su segmento),
//                   marcando cuáles ya leyó.
//   POST {biz_id, communication_id} → marca el comunicado como leído.

type CommRow = {
  id: string; title: string; body: string; priority: string
  audience: string; audience_value: string | null; audience_ids: string[] | null
  sent_by: string | null; created_at: string
}
type BizRow = { id: string; municipio: string | null; kind: string | null; type: string | null; tier: string | null }

function matches(c: CommRow, b: BizRow): boolean {
  switch (c.audience) {
    case 'all': return true
    case 'municipio': return !!c.audience_value && b.municipio === c.audience_value
    case 'category': return !!c.audience_value && (b.kind === c.audience_value || b.type === c.audience_value)
    case 'tier': return !!c.audience_value && b.tier === c.audience_value
    case 'specific': return (c.audience_ids ?? []).includes(b.id)
    default: return false
  }
}

async function ownsBiz(userId: string, bizId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId).eq('biz_id', bizId).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  if (!bizId || !(await ownsBiz(user.id, bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()
  const { data: bizRows } = await db.from('businesses').select('id,municipio,kind,type,tier').eq('id', bizId).maybeSingle()
  const biz = bizRows as BizRow | null
  if (!biz) return NextResponse.json({ communications: [] })

  const { data, error } = await db
    .from('business_communications')
    .select('id,title,body,priority,audience,audience_value,audience_ids,sent_by,created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const applicable = ((data ?? []) as CommRow[]).filter(c => matches(c, biz))

  // Cuáles ya leyó este negocio.
  const { data: reads } = await db
    .from('business_communication_reads')
    .select('communication_id')
    .eq('biz_id', bizId)
  const readSet = new Set((reads ?? []).map(r => r.communication_id as string))

  const communications = applicable.map(c => ({
    id: c.id,
    title: c.title,
    body: c.body,
    priority: c.priority,
    sentBy: c.sent_by,
    createdAt: c.created_at,
    read: readSet.has(c.id),
  }))

  return NextResponse.json({ communications })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { biz_id, communication_id } = await req.json().catch(() => ({}))
  if (!biz_id || !communication_id) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  if (!(await ownsBiz(user.id, biz_id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()
  const { error } = await db
    .from('business_communication_reads')
    .upsert({ communication_id, biz_id }, { onConflict: 'communication_id,biz_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
