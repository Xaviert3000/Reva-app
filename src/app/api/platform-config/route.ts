import { loadPlatformConfig, savePlatformConfig, type PlatformConfig } from '@/lib/platform-config'
import { requireAdmin, canWrite } from '@/lib/admin-auth'

// Config de IA de la plataforma para el panel del super admin.
// GET  → config actual (modelo, respaldos, prompts, toggles).
// POST → guarda un patch parcial (solo admin, Fase 9).

export const dynamic = 'force-dynamic'

export async function GET() {
  const cfg = await loadPlatformConfig(true)
  return Response.json(cfg)
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return Response.json({ error: 'No autorizado' }, { status: 403 })
  if (!canWrite(admin.role, 'platform')) return Response.json({ error: 'No tienes permiso para esta acción.' }, { status: 403 })
  try {
    const patch = (await req.json()) as Partial<PlatformConfig>
    const cfg = await savePlatformConfig(patch)
    return Response.json(cfg)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
