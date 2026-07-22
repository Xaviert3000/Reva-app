import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireWriter } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Ajustes generales de la plataforma (nombre, URL, idioma, zona horaria,
// notificaciones y seguridad). Antes el botón "Guardar cambios" solo cerraba el
// modal; ahora se persiste en la fila singleton de `platform_settings`.
//   GET  → ajustes actuales (mezclados con los valores por defecto).
//   POST → guarda un patch parcial (merge sobre lo existente). Solo super admin.

export type PlatformSettings = {
  platName: string
  platUrl: string
  platLang: string
  platTz: string
  notifEmail: string
  notifs: {
    nuevaReserva: boolean
    nuevoDestacado: boolean
    nuevoNegocio: boolean
    reporteDiario: boolean
    soporteUrgente: boolean
  }
  twoFa: boolean
  sessExpiry: string
}

const DEFAULTS: PlatformSettings = {
  platName: 'Reva',
  platUrl: 'reva.mx',
  platLang: 'es',
  platTz: 'America/Mazatlan',
  notifEmail: 'admin@reva.mx',
  notifs: { nuevaReserva: true, nuevoDestacado: true, nuevoNegocio: false, reporteDiario: true, soporteUrgente: true },
  twoFa: false,
  sessExpiry: '7d',
}

// Mezcla defensiva: solo campos conocidos, con fallback a los valores por defecto.
function merge(stored: Partial<PlatformSettings> | null | undefined): PlatformSettings {
  const s = stored ?? {}
  return {
    platName: typeof s.platName === 'string' ? s.platName : DEFAULTS.platName,
    platUrl: typeof s.platUrl === 'string' ? s.platUrl : DEFAULTS.platUrl,
    platLang: typeof s.platLang === 'string' ? s.platLang : DEFAULTS.platLang,
    platTz: typeof s.platTz === 'string' ? s.platTz : DEFAULTS.platTz,
    notifEmail: typeof s.notifEmail === 'string' ? s.notifEmail : DEFAULTS.notifEmail,
    notifs: { ...DEFAULTS.notifs, ...(s.notifs ?? {}) },
    twoFa: typeof s.twoFa === 'boolean' ? s.twoFa : DEFAULTS.twoFa,
    sessExpiry: typeof s.sessExpiry === 'string' ? s.sessExpiry : DEFAULTS.sessExpiry,
  }
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const db = createAdminClient()
  const { data, error } = await db.from('platform_settings').select('data').eq('id', 1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: merge(data?.data as Partial<PlatformSettings> | undefined) })
}

export async function POST(req: NextRequest) {
  const g = await requireWriter('platform')
  if (g.error) return g.error

  const body = await req.json().catch(() => ({})) as Partial<PlatformSettings>
  const db = createAdminClient()

  // Merge sobre lo ya guardado para aceptar patches parciales.
  const { data: existing } = await db.from('platform_settings').select('data').eq('id', 1).maybeSingle()
  const next = merge({ ...(existing?.data as Partial<PlatformSettings> | undefined), ...body })

  const { error } = await db.from('platform_settings').upsert({
    id: 1,
    data: next,
    updated_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: next })
}
