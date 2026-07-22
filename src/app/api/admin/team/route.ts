import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Equipo Reva (operadores / analistas) del super-admin. Antes la lista vivía
// solo en el estado de la UI (demo, se perdía al recargar). Ahora se persiste
// en `admin_team`.
//   GET    → lista de miembros (operador/analista). El Super Admin se pinta
//            desde la sesión en el cliente, no se guarda aquí.
//   POST   → { email, role }   invita: inserta fila 'invitado' + envía correo.
//   DELETE → { email }         elimina al miembro.

type UiRole = 'Operador' | 'Analista'
const toUiRole = (r: string): UiRole => (r === 'analista' ? 'Analista' : 'Operador')
const toDbRole = (r: string): 'operador' | 'analista' => (r === 'Analista' ? 'analista' : 'operador')

type MemberRow = { id: string; email: string; name: string | null; role: string; status: string }
const toMember = (m: MemberRow) => ({
  id: m.id,
  email: m.email,
  name: m.name || '',
  role: toUiRole(m.role),
  status: m.status === 'activo' ? 'activo' : 'invitado',
})

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const db = createAdminClient()
  const { data, error } = await db
    .from('admin_team')
    .select('id,email,name,role,status')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members: (data ?? []).map(m => toMember(m as MemberRow)) })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  // Solo el super admin gestiona el equipo (evita escalada de privilegios).
  if (admin.role !== 'super_admin') return NextResponse.json({ error: 'Solo el super admin puede invitar miembros.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Ingresa un correo válido.' }, { status: 400 })
  const role = toDbRole(String(body.role ?? 'Operador'))
  const db = createAdminClient()

  // ¿Ya existe una fila para este correo?
  const { data: existing } = await db.from('admin_team').select('id,status').eq('email', email).maybeSingle()
  if (existing?.status === 'activo') return NextResponse.json({ error: 'Este correo ya tiene acceso activo.' }, { status: 409 })

  let token: string
  if (existing) {
    // Reenvío: renueva la expiración y reutiliza el token existente.
    const { data: up, error } = await db.from('admin_team')
      .update({ role, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      .eq('id', existing.id).select('token').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    token = up.token as string
  } else {
    const { data: ins, error } = await db.from('admin_team')
      .insert({ email, role, invited_by: admin.email })
      .select('token').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    token = ins.token as string
  }

  // Correo de invitación (best-effort: la fila ya quedó guardada aunque el
  // correo falle, para que no se pierda la invitación).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reva-app-ten.vercel.app'
  const inviteUrl = `${appUrl}/admin?invite=${token}`
  let warning: string | undefined
  try {
    const { error: fnErr } = await db.functions.invoke('send-team-invite', {
      body: { email, role: toUiRole(role), inviteUrl, invitedBy: admin.email },
    })
    if (fnErr) {
      let detail: unknown = fnErr.message
      const ctx = (fnErr as { context?: Response }).context
      if (ctx && typeof ctx.text === 'function') {
        try { detail = await ctx.clone().json() } catch { detail = await ctx.text() }
      }
      console.error('Edge function error (send-team-invite):', detail)
      warning = 'La invitación se guardó, pero el correo no se pudo enviar.'
    }
  } catch (e) {
    console.error('send-team-invite invoke failed:', e)
    warning = 'La invitación se guardó, pero el correo no se pudo enviar.'
  }

  const { data: row } = await db.from('admin_team').select('id,email,name,role,status').eq('email', email).single()
  return NextResponse.json({ ok: true, warning, member: row ? toMember(row as MemberRow) : null })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (admin.role !== 'super_admin') return NextResponse.json({ error: 'Solo el super admin puede eliminar miembros.' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })
  const db = createAdminClient()
  const { error } = await db.from('admin_team').delete().eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
