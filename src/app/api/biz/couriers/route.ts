import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function ownerOf(bizId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId).eq('biz_id', bizId).maybeSingle()
  return !!data
}

// GET /api/biz/couriers?biz_id=... → repartidores del negocio.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('couriers')
    .select('user_id,name,phone,active,created_at')
    .eq('biz_id', bizId)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ couriers: data ?? [] })
}

// POST /api/biz/couriers → crea (o reactiva) un repartidor con acceso al panel
// /courier. body: { biz_id, name, email, phone, password? }
// Si no se envía password, se genera una temporal y se devuelve una sola vez
// para que el dueño se la comparta al repartidor.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const bizId: string | undefined = body.biz_id
  const name: string = (body.name ?? '').trim()
  const email: string = (body.email ?? '').trim().toLowerCase()
  const phone: string | null = (body.phone ?? '').trim() || null
  if (!bizId || !email) return NextResponse.json({ error: 'biz_id y email requeridos' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const password: string = (body.password ?? '').trim() || ('Reva-' + Math.random().toString(36).slice(2, 8))
  const generated = !(body.password ?? '').trim()

  // ¿Ya existe una cuenta con ese correo? Buscamos por la tabla de perfiles /
  // couriers; si no, la creamos.
  let courierUserId: string | null = null
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name || email, role: 'courier' },
  })
  if (created?.user) {
    courierUserId = created.user.id
  } else if (createErr) {
    // El correo ya existe: lo reutilizamos como repartidor (no cambiamos su clave).
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = list?.users.find(u => (u.email ?? '').toLowerCase() === email)
    if (!existing) return NextResponse.json({ error: 'No se pudo crear el repartidor' }, { status: 500 })
    courierUserId = existing.id
  }
  if (!courierUserId) return NextResponse.json({ error: 'No se pudo crear el repartidor' }, { status: 500 })

  const { error: upsertErr } = await admin
    .from('couriers')
    .upsert({ user_id: courierUserId, biz_id: bizId, name: name || null, phone, active: true }, { onConflict: 'user_id' })
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    courier: { user_id: courierUserId, name: name || null, phone, active: true },
    // Sólo se devuelve cuando Reva generó la clave (cuenta nueva).
    temp_password: created?.user && generated ? password : undefined,
  })
}

// DELETE /api/biz/couriers?biz_id=...&user_id=... → desactiva un repartidor.
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const bizId = req.nextUrl.searchParams.get('biz_id')
  const courierId = req.nextUrl.searchParams.get('user_id')
  if (!bizId || !courierId) return NextResponse.json({ error: 'biz_id y user_id requeridos' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin.from('couriers').update({ active: false }).eq('user_id', courierId).eq('biz_id', bizId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
