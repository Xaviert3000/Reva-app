import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeReferral } from '@/lib/rove-db'

export const dynamic = 'force-dynamic'

// Marca como completado el referido del usuario con sesión (acredita al referidor).
// Nota: la reserva ya llama a completeReferral() en el servidor; este endpoint
// queda como respaldo autenticado y no confía en un userId del cliente.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const result = await completeReferral(user.id)
  return NextResponse.json(result)
}
