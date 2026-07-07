import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// El panel /admin llama a esto al cargar para saber si el usuario es admin.
export async function GET() {
  const admin = await requireAdmin()
  return NextResponse.json({ admin: !!admin, email: admin?.email ?? null })
}
