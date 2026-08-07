// Motor de disponibilidad (autoritativo, server-side).
//
// Una reserva se agenda contra un RECURSO (dentista/sillón), no contra el
// servicio: todos los servicios comparten la línea de tiempo del recurso y la
// DURACIÓN los separa. Un horario está disponible si al menos un recurso
// calificado (de los que realizan el servicio) está libre toda la duración.
//
// La misma función alimenta el booking del cliente (web + nativo, vía
// /api/availability) y se re-valida al crear la reserva. El anti-conflicto duro
// vive además en el exclusion constraint de la BD (migración 056).

import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeWeekly, type WeeklyHours } from '@/lib/data'

export interface AvailabilitySlot {
  time: string // "HH:MM" hora local del negocio
  free: number // cuántos recursos calificados están libres a esa hora
  resourceId: string | null // un recurso libre sugerido (el primero), o null si ninguno
}

export interface DayAvailability {
  date: string // "YYYY-MM-DD"
  offered: boolean // el servicio se ofrece ese día Y el negocio abre Y hay recurso
  durationMin: number
  capacity: number // # de recursos calificados (máximo teórico por horario)
  slots: AvailabilitySlot[] // todos los inicios candidatos con su conteo de libres
}

// ── Helpers de tiempo ────────────────────────────────────────────────────────

function toMin(hhmm: string): number | null {
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/)
  return m ? +m[1] * 60 + +m[2] : null
}

