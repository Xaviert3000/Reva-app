import { loadPlatformConfig, savePlatformConfig, type PlatformConfig } from '@/lib/platform-config'

// Config de IA de la plataforma para el panel del super admin.
// GET  → config actual (modelo, respaldos, prompts, toggles).
// POST → guarda un patch parcial.
//
// SEGURIDAD (pendiente para producción): este POST aún no está protegido por auth
// real de admin (el login del panel es demo, solo cliente). Antes de desplegar,
// protégelo con auth/rol de admin en Supabase. No cambia la arquitectura de config.

export async function GET() {
  const cfg = await loadPlatformConfig(true)
  return Response.json(cfg)
}

export async function POST(req: Request) {
  try {
    const patch = (await req.json()) as Partial<PlatformConfig>
    const cfg = await savePlatformConfig(patch)
    return Response.json(cfg)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
