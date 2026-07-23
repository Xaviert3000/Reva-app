import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Persists the onboarding wizard for the logged-in owner: writes the business
// profile fields + services and flips `onboarded` so the wizard only shows once.
// Auth comes from the user's session cookie; the actual writes use the admin
// client (service role) so we don't depend on businesses/services RLS.
export const dynamic = 'force-dynamic'

interface ServiceInput {
  name?: string
  desc?: string
  price?: string
  on?: boolean
}

// "$2,400" / "2400 MXN" → 2400 ; empty / non-numeric → null
function parsePrice(raw?: string): number | null {
  if (!raw) return null
  const n = Number(String(raw).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const bizId: string | undefined = body.bizId
    const name: string = (body.name ?? '').trim()
    const type: string | null = body.type ?? null
    const kind: string | null = body.kind ?? null
    // Municipio de operación: define dónde aparece el negocio en Discover
    // (business-data.ts filtra por .eq('municipio', ...)). Se limpia (trim).
    const municipio: string | null = typeof body.municipio === 'string' && body.municipio.trim() ? body.municipio.trim() : null
    const hours: string | null = body.hours ?? null
    const agentActive: boolean = body.agentActive !== false
    const services: ServiceInput[] = Array.isArray(body.services) ? body.services : []

    const admin = createAdminClient()

    // Resolve the owner's business: use the posted id (verifying ownership) or
    // fall back to their first membership.
    let targetBizId = bizId
    if (targetBizId) {
      const { data: membership } = await admin
        .from('biz_members')
        .select('biz_id')
        .eq('user_id', user.id)
        .eq('biz_id', targetBizId)
        .maybeSingle()
      if (!membership) return NextResponse.json({ error: 'No autorizado para este negocio' }, { status: 403 })
    } else {
      const { data: firstMember } = await admin
        .from('biz_members')
        .select('biz_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      targetBizId = firstMember?.biz_id
    }

    // Owner registered before the business-on-signup migration (or the trigger
    // didn't run): create the business + membership now so onboarding can finish.
    if (!targetBizId) {
      const newId = 'biz_' + Math.random().toString(36).slice(2, 14)
      const { error: createErr } = await admin.from('businesses').insert({
        id: newId,
        name: name || 'Mi negocio',
        full_name: name || 'Mi negocio',
        type,
        kind,
        mono: (name || 'R').charAt(0).toUpperCase(),
        agent_active: false,
        onboarded: false,
      })
      if (createErr) {
        console.error('onboard: business create error', createErr)
        return NextResponse.json({ error: 'No se pudo crear el negocio' }, { status: 500 })
      }
      await admin.from('biz_members').insert({ biz_id: newId, user_id: user.id, role: 'owner' })
      targetBizId = newId
    }

    // Update the business profile.
    const bizPatch: Record<string, unknown> = {
      agent_active: agentActive,
      onboarded: true,
    }
    if (name) { bizPatch.name = name; bizPatch.full_name = name; bizPatch.mono = name.charAt(0).toUpperCase() }
    if (type) bizPatch.type = type
    if (kind) bizPatch.kind = kind
    if (municipio) bizPatch.municipio = municipio
    if (hours) bizPatch.hours = hours
    // Modo de negocio (reservas / pedidos) y formas de entrega, del asistente.
    if (typeof body.does_reservations === 'boolean') bizPatch.does_reservations = body.does_reservations
    if (typeof body.does_orders === 'boolean') bizPatch.does_orders = body.does_orders
    if (typeof body.pickup_enabled === 'boolean') bizPatch.pickup_enabled = body.pickup_enabled
    if (typeof body.delivery_enabled === 'boolean') bizPatch.delivery_enabled = body.delivery_enabled
    if (body.delivery_fee !== undefined) { const n = Number(body.delivery_fee); if (Number.isFinite(n) && n >= 0) bizPatch.delivery_fee = n }

    const { error: updErr } = await admin.from('businesses').update(bizPatch).eq('id', targetBizId)
    if (updErr) {
      console.error('onboard: business update error', updErr)
      return NextResponse.json({ error: 'No se pudo guardar el negocio' }, { status: 500 })
    }

    // Replace the service list with the enabled ones from the wizard.
    const rows = services
      .filter(s => s.on !== false && (s.name ?? '').trim())
      .map(s => ({
        biz_id: targetBizId,
        name: (s.name ?? '').trim(),
        description: (s.desc ?? '').trim() || null,
        price: parsePrice(s.price),
        // Texto libre del precio para mostrarlo tal cual (ej. "Desde $200").
        price_label: (s.price ?? '').trim() || null,
        active: true,
      }))

    await admin.from('services').delete().eq('biz_id', targetBizId)
    if (rows.length > 0) {
      const { error: svcErr } = await admin.from('services').insert(rows)
      if (svcErr) console.error('onboard: services insert error', svcErr)
    }

    // Encola una submission de moderación para el negocio nuevo (una sola vez).
    const { data: existingMod } = await admin.from('moderation_queue').select('id').eq('biz_id', targetBizId).eq('tipo', 'Negocio').maybeSingle()
    if (!existingMod) {
      const { data: bizRow } = await admin.from('businesses').select('name,mono,grad_from,grad_to').eq('id', targetBizId).single()
      await admin.from('moderation_queue').insert({
        biz_id: targetBizId,
        biz_name: bizRow?.name ?? name ?? 'Negocio',
        mono: bizRow?.mono ?? (name || 'R').charAt(0).toUpperCase(),
        grad_from: bizRow?.grad_from ?? null,
        grad_to: bizRow?.grad_to ?? null,
        tipo: 'Negocio',
        nivel: 'Destacado',
        que: 'Todo el negocio',
        status: 'pending',
      }).then(({ error }) => { if (error) console.error('onboard: moderation insert error', error) })
    }

    return NextResponse.json({ ok: true, bizId: targetBizId })
  } catch (err) {
    console.error('onboard error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
