import { createClient } from '@supabase/supabase-js'

// Cliente con la service role key para contextos sin sesión de usuario
// (webhooks de Stripe, flujos server-to-server). Salta RLS — NUNCA exponer
// al navegador. Sólo importar desde route handlers / código de servidor.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
