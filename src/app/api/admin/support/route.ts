import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireWriter } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Tickets de soporte reales para el super-admin.
//  GET   → lista completa (enriquecida con perfil + total de reservas del usuario).
//  PATCH → { id, status }         cambia el estado.
//  POST  → { id, txt }            agrega respuesta del agente al hilo.

type ThreadMsg = { from: 'user' | 'agent'; txt: string; time: string }
type TicketRow = {
  id: string; code: string; user_id: string | null; user_name: string | null
  email: string | null; phone: string | null; city: string | null; mode: string | null
  lang: string | null; issue: string; status: string; thread: ThreadMsg[]; created_at: string
}

function ago(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  if (min < 1440) return `hace ${Math.floor(min / 60)} h`
  return `hace ${Math.floor(min / 1440)} d`
}
const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const db = createAdminClient()

  const { data, error } = await db
    .from('support_tickets')
    .select('id,code,user_id,user_name,email,phone,city,mode,lang,issue,status,thread,created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (data ?? []) as unknown as TicketRow[]

  // Enriquecimiento: perfil (alta) + total de reservas del usuario.
  const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))] as string[]
  const memberSince: Record<string, string> = {}
  const reservasTotal: Record<string, number> = {}
  if (userIds.length > 0) {
    const { data: profs } = await db.from('profiles').select('id,created_at,lang').in('id', userIds)
    for (const p of profs ?? []) memberSince[p.id as string] = p.created_at ? monthLabel(p.created_at as string) : ''
    const { data: resv } = await db.from('reservations').select('user_id').in('user_id', userIds).limit(5000)
    for (const r of resv ?? []) if (r.user_id) reservasTotal[r.user_id as string] = (reservasTotal[r.user_id as string] ?? 0) + 1
  }

  const tickets = rows.map(r => {
    const prev = rows
      .filter(o => o.user_id && o.user_id === r.user_id && o.id !== r.id)
      .map(o => ({ id: o.code, issue: o.issue, status: o.status === 'resuelto' ? 'Resuelto' : o.status === 'en_progreso' ? 'En progreso' : 'Nuevo', date: monthLabel(o.created_at) }))
    return {
      id: r.code,
      user: r.user_name || 'Cliente',
      city: r.city || '—',
      mode: r.mode === 'vecino' ? 'Vecino' : 'Explorer',
      issue: r.issue,
      time: ago(r.created_at),
      status: (r.status === 'en_progreso' || r.status === 'resuelto') ? r.status : 'nuevo',
      thread: Array.isArray(r.thread) ? r.thread : [],
      email: r.email || '',
      phone: r.phone || undefined,
      memberSince: (r.user_id && memberSince[r.user_id]) || '—',
      reservasTotal: (r.user_id && reservasTotal[r.user_id]) || 0,
      lang: r.lang === 'en' ? 'English' : r.lang === 'es' ? 'Español' : (r.lang || '—'),
      prevTickets: prev,
    }
  })

  return NextResponse.json({ tickets })
}

export async function PATCH(req: NextRequest) {
  const g = await requireWriter('support'); if (g.error) return g.error
  const { id, status } = await req.json()
  if (!id || !['nuevo', 'en_progreso', 'resuelto'].includes(status)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }
  const db = createAdminClient()
  const { error } = await db.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('code', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const g = await requireWriter('support'); if (g.error) return g.error
  const { id, txt } = await req.json()
  if (!id || !txt?.trim()) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  const db = createAdminClient()

  const { data: row, error: readErr } = await db.from('support_tickets').select('thread').eq('code', id).single()
  if (readErr || !row) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
  const thread: ThreadMsg[] = Array.isArray(row.thread) ? row.thread : []
  const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  thread.push({ from: 'agent', txt: String(txt).trim(), time })

  const { error } = await db
    .from('support_tickets')
    .update({ thread, status: 'en_progreso', updated_at: new Date().toISOString() })
    .eq('code', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
