import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Flujo de aceptación de invitación al equipo Reva. El token del correo ES la
// prueba de identidad, por eso estas rutas NO requieren sesión previa.
//   GET  ?token=              → valida el token y devuelve { email, role } para
//                               pintar la pantalla de activación.
//   POST { token, password }  → crea (o re-activa) la cuenta del operador y marca
//                               la fila como 'activo'. A partir de aquí puede
//                               entrar por /admin con su correo + contraseña.

type Row = { id: string; email: string; role: string; status: string; expires_at: string | null }

const uiRole = (r: string) => (r === 'analista' ? 'Analista' : 'Operador')
const isExpired = (row: Row) => !!row.expires_at && new Date(row.expires_at).getTime() < Date.now()

async function findByToken(db: ReturnType<typeof createAdminClient>, token: string): Promise<Row | null> {
  const { data } = await db.from('admin_team').select('id,email,role,status,expires_at').eq('token', token).maybeSingle()
  return (data as Row | null) ?? null
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  if (!token) return NextResponse.json({ error: 'Falta el token de invitación.' }, { status: 400 })
  const db = createAdminClient()
  const row = await findByToken(db, token)
  if (!row) return NextResponse.json({ error: 'Invitación no encontrada.' }, { status: 404 })
  if (row.status === 'activo') return NextResponse.json({ error: 'Esta invitación ya fue aceptada. Entra con tu correo y contraseña.', accepted: true }, { status: 409 })
  if (isExpired(row)) return NextResponse.json({ error: 'La invitación expiró. Pide una nueva al super admin.' }, { status: 410 })
  return NextResponse.json({ email: row.email, role: uiRole(row.role) })
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

  // Crea la cuenta con el correo ya confirmado (la invitación por correo es la
  // prueba). Si el operador ya tenía una cuenta Reva, actualiza su contraseña.
  const { error: createErr } = await db.auth.admin.createUser({
    email: row.email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin_team', team_role: row.role },
  })
  if (createErr) {
    const alreadyExists = /already|registered|exists/i.test(createErr.message)
    if (!alreadyExists) {
      console.error('accept createUser error:', createErr)
      return NextResponse.json({ error: 'No se pudo crear la cuenta.' }, { status: 500 })
    }
    const { data: list } = await db.auth.admin.listUsers()
    const existing = list?.users.find(u => u.email?.toLowerCase() === row.email.toLowerCase())
    if (existing) await db.auth.admin.updateUserById(existing.id, { password })
  }

  const { error: upErr } = await db.from('admin_team')
    .update({ status: 'activo', name: row.email.split('@')[0] })
    .eq('id', row.id)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, email: row.email })
}
