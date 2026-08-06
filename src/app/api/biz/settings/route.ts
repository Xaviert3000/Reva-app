import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Persiste ajustes del negocio (Fase 8): config del Agente IA, IVA y datos
// fiscales. La sesión identifica al dueño; se verifica la membresía y se escribe
// con el admin client.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const bizId: string | undefined = body.biz_id
  if (!bizId) return NextResponse.json({ error: 'biz_id requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('biz_members').select('biz_id').eq('user_id', user.id).eq('biz_id', bizId).maybeSingle()
  if (!membership) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const patch: Record<string, unknown> = {}
  // Perfil del negocio: nombre, descripción y logo/foto. El nombre alimenta tanto
  // `name` (Discover) como `full_name` (panel) para que se vean iguales.
  if (typeof body.name === 'string' && body.name.trim()) {
    patch.name = body.name.trim()
    patch.full_name = body.name.trim()
  }
  if (typeof body.description === 'string') patch.description = body.description.trim() || null
  if (typeof body.logo_url === 'string') patch.logo_url = body.logo_url.trim() || null
  // Horarios y capacidad. `hours` es "HH:MM – HH:MM"; define cuándo el negocio
  // acepta reservas Y pedidos (business-data / orders/checkout lo respetan).
  if (typeof body.hours === 'string' && body.hours.trim()) patch.hours = body.hours.trim()
  if (body.capacity !== undefined) { const n = Math.floor(Number(body.capacity)); if (Number.isFinite(n) && n >= 0) patch.capacity = n }
  if (body.agent_config !== undefined) patch.agent_config = body.agent_config
  if (typeof body.tax_mode === 'string') patch.tax_mode = body.tax_mode
  if (typeof body.rfc === 'string') patch.rfc = body.rfc
  if (typeof body.address === 'string') patch.address = body.address
  if (typeof body.phone === 'string') patch.phone = body.phone
  // Municipio de operación: define en qué ciudad encuentran los clientes al
  // negocio en Discover (business-data.ts filtra por .eq('municipio', ...)).
  // Se limpia (trim) para que coincida exacto con el catálogo del cliente.
  if (typeof body.municipio === 'string') patch.municipio = body.municipio.trim() || null
  // Estado (entidad federativa) donde opera el negocio. Acompaña al municipio.
  if (typeof body.estado === 'string') patch.estado = body.estado.trim() || null
  // Capacidades de reservas / pedidos (ecommerce) y sus formas de entrega.
  if (typeof body.does_reservations === 'boolean') patch.does_reservations = body.does_reservations
  if (typeof body.does_orders === 'boolean') patch.does_orders = body.does_orders
  if (typeof body.pickup_enabled === 'boolean') patch.pickup_enabled = body.pickup_enabled
  if (typeof body.delivery_enabled === 'boolean') patch.delivery_enabled = body.delivery_enabled
  if (body.delivery_fee !== undefined) { const n = Number(body.delivery_fee); if (Number.isFinite(n) && n >= 0) patch.delivery_fee = n }
  // PIN de salida del Autoservicio (kiosk). Se guarda a nivel negocio para que el
  // dueño lo pueda cambiar/recuperar desde cualquier terminal. Sólo dígitos (4–6);
  // vacío/null lo desactiva (la salida vuelve a la confirmación simple).
  if (body.kiosk_exit_pin !== undefined) {
    const pin = String(body.kiosk_exit_pin ?? '').replace(/\D/g, '').slice(0, 6)
    patch.kiosk_exit_pin = pin.length >= 4 ? pin : null
  }
  // PIN de autorización para anular/reembolsar en Ventas. Sólo dígitos (4–6);
  // vacío/null lo desactiva (las acciones vuelven a la confirmación simple).
  if (body.void_auth_pin !== undefined) {
    const pin = String(body.void_auth_pin ?? '').replace(/\D/g, '').slice(0, 6)
    patch.void_auth_pin = pin.length >= 4 ? pin : null
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

  const { error } = await admin.from('businesses').update(patch).eq('id', bizId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
