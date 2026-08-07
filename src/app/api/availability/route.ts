import { NextRequest, NextResponse } from 'next/server'
import { computeAvailability, type DayAvailability } from '@/lib/availability'

// Disponibilidad real de un servicio (agregada sobre los recursos que lo dan).
//   GET ?biz_id=..&service_id=..&date=YYYY-MM-DD        → un día
//   GET ?biz_id=..&service_id=..&from=YYYY-MM-DD&days=4 → varios días
// Público (el cliente lo necesita antes de reservar); sólo lee.
export const dynamic = 'force-dynamic'

function addDays(dateISO: string, n: number): string {
  const [y, mo, d] = dateISO.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, d + n)).toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const bizId = p.get('biz_id')
  const serviceId = p.get('service_id')
  if (!bizId || !serviceId) return NextResponse.json({ error: 'biz_id y service_id requeridos' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)
  const from = p.get('from') || p.get('date') || today
  const count = Math.min(14, Math.max(1, parseInt(p.get('days') || '1', 10) || 1))

  try {
    const dates = Array.from({ length: count }, (_, i) => addDays(from, i))
    const days: DayAvailability[] = []
    for (const date of dates) days.push(await computeAvailability(bizId, serviceId, date))
    // Compat: `date` único devuelve el objeto directo; rango devuelve el arreglo.
    return NextResponse.json(count === 1 ? { day: days[0] } : { days })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