function fmt(min: number): string {
  const hh = Math.floor(min / 60) % 24
  const mm = min % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

// Rango [inicio, fin) en minutos desde un "HH:MM – HH:MM". null si no parsea.
function parseRange(range: string | null | undefined): { start: number; end: number } | null {
  if (!range) return null
  const m = range.match(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/)
  if (!m) return null
  const start = +m[1] * 60 + +m[2]
  let end = +m[3] * 60 + +m[4]
  if (end <= start) end += 24 * 60 // cruza medianoche
  return { start, end }
}

// Intersección de rangos definidos. Si alguno es explícitamente "cerrado" (null
// pasado como closed=true) el resultado es null. Los undefined no restringen.
function intersect(...ranges: ({ start: number; end: number } | null)[]): { start: number; end: number } | null {
  let start = -Infinity
  let end = Infinity
  for (const r of ranges) {
    if (!r) continue
    start = Math.max(start, r.start)
    end = Math.min(end, r.end)
  }
  if (start === -Infinity || end === Infinity || end <= start) return null
  return { start, end }
}

// getDay (0=Dom … 6=Sáb) de un "YYYY-MM-DD" interpretado como fecha civil (UTC,
// sin corrimiento de tz — es una fecha, no un instante).
function dowOf(dateISO: string): number {
  const [y, mo, d] = dateISO.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay()
}

// El horario del día `dow` a partir de un horario semanal + rango legado.
// Devuelve { start, end } o null si cierra ese día. `closedIfWeekly`: cuando hay
// semanal y el día es null, cierra (no cae al legado).
function dayWindow(weekly: WeeklyHours | null, legacy: string | null | undefined, dow: number): { start: number; end: number } | null {
  if (weekly && weekly.length === 7) {
    const d = weekly[dow]
    if (!d) return null // cerrado ese día
    const s = toMin(d.open)
    const e = toMin(d.close)
    return s != null && e != null ? { start: s, end: e <= s ? e + 24 * 60 : e } : null
  }
  return parseRange(legacy)
}

// ── Tipos de fila ────────────────────────────────────────────────────────────

interface SvcRow { biz_id: string; duration_min: number | null; days: number[] | null; hours: string | null; scheduled: boolean | null }
interface BizRow { hours_json: unknown; hours: string | null }
interface ResRow { id: string; name: string; hours_json: unknown; sort_order: number | null }
interface RsvRow { resource_id: string | null; slot: string | null; duration_min: number | null }

// ── Núcleo ───────────────────────────────────────────────────────────────────

/** Disponibilidad de un servicio en una fecha ("YYYY-MM-DD"), agregada sobre los
 *  recursos que lo realizan. Devuelve todos los inicios candidatos con su conteo
 *  de recursos libres (free=0 ⇒ ocupado). */
export async function computeAvailability(
  bizId: string,
  serviceId: string,
  dateISO: string,
): Promise<DayAvailability> {
  const admin = createAdminClient()
  const empty = (durationMin: number, capacity = 0): DayAvailability => ({ date: dateISO, offered: false, durationMin, capacity, slots: [] })

  // 1) Servicio
  const { data: svc } = await admin
    .from('services')
    .select('biz_id,duration_min,days,hours,scheduled')
    .eq('id', serviceId)
    .maybeSingle<SvcRow>()
  if (!svc || svc.biz_id !== bizId) return empty(60)

  const durationMin = svc.duration_min && svc.duration_min > 0 ? svc.duration_min : 60
  // Servicios sin calendario (productos/cotizaciones) no tienen disponibilidad.
  if (svc.scheduled === false) return empty(durationMin)

  const dow = dowOf(dateISO)
  // ¿El servicio se ofrece ese día de la semana? (days: 0=Dom..6=Sáb; vacío/7=todos)
  const svcDays = svc.days ?? []
  if (svcDays.length > 0 && svcDays.length < 7 && !svcDays.includes(dow)) return empty(durationMin)

  // 2) Negocio (horario semanal / legado)
  const { data: biz } = await admin.from('businesses').select('hours_json,hours').eq('id', bizId).maybeSingle<BizRow>()
  const weekly = normalizeWeekly(biz?.hours_json)
  const bizWin = dayWindow(weekly, biz?.hours, dow)
  // Si el servicio trae su propio horario, ese acota (y puede abrir aunque el
  // rango legado no aplique); si no, se usa el del negocio.
  const svcWin = parseRange(svc.hours)
  // El negocio cerrado ese día sólo bloquea cuando el servicio NO tiene horario propio.
  if (!svcWin && !bizWin) return empty(durationMin)

  // 3) Recursos calificados (los que realizan el servicio, o todos los activos)
  const { data: mapRows } = await admin.from('service_resources').select('resource_id').eq('service_id', serviceId)
  const mappedIds = (mapRows ?? []).map(r => r.resource_id as string)
  let resQuery = admin.from('resources').select('id,name,hours_json,sort_order').eq('biz_id', bizId).eq('active', true)
  if (mappedIds.length > 0) resQuery = resQuery.in('id', mappedIds)
  const { data: resources } = await resQuery.order('sort_order', { ascending: true })
  const resList = (resources ?? []) as ResRow[]
  if (resList.length === 0) return empty(durationMin)

  // 4) Reservas existentes de esos recursos ese día (bloquean por solapamiento).
  //    slot es timestamptz; el path de reserva lo guarda como reloj-de-pared UTC,
  //    así que extraemos hora/fecha en UTC para casar con los candidatos locales.
  const dayStart = `${dateISO}T00:00:00Z`
  const [y, mo, d] = dateISO.split('-').map(Number)
  const nextUTC = new Date(Date.UTC(y, mo - 1, d + 1)).toISOString().slice(0, 10)
  const dayEnd = `${nextUTC}T00:00:00Z`
  const resIds = resList.map(r => r.id)
  const { data: rsvs } = await admin
    .from('reservations')
    .select('resource_id,slot,duration_min')
    .eq('biz_id', bizId)
    .in('resource_id', resIds)
    .not('slot', 'is', null)
    .not('status', 'in', '(cancelled,no_show)')
    .gte('slot', dayStart)
    .lt('slot', dayEnd)
  // Intervalos ocupados por recurso, en minutos del día (UTC = reloj de pared).
  const busy = new Map<string, { s: number; e: number }[]>()
  for (const r of (rsvs ?? []) as RsvRow[]) {
    if (!r.resource_id || !r.slot) continue
    const dt = new Date(r.slot)
    const s = dt.getUTCHours() * 60 + dt.getUTCMinutes()
    const e = s + (r.duration_min && r.duration_min > 0 ? r.duration_min : durationMin)
    const arr = busy.get(r.resource_id) ?? []
    arr.push({ s, e })
    busy.set(r.resource_id, arr)
  }

  // 5) Por recurso: ventana efectiva = intersección de negocio ∩ servicio ∩ recurso.
  const step = Math.max(30, Math.ceil(durationMin / 30) * 30)
  // time -> { free, resourceId } acumulando sobre recursos.
  const acc = new Map<number, { free: number; resourceId: string | null }>()
  for (const res of resList) {
    const resWeekly = normalizeWeekly(res.hours_json)
    // El recurso restringe sólo si define horario propio; si su día es null → libra ese día.
    const resWin = res.hours_json != null ? dayWindow(resWeekly, null, dow) : null
    if (res.hours_json != null && !resWin) continue // recurso no trabaja ese día
    const win = intersect(bizWin, svcWin, resWin)
    if (!win) continue
    const taken = busy.get(res.id) ?? []
    for (let t = win.start; t + durationMin <= win.end; t += step) {
      const overlaps = taken.some(b => t < b.e && b.s < t + durationMin)
      const cur = acc.get(t) ?? { free: 0, resourceId: null }
      if (!overlaps) { cur.free += 1; if (!cur.resourceId) cur.resourceId = res.id }
      acc.set(t, cur)
    }
  }

  const slots: AvailabilitySlot[] = [...acc.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, v]) => ({ time: fmt(t), free: v.free, resourceId: v.resourceId }))

  return { date: dateISO, offered: slots.length > 0, durationMin, capacity: resList.length, slots }
}
