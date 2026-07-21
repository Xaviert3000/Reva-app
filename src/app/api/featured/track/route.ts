import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const KINDS = ['impression', 'click'] as const
type Kind = (typeof KINDS)[number]

// Registra un evento real del espacio "Destacado" (lo consume Informes → Destacado).
// El app cliente llama aquí al mostrar un negocio destacado (impression) y al abrir
// su ficha (click). Se escribe con service-role: los invitados sin sesión también
// cuentan, y así evitamos que un cliente pueda inflar métricas vía RLS.
export async function POST(req: NextRequest) {
  let body: { biz_id?: string; kind?: string; surface?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const bizId = (body.biz_id ?? '').trim()
  const kind = body.kind as Kind
  if (!bizId || !KINDS.includes(kind)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  // user_id opcional: si hay sesión lo guardamos, si no, evento anónimo.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await createAdminClient().from('featured_events').insert({
    biz_id: bizId,
    kind,
    user_id: user?.id ?? null,
    surface: typeof body.surface === 'string' ? body.surface.slice(0, 20) : null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
