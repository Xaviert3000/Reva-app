import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireWriter } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Categorías de negocio del super admin (/admin → Ajustes → Categorías de
// negocio). Persisten en la tabla `business_categories`.
//   GET    → lista ordenada de categorías.
//   POST   → crea una categoría { label, emoji }. Solo super admin.
//   DELETE → elimina una categoría por `label` (?label=...). Solo super admin.

export type BizCategory = { label: string; emoji: string }

type Row = { label: string; emoji: string }

function serialize(rows: Row[] | null | undefined): BizCategory[] {
  return (rows ?? []).map(r => ({ label: r.label, emoji: r.emoji }))
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const db = createAdminClient()
  const { data, error } = await db
    .from('business_categories')
    .select('label, emoji')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categories: serialize(data) })
}

export async function POST(req: NextRequest) {
  const g = await requireWriter('platform')
  if (g.error) return g.error

  const body = await req.json().catch(() => ({})) as { label?: unknown; emoji?: unknown }
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const emoji = (typeof body.emoji === 'string' ? body.emoji.trim() : '') || '🏷️'
  if (!label) return NextResponse.json({ error: 'Ingresa el nombre de la categoría.' }, { status: 400 })

  const db = createAdminClient()

  // Rechaza duplicados (case-insensitive) con un mensaje claro.
  const { data: dupe } = await db
    .from('business_categories')
    .select('id')
    .ilike('label', label)
    .maybeSingle()
  if (dupe) return NextResponse.json({ error: 'Ya existe una categoría con ese nombre.' }, { status: 409 })

  // La nueva categoría va al final.
  const { data: last } = await db
    .from('business_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sort_order = (last?.sort_order ?? -1) + 1

  const { error } = await db.from('business_categories').insert({ label, emoji, sort_order })
  if (error) {
    // Colisión de índice único (carrera): trátala como duplicado.
    if (error.code === '23505') return NextResponse.json({ error: 'Ya existe una categoría con ese nombre.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ category: { label, emoji } })
}

export async function DELETE(req: NextRequest) {
  const g = await requireWriter('platform')
  if (g.error) return g.error

  const label = req.nextUrl.searchParams.get('label')?.trim()
  if (!label) return NextResponse.json({ error: 'Falta la categoría a eliminar.' }, { status: 400 })

  const db = createAdminClient()
  const { error } = await db.from('business_categories').delete().ilike('label', label)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
