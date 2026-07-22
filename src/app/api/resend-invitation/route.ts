import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireWriter } from '@/lib/admin-auth'

// Avoid running this route at build time — it needs runtime env vars.
export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const g = await requireWriter('businesses'); if (g.error) return g.error
    const supabase = getSupabase()
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    // Find the most recent still-pending invitation for this email — reuse its
    // token so we don't create a duplicate row on every resend.
    const { data: inv, error: dbErr } = await supabase
      .from('biz_invitations')
      .select('token, biz_name, plan')
      .eq('email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (dbErr) {
      console.error('DB lookup error:', dbErr)
      return NextResponse.json({ error: 'No se pudo consultar la invitación' }, { status: 500 })
    }
    if (!inv) {
      return NextResponse.json({ error: 'No hay una invitación pendiente para este correo' }, { status: 404 })
    }

    // Extend the expiry window so the re-sent link is valid for another 7 days.
    await supabase
      .from('biz_invitations')
      .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      .eq('token', inv.token)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reva-app-ten.vercel.app'
    const inviteUrl = `${appUrl}/biz/register?token=${inv.token}`

    const { error: fnErr } = await supabase.functions.invoke('send-biz-invite', {
      body: { email, bizName: inv.biz_name, token: inv.token, inviteUrl, plan: inv.plan },
    })

    if (fnErr) {
      // supabase-js wraps a non-2xx function response in a FunctionsHttpError whose
      // `context` is the raw Response — read it so the real reason shows up in logs.
      let detail: unknown = fnErr.message
      const ctx = (fnErr as { context?: Response }).context
      if (ctx && typeof ctx.text === 'function') {
        try { detail = await ctx.clone().json() } catch { detail = await ctx.text() }
      }
      console.error('Edge function error (resend send-biz-invite):', detail)
      return NextResponse.json({ ok: true, warning: 'Invitation email delivery failed', detail })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('resend-invitation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
