import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_LABEL, normalizeRole, worksInBizPanel } from '@/lib/biz-roles'

export const dynamic = 'force-dynamic'

// Aceptación de invitación de empleado. El token del correo ES la prueba de
// identidad, por eso estas rutas NO requieren sesión previa.
//   GET  ?token=              → valida el token y devuelve { email, role, bizName }.
//   POST { token, password }  → crea/re-activa la cuenta y la fila en biz_members;
//                               marca la invitación 'activo'. Luego entra por /biz.

type Row = { id: string; biz_id: string; email: string; role: string; permissions: unknown; status: string; expires_at: string | null; courier_name: string | null; courier_phone: string | null }
const isExpired = (r: Row) => !!r.expires_at && new Date(r.expires_at).getTime() < Date.now()

async function findByToken(db: ReturnType<typeof createAdminClient>, token: string): Promise<Row | null> {
  const { data } = await db.from('biz_invites').select('id,biz_id,email,role,permissions,status,expires_at,courier_name,courier_phone').eq('token', token).maybeSingle()
  return (data as Row | null) ?? null
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  if (!token) return NextResponse.json({ error: 'Falta el token de invitación.' }, { status: 400 })
  const db = createAdminClient()
  const row = await findByToken(db, token)
  if (!row) return NextResponse.json({ error: 'Invitación no encontrada.' }, { status: 404 })
  if (row.status === 'activo') return NextResponse.json({ error: 'Esta invitación ya fue aceptada. Entra con tu correo y contraseña.', accepted: true }, { status: 409 })
  if (isExpired(row)) return NextResponse.json({ error: 'La invitación expiró. Pide una nueva al negocio.' }, { status: 410 })

  const role = normalizeRole(row.role)
  const { data: biz } = await db.from('businesses').select('name,full_name').eq('id', row.biz_id).maybeSingle()
  return NextResponse.json({ email: row.email, role, roleLabel: ROLE_LABEL[role], bizName: (biz?.full_name || biz?.name || '') as string })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token = String(body.token ?? '')
  const password = String(body.password ?? '')
  if (!token) return NextResponse.json({ error: 'Falta el token de invitación.' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })

  const db = createAdminClient()
  const row = await findByToken(db, token)
  if (!row) return NextResponse.json({ error: 'Invitación no encontrada.' }, { status: 404 })
  if (row.status === 'activo') return NextResponse.json({ error: 'Esta invitación ya fue aceptada.' }, { status: 409 })
  if (isExpired(row)) return NextResponse.json({ error: 'La invitación expiró.' }, { status: 410 })

  const role = normalizeRole(row.role)

  // Crea la cuenta con el correo ya confirmado (la invitación por correo es la
  // prueba). Si ya tenía cuenta Reva, actualiza su contraseña.
  let userId: string | null = null
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email: row.email, password, email_confirm: true,
    user_metadata: { role: 'biz_staff', biz_role: role },
  })
  if (createErr) {
    const alreadyExists = /already|registered|exists/i.test(createErr.message)
    if (!alreadyExists) { console.error('biz accept createUser error:', createErr); return NextResponse.json({ error: 'No se pudo crear la cuenta.' }, { status: 500 }) }
    const { data: list } = await db.auth.admin.listUsers()
    const existing = list?.users.find(u => u.email?.toLowerCase() === row.email.toLowerCase())
    if (existing) { userId = existing.id; await db.auth.admin.updateUserById(existing.id, { password }) }
  } else {
    userId = created.user?.id ?? null
  }
  if (!userId) return NextResponse.json({ error: 'No se pudo resolver la cuenta.' }, { status: 500 })

  // Crea (o actualiza) la membresía con el rol y permisos de la invitación.
  const { error: memErr } = await db.from('biz_members')
    .upsert({ biz_id: row.biz_id, user_id: userId, role, permissions: row.permissions ?? null }, { onConflict: 'biz_id,user_id' })
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })

  // El repartidor necesita una fila en `couriers` para aparecer en la asignación
  // de pedidos y ver sus entregas en /courier. Se crea/reactiva al aceptar, con
  // el nombre/teléfono capturados al invitarlo desde Empleados.
  if (role === 'repartidor') {
    const { error: courierErr } = await db.from('couriers')
      .upsert({ user_id: userId, biz_id: row.biz_id, name: row.courier_name, phone: row.courier_phone, active: true }, { onConflict: 'user_id' })
    if (courierErr) console.error('biz accept courier upsert error:', courierErr)
  }

  await db.from('biz_invites').update({ status: 'activo' }).eq('id', row.id)

  // El repartidor no entra al panel del negocio: el cliente lo manda a /courier.
  return NextResponse.json({ ok: true, email: row.email, role, bizPanel: worksInBizPanel(role) })
}
