import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireBizManager } from '@/lib/biz-auth'
import { ASSIGNABLE_ROLES, BizRole, ROLE_LABEL, normalizeRole, ALL_MODULE_IDS } from '@/lib/biz-roles'

export const dynamic = 'force-dynamic'

// Equipo del negocio (empleados). Solo dueño/admin puede gestionarlo.
//   GET    ?biz_id=            → miembros activos + invitaciones pendientes.
//   POST   { biz_id, email, role, permissions? } → invita (fila + correo).
//   PATCH  { biz_id, member_id?|invite_id?, role?, permissions? } → edita rol/permisos.
//   DELETE { biz_id, member_id?|invite_id? }      → quita al empleado o cancela invitación.

// Sanea la lista de submódulos permitidos (solo ids válidos y únicos).
function cleanModules(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  const ids = raw.filter(x => typeof x === 'string' && ALL_MODULE_IDS.includes(x))
  return Array.from(new Set(ids))
}

// Rol asignable válido (owner nunca es asignable por la API).
function cleanRole(raw: unknown): BizRole | null {
  const r = normalizeRole(typeof raw === 'string' ? raw : '')
  return ASSIGNABLE_ROLES.includes(r) ? r : null
}

export async function GET(req: NextRequest) {
  const bizId = req.nextUrl.searchParams.get('biz_id')
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  if (!(await requireBizManager(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()
  const { data: memberRows } = await db.from('biz_members').select('id,user_id,role,permissions').eq('biz_id', bizId)
  const { data: inviteRows } = await db.from('biz_invites').select('id,email,role,permissions,status,courier_name,courier_phone,created_at').eq('biz_id', bizId).eq('status', 'invitado')

  // Datos de contacto de los repartidores (nombre/teléfono capturados al invitar).
  const { data: courierRows } = await db.from('couriers').select('user_id,name,phone,created_at').eq('biz_id', bizId)
  const courierById = new Map<string, { name: string | null; phone: string | null; created_at: string | null }>(
    (courierRows ?? []).map(c => [c.user_id as string, { name: (c.name as string) ?? null, phone: (c.phone as string) ?? null, created_at: (c.created_at as string) ?? null }])
  )

  // Miembros activos: biz_members guarda user_id, así que resolvemos correo,
  // nombre, teléfono y fecha de alta desde auth (metadata) y couriers.
  const { data: userList } = await db.auth.admin.listUsers()
  const userById = new Map((userList?.users ?? []).map(u => [u.id, u] as const))

  const members = (memberRows ?? []).map(m => {
    const role = normalizeRole(m.role as string)
    const uid = m.user_id as string
    const u = userById.get(uid)
    const meta = (u?.user_metadata ?? {}) as Record<string, unknown>
    const courier = courierById.get(uid)
    // Nombre/teléfono: primero el registro de repartidor (más explícito), luego el
    // metadata de la cuenta (nombre puesto al registrarse el cliente/empleado).
    const name = (courier?.name || (meta.full_name as string) || (meta.name as string) || '') || null
    const phone = (courier?.phone || (meta.phone as string) || '') || null
    return {
      id: m.id as string,
      kind: 'member' as const,
      email: u?.email ?? '',
      name,
      phone,
      joinedAt: courier?.created_at || u?.created_at || null,
      role,
      roleLabel: ROLE_LABEL[role],
      permissions: (m.permissions as { modules: string[] } | null) ?? null,
      status: 'activo' as const,
      isOwner: role === 'owner',
    }
  })
  const invites = (inviteRows ?? []).map(i => {
    const role = normalizeRole(i.role as string)
    return {
      id: i.id as string,
      kind: 'invite' as const,
      email: i.email as string,
      name: (i.courier_name as string) || null,
      phone: (i.courier_phone as string) || null,
      joinedAt: (i.created_at as string) ?? null, // fecha en que se envió la invitación
      role,
      roleLabel: ROLE_LABEL[role],
      permissions: (i.permissions as { modules: string[] } | null) ?? null,
      status: 'invitado' as const,
      isOwner: false,
    }
  })

  return NextResponse.json({ team: [...members, ...invites] })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const bizId = String(body.biz_id ?? '')
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  const manager = await requireBizManager(bizId)
  if (!manager) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const email = String(body.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Ingresa un correo válido.' }, { status: 400 })
  const role = cleanRole(body.role)
  if (!role) return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 })
  const permissions = cleanModules(body.permissions)

  // Datos del repartidor (nombre/teléfono): se guardan en la invitación y se
  // copian a `couriers` cuando acepta, para que el flujo de entregas funcione.
  // `hasCourierFields` distingue una invitación nueva (trae los campos) de un
  // reenvío desde la fila (no los trae) para no borrar lo ya guardado.
  const hasCourierFields = body.name !== undefined || body.phone !== undefined
  const courierName = String(body.name ?? '').trim() || null
  const courierPhone = String(body.phone ?? '').trim() || null

  const db = createAdminClient()

  // ¿El correo ya es miembro activo de este negocio?
  const { data: userList } = await db.auth.admin.listUsers()
  const existingUser = (userList?.users ?? []).find(u => u.email?.toLowerCase() === email)
  if (existingUser) {
    const { data: already } = await db.from('biz_members').select('id').eq('biz_id', bizId).eq('user_id', existingUser.id).maybeSingle()
    if (already) return NextResponse.json({ error: 'Este correo ya tiene acceso activo.' }, { status: 409 })
  }

  // Inserta (o reenvía renovando) la invitación.
  const { data: existingInv } = await db.from('biz_invites').select('id,status').eq('biz_id', bizId).eq('email', email).maybeSingle()
  let token: string
  if (existingInv) {
    const patch: Record<string, unknown> = { role, permissions, status: 'invitado', expires_at: new Date(Date.now() + 7 * 864e5).toISOString() }
    // En reenvío (sin campos) preservamos el nombre/teléfono ya guardados.
    if (hasCourierFields) { patch.courier_name = courierName; patch.courier_phone = courierPhone }
    const { data: up, error } = await db.from('biz_invites')
      .update(patch)
      .eq('id', existingInv.id).select('token').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    token = up.token as string
  } else {
    const { data: ins, error } = await db.from('biz_invites')
      .insert({ biz_id: bizId, email, role, permissions, invited_by: manager.userId, courier_name: courierName, courier_phone: courierPhone })
      .select('token').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    token = ins.token as string
  }

  // Correo de invitación (best-effort: la fila ya quedó guardada aunque el correo
  // falle). Reusa la edge function `send-team-invite` (Resend). El repartidor,
  // aunque no entre al panel, recibe el mismo enlace para crear su acceso a /courier.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reva-app-ten.vercel.app'
  const inviteUrl = `${appUrl}/biz?invite=${token}`
  // Nombre del negocio para el correo ("<Negocio> te ha invitado…"); antes se
  // pasaba el UUID del dueño, que se veía en el correo.
  const { data: bizRow } = await db.from('businesses').select('full_name,name').eq('id', bizId).maybeSingle()
  const invitedByName = (bizRow?.full_name || bizRow?.name || undefined) as string | undefined
  let warning: string | undefined
  let mailErrorDetail: string | undefined
  try {
    const { error: fnErr } = await db.functions.invoke('send-team-invite', {
      body: { email, role: ROLE_LABEL[role].es, inviteUrl, invitedBy: invitedByName },
    })
    if (fnErr) {
      // Extrae el detalle real: si la función respondió non-2xx, `context` es la
      // Response con el cuerpo del error (ej. Resend rechazó, falta la API key).
      let detail = fnErr.message || fnErr.name
      const ctx = (fnErr as { context?: Response }).context
      if (ctx && typeof ctx.text === 'function') {
        try { const b = await ctx.text(); if (b) detail = b } catch { /* cuerpo no legible */ }
      }
      mailErrorDetail = detail
      console.error('[biz/team] send-team-invite invoke failed:', fnErr.name, '→', detail)
      warning = 'La invitación se guardó, pero el correo pudo no enviarse.'
    }
  } catch (e) {
    mailErrorDetail = e instanceof Error ? e.message : String(e)
    console.error('[biz/team] send-team-invite threw:', mailErrorDetail)
    warning = 'La invitación se guardó, pero el correo pudo no enviarse.'
  }

  return NextResponse.json({ ok: true, warning, mailErrorDetail })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const bizId = String(body.biz_id ?? '')
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  if (!(await requireBizManager(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const role = body.role !== undefined ? cleanRole(body.role) : undefined
  if (body.role !== undefined && !role) return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 })
  const permissions = body.permissions !== undefined ? cleanModules(body.permissions) : undefined

  const patch: Record<string, unknown> = {}
  if (role !== undefined) patch.role = role
  if (permissions !== undefined) patch.permissions = permissions
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

  const db = createAdminClient()
  if (body.member_id) {
    // No permitir editar al dueño (evita degradarlo por error).
    const { data: m } = await db.from('biz_members').select('role').eq('id', body.member_id).eq('biz_id', bizId).maybeSingle()
    if (!m) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    if (normalizeRole(m.role as string) === 'owner') return NextResponse.json({ error: 'No se puede cambiar al dueño.' }, { status: 403 })
    const { error } = await db.from('biz_members').update(patch).eq('id', body.member_id).eq('biz_id', bizId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (body.invite_id) {
    const { error } = await db.from('biz_invites').update(patch).eq('id', body.invite_id).eq('biz_id', bizId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'Falta member_id o invite_id.' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const bizId = String(body.biz_id ?? '')
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  if (!(await requireBizManager(bizId))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const db = createAdminClient()
  if (body.member_id) {
    const { data: m } = await db.from('biz_members').select('role,user_id').eq('id', body.member_id).eq('biz_id', bizId).maybeSingle()
    if (!m) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    if (normalizeRole(m.role as string) === 'owner') return NextResponse.json({ error: 'No se puede quitar al dueño.' }, { status: 403 })
    const { error } = await db.from('biz_members').delete().eq('id', body.member_id).eq('biz_id', bizId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Si era repartidor, desactiva su fila en `couriers` para que deje de recibir
    // entregas (no la borramos: los pedidos pasados referencian courier_id).
    if (normalizeRole(m.role as string) === 'repartidor' && m.user_id) {
      await db.from('couriers').update({ active: false }).eq('user_id', m.user_id as string).eq('biz_id', bizId)
    }
  } else if (body.invite_id) {
    const { error } = await db.from('biz_invites').delete().eq('id', body.invite_id).eq('biz_id', bizId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'Falta member_id o invite_id.' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
