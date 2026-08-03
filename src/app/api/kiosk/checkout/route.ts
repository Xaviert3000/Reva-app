import { NextRequest, NextResponse } from 'next/server'
import { getStripe, commissionAmount } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { usableGroups } from '@/lib/variants'

export const dynamic = 'force-dynamic'

// IVA. Mismo valor que usa el POS/Autoservicio en el cliente (TAX_RATE).
const TAX_RATE = 0.16

interface ItemInput { service_id: string; qty: number; options?: string[] }

async function ownerOf(bizId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from('biz_members').select('biz_id').eq('user_id', userId).eq('biz_id', bizId).maybeSingle()
  return !!data
}

// Abre un Checkout de Stripe Connect para una orden del Autoservicio (kiosko) y
// devuelve la URL para mostrarla como QR: el cliente la escanea y paga en SU
// teléfono. Cobra al cliente y transfiere al negocio (comisión 2% para Reva, igual
// que los pedidos). El kiosko sondea /api/kiosk/checkout/status y, al confirmarse
// el pago, registra la venta como hoy.
//
// Sólo un miembro del negocio (el dueño, cuyo kiosko corre en su sesión) puede
// crear la sesión. Los precios NO se confían al cliente: se recalculan desde la BD
// por service_id, y el IVA se aplica según el `tax_mode` del negocio para que el
// cargo coincida con el total que ve el cliente en pantalla.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const bizId: string | undefined = body.biz_id
  const items: ItemInput[] = Array.isArray(body.items) ? body.items : []
  const orderType: string | null = body.order_type === 'here' || body.order_type === 'togo' ? body.order_type : null
  const lang: string = body.lang === 'en' ? 'en' : 'es'
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })
  if (items.length === 0) return NextResponse.json({ error: 'Orden vacía' }, { status: 400 })
  if (!(await ownerOf(bizId, user.id))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()

  const { data: biz } = await admin
    .from('businesses')
    .select('id,name,tax_mode,stripe_account_id,stripe_charges_enabled')
    .eq('id', bizId)
    .single()

  if (!biz) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
  if (!biz.stripe_account_id || !biz.stripe_charges_enabled) {
    return NextResponse.json(
      { error: 'El negocio aún no conectó Stripe para recibir pagos con tarjeta.' },
      { status: 409 },
    )
  }

  // Precios reales desde la BD (por service_id) — nunca los del cliente.
  const ids = items.map(i => i.service_id).filter(Boolean)
  const { data: svcRows } = await admin
    .from('services')
    .select('id,name,price,variants')
    .in('id', ids)
    .eq('biz_id', bizId)

  const priced = items
    .map(i => {
      const svc = (svcRows ?? []).find(s => s.id === i.service_id)
      const qty = Math.max(1, Math.min(99, Math.floor(Number(i.qty) || 1)))
      const price = Number(svc?.price)
      if (!svc || !Number.isFinite(price) || price <= 0) return null
      // Variante: valida las opciones enviadas contra la BD y suma sus extras (el
      // extra NUNCA se confía al cliente). El nombre lleva la variante entre ().
      const groups = usableGroups(svc.variants)
      const picked: string[] = []
      let delta = 0
      if (groups.length > 0 && Array.isArray(i.options)) {
        groups.forEach((g, gi) => {
          const opt = g.options.find(o => o.name === i.options![gi])
          if (opt) { picked.push(opt.name); delta += opt.price_delta || 0 }
        })
      }
      const unit = price + delta
      const name = picked.length > 0 ? `${svc.name} (${picked.join(' · ')})` : (svc.name as string)
      return { service_id: svc.id as string, name, unit_price: unit, qty, line_total: unit * qty }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  if (priced.length === 0) {
    return NextResponse.json({ error: 'Ningún producto de la orden tiene precio válido' }, { status: 400 })
  }

  const subtotal = priced.reduce((s, p) => s + p.line_total, 0)
  // 'added' → el precio es SIN IVA y se suma al cobrar; 'included' → el precio ya
  // trae el IVA (no se agrega línea). Coincide con la matemática del kiosko.
  const added = biz.tax_mode === 'added'
  const taxAmount = added ? Math.round(subtotal * TAX_RATE * 100) / 100 : 0
  const total = subtotal + taxAmount

  const lineItems: Array<{ price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }> =
    priced.map(p => ({
      price_data: { currency: 'mxn', product_data: { name: p.name }, unit_amount: Math.round(p.unit_price * 100) },
      quantity: p.qty,
    }))
  if (taxAmount > 0) {
    lineItems.push({
      price_data: { currency: 'mxn', product_data: { name: 'IVA (16%)' }, unit_amount: Math.round(taxAmount * 100) },
      quantity: 1,
    })
  }

  const itemCount = priced.reduce((s, p) => s + p.qty, 0)
  // Stripe exige URLs absolutas para success/cancel. Si falta la env, fallar con
  // un mensaje claro en vez de mandar una URL relativa que Stripe rechaza.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  if (!/^https?:\/\//.test(appUrl)) {
    console.error('[kiosk/checkout] NEXT_PUBLIC_APP_URL no está configurada o no es absoluta:', JSON.stringify(appUrl))
    return NextResponse.json({ error: 'Configuración de pago incompleta (NEXT_PUBLIC_APP_URL).' }, { status: 500 })
  }

  // Crea el Checkout de Stripe. Si Stripe rechaza (cuenta Connect sin capacidad de
  // cobros/transferencias, clave inválida, etc.) se devuelve el mensaje real para
  // que el kiosko lo muestre en vez de un genérico opaco.
  let session: Awaited<ReturnType<ReturnType<typeof getStripe>['checkout']['sessions']['create']>>
  try {
    session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      payment_intent_data: {
        application_fee_amount: commissionAmount(total), // 2% para Reva
        transfer_data: { destination: biz.stripe_account_id },
      },
      metadata: {
        type: 'kiosk',
        biz_id: bizId,
      },
      success_url: `${appUrl}/pay/done?status=ok`,
      cancel_url: `${appUrl}/pay/done?status=cancel`,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de Stripe'
    console.error('[kiosk/checkout] Stripe rechazó la sesión:', msg)
    return NextResponse.json({ error: `No se pudo iniciar el pago con Stripe: ${msg}` }, { status: 502 })
  }

  // Fila de staging: guarda la orden para poder registrar la venta cuando Stripe
  // confirme el pago (vía sondeo o webhook), sin depender del navegador del kiosko.
  // El folio (número de orden que ve el cliente) se genera aquí, en el servidor.
  const folio = String(Date.now()).slice(-4)
  const subtotalTaxed = added ? total - taxAmount : total // = subtotal
  const { error: stageErr } = await admin.from('kiosk_checkouts').insert({
    stripe_session_id: session.id,
    biz_id: bizId,
    items: priced.map(p => ({ service_id: p.service_id, name: p.name, unit_price: p.unit_price, qty: p.qty })),
    subtotal: subtotalTaxed,
    tax_amount: taxAmount,
    tax_rate: added ? TAX_RATE : 0,
    total,
    item_count: itemCount,
    order_type: orderType,
    folio,
    lang,
  })
  if (stageErr) {
    // El mensaje real (p. ej. "relation kiosk_checkouts does not exist" cuando la
    // migración 038 no está aplicada) sube al kiosko para diagnóstico.
    console.error('[kiosk/checkout] no se pudo crear el staging:', stageErr.message)
    return NextResponse.json({ error: `No se pudo registrar el pago: ${stageErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ url: session.url, id: session.id, total, folio })
}
