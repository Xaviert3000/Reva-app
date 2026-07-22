'use client'
import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react'
import { BM_OPTIONS_DEFAULT, loadBMConfig, saveBMConfig, type BMOption } from '@/lib/boomerangme-config'
import { STRIPE_OPTIONS_DEFAULT, loadStripeConfig, saveStripeConfig, type StripeOption } from '@/lib/stripe-config'
import { OR_OPTIONS_DEFAULT, OR_DEFAULT_MODEL, loadORConfig, saveORConfig, type OROption } from '@/lib/openrouter-config'
import { PROMPT_DEFS, DEFAULT_PROMPTS, type PromptId } from '@/lib/ai-prompts'
import { STATES_DATA } from '@/lib/data'
import { type RoveReward } from '@/lib/rove-rewards'
import { createClient } from '@/lib/supabase/client'

// ── Design tokens (compartidos con el panel del negocio) ───
const R = {
  coral: '#E8505B', coralTint: '#FCE9E7', coralPress: '#D23B47',
  jade: '#1F8A6D', jadeTint: '#DDF0E8',
  amber: '#E7A33C', amberTint: '#FBEFD7', amberDeep: '#9A6C1C',
  ink: '#221C19', inkSoft: '#6B615A', inkFaint: '#A89E94',
  bg: '#FAF5EE', bgAlt: '#F1EADF', surface: '#FFFFFF',
  line: '#E9E0D5', lineSoft: '#F1EADF',
  dusk: '#1B2436', duskSoft: '#2A3550',
  display: 'var(--font-display)', ui: 'var(--font-ui)',
}

function Icon({ n, size = 20, color = 'currentColor', stroke = 2, fill = 'none' }: {
  n: string; size?: number; color?: string; stroke?: number; fill?: string
}) {
  const paths: Record<string, ReactNode> = {
    chat: <path d="M5 18l-1.5 3.5L7 20.5A8.5 8 0 1020 13c0 4.4-3.6 7-8 7a9 9 0 01-7-2z" />,
    chart: <><path d="M4 20h16M4 20V10l6-4M20 20V6l-6 4M10 6v14M14 10v10" /></>,
    spark: <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />,
    grid: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>,
    cal: <><rect x="4" y="5.5" width="16" height="15" rx="3" /><path d="M4 10h16M8 3.5v4M16 3.5v4" /></>,
    shield: <path d="M12 3l7 2.5v5.5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V5.5L12 3z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    bolt: <path d="M13 3L5 13h7l-1 8 8-10h-7l1-8z" />,
    check: <path d="M5 13l4 4 10-11" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
    coins: <><ellipse cx="12" cy="7" rx="7" ry="3.2" /><path d="M5 7v5c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2V7M5 12v5c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2v-5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>,
    logout: <><path d="M16 17l5-5-5-5M21 12H9M9 21H6a2 2 0 01-2-2V5a2 2 0 012-2h3" /></>,
    link: <><path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.5 1.5" /><path d="M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.5-1.5" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h3" /></>,
    chevron: <path d="M9 6l6 6-6 6" />,
    back: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
    cpu: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" /></>,
    users: <><circle cx="8" cy="8" r="3.5" /><path d="M2 20a7 7 0 0112 0" /><circle cx="17" cy="8" r="3.5" /><path d="M23 20a7 7 0 00-10-5.8" /></>,
    mail: <><rect x="2" y="5" width="20" height="15" rx="2.5" /><path d="M2 8l10 7 10-7" /></>,
    send: <path d="M5 12l14-7-5 16-3-6-6-3z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    bell: <><path d="M18 8.5a6 6 0 10-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5z" /><path d="M13.7 19.5a2 2 0 01-3.4 0" /></>,
    globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" /></>,
    credit: <><rect x="2" y="6" width="20" height="13" rx="2.5" /><path d="M2 11h20M6 15.5h4" /></>,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
    report: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6M9 9h1" /></>,
    ticket: <><path d="M4 8.5A2.5 2.5 0 016.5 6h11A2.5 2.5 0 0120 8.5v1a2 2 0 000 4v1a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 14.5v-1a2 2 0 000-4z" /><path d="M14 6v12" /></>,
    download: <><path d="M12 3v12M7 11l5 4 5-4M5 20h14" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
      {paths[n] ?? null}
    </svg>
  )
}

// ── Data demo ──────────────────────────────────────────────
const NAV = [
  { id: 'overview', label: 'Resumen', icon: 'chart' },
  { id: 'destacados', label: 'Destacados', icon: 'spark' },
  { id: 'ingresos', label: 'Ingresos', icon: 'coins' },
  { id: 'negocios', label: 'Negocios', icon: 'grid' },
  { id: 'reservas', label: 'Reservas', icon: 'cal' },
  { id: 'moderacion', label: 'Moderación', icon: 'flag' },
  { id: 'informes', label: 'Informes', icon: 'report' },
  { id: 'rove', label: 'Reva+ Rewards', icon: 'ticket' },
  { id: 'soporte', label: 'Soporte', icon: 'chat' },
  { id: 'integraciones', label: 'Integraciones', icon: 'link' },
  { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
]


// Catálogo de integraciones disponibles (listado de Integraciones)
const INTEGRATIONS: { id: string; name: string; tag: string; desc: string; grad: [string, string]; icon: string; iconFill: boolean }[] = [
  { id: 'openrouter', name: 'OpenRouter', tag: 'Inteligencia artificial', desc: 'Motor de IA del conserje, la negociación entre agentes y el agente del negocio.', grad: ['#0EA5A4', '#0B6E6D'], icon: 'cpu', iconFill: false },
  { id: 'boomerangme', name: 'BoomerangMe', tag: 'Lealtad', desc: 'Sellos, cashback, cupones y más para los clientes de cada negocio.', grad: ['#7C5CFF', '#4A2FBF'], icon: 'spark', iconFill: true },
  { id: 'stripe', name: 'Stripe', tag: 'Pagos', desc: 'Cobra depósitos de reserva y campañas de Destacados de forma segura.', grad: ['#635BFF', '#4B45C6'], icon: 'card', iconFill: false },
]

type Niv = 'Premium' | 'Destacado'

type Biz = { id?: string; name: string; mono: string; cat: string; mun: string; plan: string; estado: 'Activo' | 'Pausado'; dest: string; reservas: number; grad: [string, string]; email?: string; invitePending?: boolean }
// Fila cruda de /api/admin/businesses (Fase 9).
type AdminBizRow = { id: string; name: string; mono: string | null; kind: string | null; type: string | null; municipio: string | null; agent_active: boolean | null; tier: string | null; featured_until: string | null; grad_from: string | null; grad_to: string | null }
const BIZES_INIT: Biz[] = [
  { name: 'La Lupita', mono: 'L', cat: 'Restaurantes', mun: 'San José del Cabo', plan: 'Reva', estado: 'Activo', dest: 'Destacado', reservas: 142, grad: ['#E27A52', '#B5472F'] },
  { name: 'Sereno Spa', mono: 'S', cat: 'Spa & Bienestar', mun: 'San José del Cabo', plan: 'Reva', estado: 'Activo', dest: 'Premium', reservas: 96, grad: ['#C9A2B4', '#6E4A63'] },
  { name: 'Cabo Azul Rooftop', mono: 'C', cat: 'Bar / Vida nocturna', mun: 'Cabo San Lucas', plan: 'Reva', estado: 'Activo', dest: 'Premium', reservas: 210, grad: ['#E9A24A', '#C25C3C'] },
  { name: 'Huerta del Mar', mono: 'H', cat: 'Restaurantes', mun: 'San José del Cabo', plan: 'Reva', estado: 'Activo', dest: 'Destacado', reservas: 88, grad: ['#5FA6B0', '#2E6E78'] },
  { name: 'Comal Costero', mono: 'C', cat: 'Restaurantes', mun: 'Cabo San Lucas', plan: 'Reva', estado: 'Activo', dest: 'Destacado', reservas: 64, grad: ['#8B6CB0', '#4A3370'] },
  { name: 'Cabo Adventures', mono: 'C', cat: 'Tours & Experiencias', mun: 'Cabo San Lucas', plan: 'Reva', estado: 'Activo', dest: 'Destacado', reservas: 51, grad: ['#6E8FB0', '#33507A'] },
  { name: 'Dental Cabo Sonríe', mono: 'D', cat: 'Dentista', mun: 'San José del Cabo', plan: 'Reva', estado: 'Activo', dest: '—', reservas: 33, grad: ['#5FA6B0', '#2E6E78'] },
  { name: 'Studio Cabo Hair', mono: 'S', cat: 'Salón / Barbería', mun: 'Cabo San Lucas', plan: 'Reva', estado: 'Activo', dest: '—', reservas: 47, grad: ['#C9A2B4', '#6E4A63'] },
  { name: 'Mirador', mono: 'M', cat: 'Restaurantes', mun: 'Cabo San Lucas', plan: 'Reva', estado: 'Pausado', dest: '—', reservas: 0, grad: ['#B07A52', '#6E4A2F'] },
]

// Categorías disponibles al dar de alta un negocio nuevo — seed editable desde Ajustes
type BizCategory = { label: string; emoji: string }
const BIZ_CATEGORIES_INIT: BizCategory[] = [
  { label: 'Restaurantes', emoji: '🍽️' },
  { label: 'Bar / Vida nocturna', emoji: '🍸' },
  { label: 'Spa & Bienestar', emoji: '💆' },
  { label: 'Médico / Clínica', emoji: '🏥' },
  { label: 'Dentista', emoji: '🦷' },
  { label: 'Despacho legal', emoji: '⚖️' },
  { label: 'Inmobiliaria', emoji: '🏠' },
  { label: 'Salón / Barbería', emoji: '✂️' },
  { label: 'Tours & Experiencias', emoji: '🚣' },
  { label: 'Gimnasio / Estudio', emoji: '💪' },
]

// Paleta de gradientes para el avatar del negocio — se asigna por rotación
const BIZ_GRADIENTS: [string, string][] = [
  ['#E27A52', '#B5472F'], ['#C9A2B4', '#6E4A63'], ['#E9A24A', '#C25C3C'],
  ['#5FA6B0', '#2E6E78'], ['#8B6CB0', '#4A3370'], ['#6E8FB0', '#33507A'],
]

type Estado = 'Confirmada' | 'Sentados' | 'Por confirmar' | 'Cancelada'
const RESERVAS: { cuando: string; guest: string; biz: string; party: number; via: 'Explorer' | 'Vecino'; estado: Estado }[] = [
  { cuando: 'Hoy 13:30', guest: 'Sofía M.', biz: 'La Lupita', party: 2, via: 'Vecino', estado: 'Confirmada' },
  { cuando: 'Hoy 14:00', guest: 'Emily W.', biz: 'Sereno Spa', party: 2, via: 'Explorer', estado: 'Sentados' },
  { cuando: 'Hoy 20:00', guest: 'Karen H.', biz: 'La Lupita', party: 5, via: 'Vecino', estado: 'Confirmada' },
  { cuando: 'Hoy 20:30', guest: 'Marcus T.', biz: 'Cabo Azul Rooftop', party: 6, via: 'Explorer', estado: 'Por confirmar' },
  { cuando: 'Hoy 21:00', guest: 'Daniela R.', biz: 'Huerta del Mar', party: 4, via: 'Vecino', estado: 'Confirmada' },
  { cuando: 'Mañana 09:00', guest: 'Tom R.', biz: 'Cabo Adventures', party: 8, via: 'Explorer', estado: 'Confirmada' },
  { cuando: 'Mañana 12:00', guest: 'Carla M.', biz: 'Sereno Spa', party: 1, via: 'Vecino', estado: 'Por confirmar' },
  { cuando: 'Mañana 19:00', guest: 'Diego F.', biz: 'Comal Costero', party: 3, via: 'Explorer', estado: 'Cancelada' },
  { cuando: 'Sáb 13:00', guest: 'Ana G.', biz: 'Studio Cabo Hair', party: 1, via: 'Vecino', estado: 'Confirmada' },
  { cuando: 'Sáb 18:30', guest: 'Pablo N.', biz: 'Dental Cabo Sonríe', party: 1, via: 'Vecino', estado: 'Confirmada' },
]
type ResaItem = typeof RESERVAS[number]

// Fila cruda de /api/admin/reservations → forma que pinta la tabla de Reservas.
type AdminResRow = { slot: string | null; created_at: string; party: number | null; status: string; guest_name?: string; businesses?: { name: string; hood: string } | null }
function mapAdminReservation(r: AdminResRow): ResaItem {
  const d = r.slot ? new Date(r.slot) : (r.created_at ? new Date(r.created_at) : null)
  const cuando = d
    ? (d.toDateString() === new Date().toDateString() ? 'Hoy ' : '') + d.toLocaleString('es-MX', { day: d.toDateString() === new Date().toDateString() ? undefined : 'numeric', month: d.toDateString() === new Date().toDateString() ? undefined : 'short', hour: '2-digit', minute: '2-digit' })
    : 'Solicitud'
  const estado: Estado = r.status === 'confirmed' ? 'Confirmada' : r.status === 'completed' ? 'Sentados' : (r.status === 'cancelled' || r.status === 'no_show') ? 'Cancelada' : 'Por confirmar'
  return { cuando, guest: r.guest_name || 'Cliente', biz: r.businesses?.name || 'Negocio', party: r.party ?? 1, via: 'Explorer', estado }
}

type PaymentItem = { id: string; created_at: string; type: string; amount: number; revenue: number; currency: string; biz_name: string; mono: string; grad: [string, string]; guest_name: string }
type RevenueTypeAgg = { count: number; gross: number; revenue: number; revenueMonth: number; countMonth: number }
type RevenueData = {
  payments: PaymentItem[]
  totals: { gmv: number; platform: number; platformMonth: number; count: number; byType: Record<string, RevenueTypeAgg>; commissionRate: number }
}

// Datos reales del módulo Destacados (/api/admin/featured).
type FeatInvRow = { categoria: string; municipio: string; premiumSold: number; premiumCap: number; destacadoSold: number; destacadoCap: number; waitlist: number }
type FeatActive = { id: string; biz: string; mono: string; cat: string; mun: string; nivel: Niv; que: string; dias: number | null; amount: number; grad: [string, string] }
type FeaturedData = { inventory: FeatInvRow[]; active: FeatActive[]; totals: { premiumSold: number; premiumCap: number; destacadoSold: number; destacadoCap: number; waitlist: number } }

type ModItem = { id: string; biz: string; mono: string; nivel: Niv; tipo: 'Servicio' | 'Negocio' | 'Promoción'; que: string; enviado: string; grad: [string, string] }
const MOD_INIT: ModItem[] = [
  { id: '1', biz: 'Mariscos El Faro', mono: 'M', nivel: 'Destacado', tipo: 'Servicio', que: 'Torre de mariscos · $480', enviado: 'hace 2 h', grad: ['#5FA6B0', '#2E6E78'] },
  { id: '2', biz: 'Lounge 22', mono: 'L', nivel: 'Premium', tipo: 'Negocio', que: 'Todo el negocio', enviado: 'hace 5 h', grad: ['#E9A24A', '#C25C3C'] },
  { id: '3', biz: 'Taquería Don Beto', mono: 'T', nivel: 'Destacado', tipo: 'Promoción', que: '2x1 en tacos · martes', enviado: 'ayer', grad: ['#E27A52', '#B5472F'] },
  { id: '4', biz: 'Spa Luna', mono: 'S', nivel: 'Destacado', tipo: 'Servicio', que: 'Facial premium · $1,900', enviado: 'ayer', grad: ['#C9A2B4', '#6E4A63'] },
]
// Fila cruda de /api/admin/moderation.
type ModRow = { id: string; biz_name: string | null; mono: string | null; nivel: string | null; tipo: string; que: string | null; grad_from: string | null; grad_to: string | null; created_at: string }
function mapModItem(r: ModRow): ModItem {
  const min = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000)
  const enviado = min < 60 ? `hace ${Math.max(1, min)} min` : min < 1440 ? `hace ${Math.floor(min / 60)} h` : `hace ${Math.floor(min / 1440)} d`
  return {
    id: r.id,
    biz: r.biz_name || 'Negocio',
    mono: r.mono || (r.biz_name || 'R').charAt(0).toUpperCase(),
    nivel: r.nivel === 'Premium' ? 'Premium' : 'Destacado',
    tipo: (r.tipo === 'Negocio' || r.tipo === 'Promoción' || r.tipo === 'Servicio') ? r.tipo : 'Servicio',
    que: r.que || '',
    enviado,
    grad: [r.grad_from || '#5FA6B0', r.grad_to || '#2E6E78'],
  }
}

type Ticket = {
  id: string; user: string; city: string; mode: 'Explorer'|'Vecino'; issue: string; time: string; status: 'nuevo'|'en_progreso'|'resuelto'
  thread: { from: 'user'|'agent'; txt: string; time: string }[]
  // User profile
  email: string; phone?: string; memberSince: string; reservasTotal: number; lang: string
  prevTickets: { id: string; issue: string; status: string; date: string }[]
}

const RES_COLOR: Record<Estado, [string, string]> = {
  'Confirmada': [R.jade, R.jadeTint], 'Sentados': [R.dusk, '#EAECEF'],
  'Por confirmar': [R.amberDeep, R.amberTint], 'Cancelada': [R.coralPress, R.coralTint],
}
const nivColor = (n: Niv) => n === 'Premium' ? { main: R.amber, press: R.amberDeep, tint: R.amberTint, badge: '★ Premium' } : { main: R.coral, press: R.coralPress, tint: R.coralTint, badge: '✦ Destacado' }

function Card({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return <div onClick={onClick} style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 18, padding: '20px 22px', ...style }}>{children}</div>
}

function KPI({ label, value, sub, tint, icon }: { label: string; value: string; sub?: string; tint: string; icon: ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: R.surface, border: `1px solid ${R.line}`, borderRadius: 18, padding: '18px 20px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: tint, display: 'grid', placeItems: 'center', marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 26, color: R.ink, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: R.inkSoft, marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: R.inkFaint, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Bar({ sold, total, color }: { sold: number; total: number; color: string }) {
  const pct = total ? Math.round((sold / total) * 100) : 0
  const full = sold >= total
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 999, background: R.bgAlt, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: full ? R.coral : color }} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: full ? R.coralPress : R.ink, width: 30, textAlign: 'right' }}>{sold}/{total}</span>
    </div>
  )
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(s => {
        const on = value === s
        return <button key={s} onClick={() => onChange(s)} style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, color: on ? R.coralPress : R.inkSoft, fontFamily: R.ui, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{s}</button>
      })}
    </div>
  )
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: R.surface, border: `1px solid ${R.line}`, borderRadius: 12, padding: '9px 12px', flex: '1 1 240px', maxWidth: 320 }}>
      <Icon n="search" size={16} color={R.inkFaint} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: R.ui, fontSize: 14, color: R.ink, width: '100%' }} />
      {value && <button onClick={() => onChange('')} aria-label="Limpiar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>}
    </div>
  )
}

// ── Informes: tipos + utilidades ───────────────────────────
type ReportKey = 'negocios' | 'reservas' | 'ingresos' | 'destacados' | 'moderacion' | 'soporte' | 'rove'

// Definición de un reporte: columnas para la tabla + generador de filas.
type RepCol = { label: string; align?: 'right' | 'center' }
type RepRow = { search: string; filter: string; cells: ReactNode[]; csv: (string | number)[] }
type RepKpi = { label: string; value: string; tint: string; icon: ReactNode }
type ReportDef = { columns: RepCol[]; filters: string[]; rows: RepRow[]; kpis: RepKpi[] }

// Escapa un valor para CSV (comillas + separador) y arma el archivo.
function toCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))]
  // BOM para que Excel lea acentos correctamente.
  return '﻿' + lines.join('\r\n')
}

// Dispara la descarga de un archivo CSV en el navegador.
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const blob = new Blob([toCSV(headers, rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── Login del super admin ──────────────────────────────────
function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // Inicia sesión con Supabase y valida que el correo sea admin (allowlist server).
  async function submit() {
    if (busy) return
    setBusy(true); setErr('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
    if (error) { setErr('Credenciales incorrectas.'); setBusy(false); return }
    const res = await fetch('/api/admin/session')
    const data = await res.json().catch(() => ({ admin: false }))
    if (data.admin) { onAuth() }
    else { await supabase.auth.signOut(); setErr('Esta cuenta no tiene acceso de administrador.') }
    setBusy(false)
  }
  const field: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }

  return (
    <div style={{ minHeight: '100vh', background: R.dusk, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: R.ui }}>
      <div style={{ width: '100%', maxWidth: 400, background: R.bg, borderRadius: 24, padding: 28, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: R.coral, display: 'grid', placeItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 17c0-4.4 3.2-8 7-8s7 3.6 7 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /><circle cx="12" cy="17" r="2.2" fill="#fff" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 18, color: R.ink, lineHeight: 1 }}>Reva</div>
            <div style={{ fontSize: 10.5, color: R.inkFaint, fontWeight: 700, letterSpacing: '.05em' }}>SUPER ADMIN</div>
          </div>
        </div>
        <h2 style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink, marginBottom: 4 }}>Acceso restringido</h2>
        <p style={{ fontSize: 13.5, color: R.inkSoft, marginBottom: 18 }}>Solo para el operador de la plataforma.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo" style={field} />
          <input value={pass} type="password" onChange={e => setPass(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit() }} placeholder="Contraseña" style={field} />
          {err && <div style={{ fontSize: 13, color: R.coralPress, fontWeight: 600 }}>{err}</div>}
          <button onClick={submit} disabled={busy} style={{ width: '100%', padding: '13px', background: R.coral, color: '#fff', border: 'none', borderRadius: 14, fontFamily: R.ui, fontWeight: 700, fontSize: 15, cursor: busy ? 'default' : 'pointer', marginTop: 4, opacity: busy ? 0.7 : 1 }}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Aceptación de invitación al equipo (operador / analista) ──
// Se muestra cuando /admin?invite=<token>. Valida el token, deja al invitado
// crear su contraseña y lo activa; luego inicia sesión automáticamente.
function AdminAccept({ token, onAuth }: { token: string; onAuth: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'form' | 'error' | 'busy'>('loading')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(`/api/admin/team/accept?token=${encodeURIComponent(token)}`)
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) { setErr(d.error || 'Invitación inválida.'); setPhase('error'); return }
        setEmail(d.email); setRole(d.role); setPhase('form')
      })
      .catch(() => { setErr('No se pudo cargar la invitación.'); setPhase('error') })
  }, [token])

  async function activate() {
    if (pass.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return }
    setPhase('busy'); setErr('')
    const res = await fetch('/api/admin/team/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: pass }) })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) { setErr(d.error || 'No se pudo activar la cuenta.'); setPhase('form'); return }
    // Cuenta activa: inicia sesión automáticamente.
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setErr('Cuenta activada. Entra desde la pantalla de acceso con tu correo y contraseña.'); setPhase('error'); return }
    onAuth()
  }

  const field: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }

  return (
    <div style={{ minHeight: '100vh', background: R.dusk, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: R.ui }}>
      <div style={{ width: '100%', maxWidth: 400, background: R.bg, borderRadius: 24, padding: 28, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: R.coral, display: 'grid', placeItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 17c0-4.4 3.2-8 7-8s7 3.6 7 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /><circle cx="12" cy="17" r="2.2" fill="#fff" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 18, color: R.ink, lineHeight: 1 }}>Reva</div>
            <div style={{ fontSize: 10.5, color: R.inkFaint, fontWeight: 700, letterSpacing: '.05em' }}>EQUIPO</div>
          </div>
        </div>

        {phase === 'loading' && <p style={{ fontSize: 14, color: R.inkSoft }}>Cargando invitación…</p>}

        {phase === 'error' && (
          <>
            <h2 style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink, marginBottom: 6 }}>Invitación</h2>
            <p style={{ fontSize: 13.5, color: R.coralPress, fontWeight: 600 }}>{err}</p>
          </>
        )}

        {(phase === 'form' || phase === 'busy') && (
          <>
            <h2 style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink, marginBottom: 4 }}>Activa tu cuenta</h2>
            <p style={{ fontSize: 13.5, color: R.inkSoft, marginBottom: 16 }}>
              Fuiste invitado como <strong style={{ color: R.ink }}>{role}</strong>. Crea una contraseña para <strong style={{ color: R.ink }}>{email}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={email} readOnly style={{ ...field, color: R.inkSoft, background: R.bgAlt }} />
              <input value={pass} type="password" onChange={e => { setPass(e.target.value); setErr('') }} onKeyDown={e => { if (e.key === 'Enter') activate() }} placeholder="Contraseña (mín. 8 caracteres)" style={field} />
              {err && <div style={{ fontSize: 13, color: R.coralPress, fontWeight: 600 }}>{err}</div>}
              <button onClick={activate} disabled={phase === 'busy'} style={{ width: '100%', padding: '13px', background: R.coral, color: '#fff', border: 'none', borderRadius: 14, fontFamily: R.ui, fontWeight: 700, fontSize: 15, cursor: phase === 'busy' ? 'default' : 'pointer', marginTop: 4, opacity: phase === 'busy' ? 0.7 : 1 }}>{phase === 'busy' ? 'Activando…' : 'Activar y entrar'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Rove Admin ─────────────────────────────────────────────

const ROVE_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'En revisión', color: '#9A6C1C', bg: '#FBEFD7' },
  active:   { label: 'Activa',      color: '#16614c', bg: '#DDF0E8' },
  paused:   { label: 'Pausada',     color: '#6B615A', bg: '#F1EADF' },
  rejected: { label: 'Rechazada',   color: '#D23B47', bg: '#FCE9E7' },
}

const ROVE_CAT_EMOJI: Record<string, string> = { food: '🍽️', experience: '🌅', discount: '🏷️', upgrade: '⭐' }

type RoveFilter = 'all' | 'pending' | 'active' | 'paused' | 'rejected'

function RoveAdminView({ rewards, onUpdate, canWrite }: { rewards: RoveReward[]; onUpdate: (r: RoveReward) => void; canWrite: boolean }) {
  const [filter, setFilter] = useState<RoveFilter>('pending')
  const [selected, setSelected] = useState<RoveReward | null>(null)
  const [ticketCostOverride, setTicketCostOverride] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }, [toast])

  const pending = rewards.filter(r => r.status === 'pending')
  const active  = rewards.filter(r => r.status === 'active')
  const paused  = rewards.filter(r => r.status === 'paused')

  const visible = filter === 'all' ? rewards : rewards.filter(r => r.status === filter)

  async function decide(decision: 'active' | 'rejected' | 'paused') {
    if (!selected) return
    setBusy(true)
    try {
      const res = await fetch('/api/rove/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: selected.id,
          decision,
          ticketCost: ticketCostOverride ? Number(ticketCostOverride) : undefined,
          rejectionReason: decision === 'rejected' ? rejectReason : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        onUpdate(data.reward)
        setToast(decision === 'active' ? '✓ Recompensa aprobada y publicada' : decision === 'rejected' ? 'Recompensa rechazada' : 'Recompensa pausada')
        setSelected(null)
        setTicketCostOverride('')
        setRejectReason('')
      }
    } finally { setBusy(false) }
  }

  const fieldStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160, background: R.amberTint, borderRadius: 16, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: R.amberDeep, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Por revisar</div>
          <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 32, color: R.ink }}>{pending.length}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, background: R.jadeTint, borderRadius: 16, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#16614c', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Activas</div>
          <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 32, color: R.ink }}>{active.length}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, background: R.bgAlt, borderRadius: 16, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Pausadas</div>
          <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 32, color: R.ink }}>{paused.length}</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Negocios</div>
          <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 32, color: R.ink }}>{new Set(rewards.map(r => r.bizId)).size}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'inline-flex', gap: 4, background: R.bgAlt, borderRadius: 999, padding: 4, marginBottom: 18 }}>
        {([
          ['all',      `Todas (${rewards.length})`],
          ['pending',  `Por revisar (${pending.length})`],
          ['active',   `Activas (${active.length})`],
          ['paused',   `Pausadas (${paused.length})`],
          ['rejected', 'Rechazadas'],
        ] as [RoveFilter, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{ padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13, background: filter === id ? R.surface : 'transparent', color: filter === id ? R.ink : R.inkSoft, boxShadow: filter === id ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: '40px 24px', textAlign: 'center', color: R.inkSoft }}>
          {filter === 'pending' ? 'No hay recompensas pendientes de revisión.' : 'No hay recompensas en este estado.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {visible.map(r => {
            const st = ROVE_STATUS_META[r.status] ?? ROVE_STATUS_META.pending
            const catEmoji = ROVE_CAT_EMOJI[r.category] ?? '🎁'
            return (
              <div key={r.id} style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: r.bizColor + '22', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>{catEmoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15.5, color: R.ink }}>{r.title}</div>
                    <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 1 }}>{r.bizName}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>{st.label}</span>
                </div>
                <p style={{ fontSize: 13, color: R.inkSoft, lineHeight: 1.5, margin: 0 }}>{r.description}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: R.amberDeep, background: R.amberTint, padding: '3px 10px', borderRadius: 999 }}>{r.ticketCost} boletos</span>
                  <span style={{ fontSize: 12, color: R.inkFaint, background: R.bgAlt, padding: '3px 10px', borderRadius: 999 }}>📅 {r.validDays}d</span>
                  {r.stock !== null && <span style={{ fontSize: 12, color: R.inkFaint, background: R.bgAlt, padding: '3px 10px', borderRadius: 999 }}>Stock: {r.stock}</span>}
                </div>
                {r.status === 'rejected' && r.rejectionReason && (
                  <div style={{ fontSize: 12.5, color: R.coralPress, background: R.coralTint, borderRadius: 8, padding: '7px 10px' }}>Motivo: {r.rejectionReason}</div>
                )}
                <button onClick={() => { setSelected(r); setTicketCostOverride(String(r.ticketCost)); setRejectReason('') }} style={{ marginTop: 'auto', padding: '10px', border: `1px solid ${R.line}`, borderRadius: 11, background: r.status === 'pending' ? R.ink : R.surface, color: r.status === 'pending' ? '#fff' : R.ink, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>
                  {r.status === 'pending' ? 'Revisar y decidir' : 'Gestionar'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de revisión */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', background: R.bg, borderRadius: 20, padding: 26, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink }}>Revisar recompensa</span>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {/* Detalle */}
            <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: selected.bizColor + '22', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{ROVE_CAT_EMOJI[selected.category] ?? '🎁'}</div>
                <div>
                  <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>{selected.title}</div>
                  <div style={{ fontSize: 12.5, color: R.inkSoft }}>{selected.bizName}</div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: R.inkSoft, lineHeight: 1.55, margin: '0 0 10px' }}>{selected.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, background: R.bgAlt, padding: '3px 10px', borderRadius: 999, color: R.inkSoft }}>📅 {selected.validDays} días</span>
                {selected.stock !== null && <span style={{ fontSize: 12, background: R.bgAlt, padding: '3px 10px', borderRadius: 999, color: R.inkSoft }}>Stock: {selected.stock}</span>}
              </div>
            </div>

            {/* Ajustar costo en boletos */}
            {canWrite && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Costo en boletos (propuesto: {selected.ticketCost})</div>
              <input type="number" min={1} max={100} value={ticketCostOverride} onChange={e => setTicketCostOverride(e.target.value)} style={fieldStyle} />
              <div style={{ fontSize: 12, color: R.inkSoft, marginTop: 5 }}>Puedes ajustar el costo antes de aprobar. El negocio verá el valor final.</div>
            </div>
            )}

            {/* Motivo de rechazo */}
            {canWrite && selected.status !== 'active' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Motivo de rechazo <span style={{ fontWeight: 500, textTransform: 'none' }}>(solo si rechazas)</span></div>
                <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Ej. El premio no cumple las condiciones mínimas" style={fieldStyle} />
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canWrite && selected.status !== 'active' && (
                <button onClick={() => decide('active')} disabled={busy} style={{ flex: 2, minWidth: 120, padding: '12px', border: 'none', borderRadius: 12, background: R.jade, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, opacity: busy ? .7 : 1 }}>
                  {busy ? '…' : '✓ Aprobar y publicar'}
                </button>
              )}
              {canWrite && selected.status === 'active' && (
                <button onClick={() => decide('paused')} disabled={busy} style={{ flex: 1, padding: '12px', border: `1px solid ${R.line}`, borderRadius: 12, background: R.surface, color: R.ink, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, opacity: busy ? .7 : 1 }}>
                  Pausar
                </button>
              )}
              {canWrite && selected.status === 'paused' && (
                <button onClick={() => decide('active')} disabled={busy} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: R.jade, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, opacity: busy ? .7 : 1 }}>
                  Reactivar
                </button>
              )}
              {canWrite && selected.status !== 'rejected' && (
                <button onClick={() => decide('rejected')} disabled={busy} style={{ flex: 1, padding: '12px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', color: R.coralPress, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, opacity: busy ? .7 : 1 }}>
                  Rechazar
                </button>
              )}
              <button onClick={() => setSelected(null)} style={{ padding: '12px 14px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', color: R.inkSoft, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14 }}>{canWrite ? 'Cancelar' : 'Cerrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: R.ink, color: '#fff', padding: '12px 20px', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,.3)', zIndex: 60, fontSize: 14, fontWeight: 600 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [adminRole, setAdminRole] = useState<'super_admin' | 'operador' | 'analista'>('super_admin')
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [view, setView] = useState('destacados')
  const [integ, setInteg] = useState<string | null>(null) // módulo de integración abierto (null = listado)
  const [notifOpen, setNotifOpen] = useState(false)
  const [roveRewards, setRoveRewards] = useState<RoveReward[]>([])

  useEffect(() => {
    if (!authed) return
    fetch('/api/rove/admin').then(r => r.json()).then(d => setRoveRewards(d.rewards ?? [])).catch(() => {})
    // Negocios reales de la plataforma.
    fetch('/api/admin/businesses').then(r => r.ok ? r.json() : null).then(d => {
      if (!d?.businesses) return
      setBizes(d.businesses.map((b: AdminBizRow): Biz => ({
        id: b.id,
        name: b.name,
        mono: b.mono || (b.name || 'R').charAt(0).toUpperCase(),
        cat: b.kind || b.type || '—',
        mun: b.municipio || '—',
        plan: 'Reva',
        estado: b.agent_active ? 'Activo' : 'Pausado',
        // Solo cuenta como destacado si el plan no ha vencido (igual que /app).
        dest: (b.featured_until && new Date(b.featured_until).getTime() < Date.now())
          ? '—'
          : b.tier === 'premium' ? 'Premium' : b.tier === 'destacado' ? 'Destacado' : '—',
        reservas: 0,
        grad: [b.grad_from || '#5FA6B0', b.grad_to || '#2E6E78'],
      })))
    }).catch(() => {})
    // Reservas reales de la plataforma + agregados (total del mes, conteo por negocio).
    fetch('/api/admin/reservations').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.reservations) setReservasList(d.reservations.map(mapAdminReservation))
      if (d?.stats) setResStats(d.stats)
    }).catch(() => {})
    // Tickets de soporte reales.
    fetch('/api/admin/support').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.tickets) setTickets(d.tickets)
    }).catch(() => {})
    // Destacados reales: inventario de cupos + campañas vigentes.
    fetch('/api/admin/featured').then(r => r.ok ? r.json() : null).then((d: FeaturedData | null) => {
      if (d?.inventory) setFeatured(d)
    }).catch(() => {})
    // Cola de moderación real.
    fetch('/api/admin/moderation').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.items) setModQueue(d.items.map(mapModItem))
    }).catch(() => {})
    // Ingresos reales de la plataforma.
    fetch('/api/admin/revenue').then(r => r.ok ? r.json() : null).then((d: RevenueData | null) => {
      if (d?.totals) setRevenue(d)
    }).catch(() => {}).finally(() => setRevLoaded(true))
    // Equipo Reva real (operadores / analistas). El Super Admin se mantiene
    // desde la sesión; aquí se anexan los miembros persistidos en la BD.
    fetch('/api/admin/team').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.members) setStaff(prev => [...prev.filter(s => s.role === 'Super Admin'), ...(d.members as StaffMember[])])
    }).catch(() => {})
    // Ajustes generales de la plataforma persistidos (nombre, URL, idioma, zona
    // horaria, notificaciones y seguridad).
    fetch('/api/admin/settings').then(r => r.ok ? r.json() : null).then(d => {
      const s = d?.settings
      if (!s) return
      setPlatName(s.platName); setPlatUrl(s.platUrl); setPlatLang(s.platLang); setPlatTz(s.platTz)
      setNotifEmail(s.notifEmail); setNotifs(s.notifs); setTwoFa(s.twoFa); setSessExpiry(s.sessExpiry)
    }).catch(() => {})
  }, [authed])

  function updateRoveReward(updated: RoveReward) {
    setRoveRewards(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  // Negocios
  const [bizes, setBizes] = useState<Biz[]>(BIZES_INIT)
  const [bq, setBq] = useState('')
  const [bf, setBf] = useState('Todos')
  const [selBiz, setSelBiz] = useState<number | null>(null)
  const [addBizOpen, setAddBizOpen] = useState(false)
  const [bizCategories, setBizCategories] = useState<BizCategory[]>(BIZ_CATEGORIES_INIT)
  const [newBizName, setNewBizName] = useState('')
  const [newBizEmail, setNewBizEmail] = useState('')
  const [newBizEmailError, setNewBizEmailError] = useState('')
  const [inviteSent, setInviteSent] = useState<string | null>(null)
  const [newBizCat, setNewBizCat] = useState(BIZ_CATEGORIES_INIT[0].label)
  const [newBizState, setNewBizState] = useState('Baja California Sur')
  const [newBizMun, setNewBizMun] = useState('Los Cabos')
  const [newBizPlan, setNewBizPlan] = useState<'Reva'>('Reva')
  const [newBizError, setNewBizError] = useState('')
  const [addBizLoading, setAddBizLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const newBizMunicipios = STATES_DATA.find(s => s.name === newBizState)?.municipalities ?? []

  function selectBizState(name: string) {
    setNewBizState(name)
    const muns = STATES_DATA.find(s => s.name === name)?.municipalities ?? []
    setNewBizMun(muns[0] ?? '')
  }

  // Gestión de categorías (Ajustes → Categorías de negocio)
  const [catEmoji, setCatEmoji] = useState('')
  const [catLabel, setCatLabel] = useState('')
  const [catError, setCatError] = useState('')

  function addCategory() {
    const label = catLabel.trim()
    const emoji = catEmoji.trim() || '🏷️'
    if (!label) { setCatError('Ingresa el nombre de la categoría.'); return }
    if (bizCategories.some(c => c.label.toLowerCase() === label.toLowerCase())) { setCatError('Ya existe una categoría con ese nombre.'); return }
    setBizCategories(prev => [...prev, { label, emoji }])
    setCatEmoji('')
    setCatLabel('')
    setCatError('')
  }

  function removeCategory(label: string) {
    setBizCategories(prev => prev.filter(c => c.label !== label))
    if (newBizCat === label) setNewBizCat(prev => bizCategories.find(c => c.label !== label)?.label ?? prev)
  }

  // Reservas
  const [rq, setRq] = useState('')
  const [rf, setRf] = useState('Todas')
  const [reservasList, setReservasList] = useState<ResaItem[]>(RESERVAS)
  // Agregados reales de reservas: total del mes + conteo por negocio (biz_id → n).
  const [resStats, setResStats] = useState<{ month: number; total: number; byBiz: Record<string, number> }>({ month: 0, total: 0, byBiz: {} })

  // Ingresos (pagos reales desde la tabla `payments` vía /api/admin/revenue)
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [revLoaded, setRevLoaded] = useState(false)
  const [revFilter, setRevFilter] = useState<'Todos' | 'Destacados' | 'Depósitos'>('Todos')

  // Informes (reportes descargables de cada módulo)
  const [repType, setRepType] = useState<ReportKey>('negocios')
  const [repQuery, setRepQuery] = useState('')
  const [repFilter, setRepFilter] = useState('Todos')

  // Destacados (inventario de cupos + campañas vigentes reales, vía /api/admin/featured)
  const [featured, setFeatured] = useState<FeaturedData | null>(null)
  const [capEdit, setCapEdit] = useState<string | null>(null) // "categoria|||municipio" en edición
  const [capDraft, setCapDraft] = useState<{ premium: number; destacado: number }>({ premium: 0, destacado: 0 })

  // Moderación
  const [modQueue, setModQueue] = useState<ModItem[]>(MOD_INIT)
  const [resolved, setResolved] = useState<{ aprobadas: number; rechazadas: number }>({ aprobadas: 0, rechazadas: 0 })

  // Soporte
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selTicket, setSelTicket] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos'|'nuevo'|'en_progreso'|'resuelto'>('todos')
  const [supportSearch, setSupportSearch] = useState('')

  // Equipo Reva (Ajustes)
  type StaffRole = 'Super Admin' | 'Operador' | 'Analista'
  type StaffMember = { id: string | number; name: string; email: string; role: StaffRole; status: 'activo' | 'invitado' }
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 1, name: 'Operador Reva', email: 'admin@reva.mx', role: 'Super Admin', status: 'activo' },
  ])
  const [staffEmail, setStaffEmail] = useState('')
  const [staffRole, setStaffRole] = useState<'Operador' | 'Analista'>('Operador')
  const [staffError, setStaffError] = useState('')
  const [staffNote, setStaffNote] = useState('')
  const [resentStaffIds, setResentStaffIds] = useState<(string | number)[]>([])

  function flashResentStaff(id: string | number) {
    setResentStaffIds(prev => [...prev, id])
    setTimeout(() => setResentStaffIds(prev => prev.filter(x => x !== id)), 2500)
  }

  async function sendStaffInvite() {
    const email = staffEmail.trim()
    if (!email || !email.includes('@')) { setStaffError('Ingresa un correo válido.'); return }
    const existing = staff.find(s => s.email.toLowerCase() === email.toLowerCase())
    if (existing?.status === 'activo') { setStaffError('Este correo ya tiene acceso activo.'); return }
    setStaffError(''); setStaffNote('')
    try {
      const res = await fetch('/api/admin/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role: staffRole }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setStaffError(d.error || 'No se pudo enviar la invitación.'); return }
      if (existing) flashResentStaff(existing.id)
      else if (d.member) setStaff(prev => [...prev, d.member as StaffMember])
      setStaffEmail('')
      setStaffNote(d.warning || 'Invitación enviada ✓')
      setTimeout(() => setStaffNote(''), 3000)
    } catch { setStaffError('No se pudo enviar la invitación.') }
  }

  async function resendStaffInvite(m: StaffMember) {
    flashResentStaff(m.id)
    try { await fetch('/api/admin/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: m.email, role: m.role }) }) } catch {}
  }

  function removeStaff(m: StaffMember) {
    setStaff(prev => prev.filter(s => s.id !== m.id))
    fetch('/api/admin/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: m.email }) }).catch(() => {})
  }

  // Settings panels
  const [settingsPanel, setSettingsPanel] = useState<string | null>(null)
  const [platName, setPlatName] = useState('Reva')
  const [platLang, setPlatLang] = useState('es')
  const [platUrl, setPlatUrl] = useState('reva.mx')
  const [platTz, setPlatTz] = useState('America/Mazatlan')
  const [notifEmail, setNotifEmail] = useState('admin@reva.mx')
  const [notifs, setNotifs] = useState({ nuevaReserva: true, nuevoDestacado: true, nuevoNegocio: false, reporteDiario: true, soporteUrgente: true })
  const [twoFa, setTwoFa] = useState(false)
  const [sessExpiry, setSessExpiry] = useState('7d')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const panelTitles: Record<string, string> = { plataforma: 'Plataforma', notificaciones: 'Notificaciones', seguridad: 'Seguridad', facturacion: 'Facturación', categorias: 'Categorías de negocio' }

  // Persiste los ajustes generales de la plataforma. Facturación y Categorías se
  // guardan por su cuenta (esta función cubre Plataforma / Notificaciones / Seguridad).
  async function saveSettings() {
    setSettingsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platName, platUrl, platLang, platTz, notifEmail, notifs, twoFa, sessExpiry }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        alert(d?.error || 'No se pudieron guardar los cambios.')
        return
      }
      setSettingsPanel(null)
    } catch {
      alert('No se pudieron guardar los cambios. Revisa tu conexión.')
    } finally {
      setSettingsSaving(false)
    }
  }
  const fldStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }
  const lblStyle: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 5 }

  // Integraciones · BoomerangMe
  const [bmKey, setBmKey] = useState('')
  const [bmSecret, setBmSecret] = useState('')
  const [bmConnected, setBmConnected] = useState(false)
  const [bmOptions, setBmOptions] = useState<BMOption[]>(BM_OPTIONS_DEFAULT)
  useEffect(() => { const c = loadBMConfig(); setBmConnected(c.connected); setBmOptions(c.options) }, [])
  function connectBM() { if (bmKey.trim() && bmSecret.trim()) { setBmConnected(true); saveBMConfig({ connected: true, options: bmOptions }) } }
  function disconnectBM() { setBmConnected(false); setBmKey(''); setBmSecret(''); saveBMConfig({ connected: false, options: bmOptions }) }
  function toggleBM(id: string) { setBmOptions(prev => { const next = prev.map(o => o.id === id ? { ...o, on: !o.on } : o); saveBMConfig({ connected: bmConnected, options: next }); return next }) }

  // Integraciones · Stripe — las llaves reales (pk/sk/webhook) viven en variables
  // de entorno de la plataforma (Vercel), no en la app. Aquí el super admin sólo
  // decide qué cobros habilita Reva a través de Stripe.
  const [stOptions, setStOptions] = useState<StripeOption[]>(STRIPE_OPTIONS_DEFAULT)
  useEffect(() => { setStOptions(loadStripeConfig().options) }, [])
  function toggleStripe(id: string) { setStOptions(prev => { const next = prev.map(o => o.id === id ? { ...o, on: !o.on } : o); saveStripeConfig({ connected: true, options: next }); return next }) }

  // Integraciones · OpenRouter
  const [orKey, setOrKey] = useState('')
  const [orModel, setOrModel] = useState(OR_DEFAULT_MODEL)
  const [orFallbacks, setOrFallbacks] = useState('')
  const [orConnected, setOrConnected] = useState(false)
  const [orOptions, setOrOptions] = useState<OROption[]>(OR_OPTIONS_DEFAULT)
  const [orPrompts, setOrPrompts] = useState<Record<PromptId, string>>(DEFAULT_PROMPTS)
  const [orPromptOpen, setOrPromptOpen] = useState<PromptId | null>(null)
  const orSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const orPending = useRef<Record<string, unknown>>({})

  // Carga: localStorage al instante + config del servidor (Supabase) cuando llega.
  useEffect(() => {
    const c = loadORConfig(); setOrConnected(c.connected) // 'conectado' es estado de UI local
    // Modelo, respaldos, prompts y toggles son del servidor (Supabase) = fuente de verdad.
    fetch('/api/platform-config').then(r => r.ok ? r.json() : null).then((cfg) => {
      if (!cfg) return
      if (cfg.model) setOrModel(cfg.model)
      if (Array.isArray(cfg.fallbackModels)) setOrFallbacks(cfg.fallbackModels.join(', '))
      if (cfg.prompts) setOrPrompts(p => ({ ...p, ...cfg.prompts }))
      if (cfg.options) setOrOptions(opts => opts.map(o => ({ ...o, on: cfg.options[o.id] ?? o.on })))
    }).catch(() => {})
  }, [])

  // Persiste en el servidor (Supabase) con debounce; acumula patches para no pisarlos.
  function persistOR(patch: Record<string, unknown>) {
    orPending.current = { ...orPending.current, ...patch }
    if (orSaveTimer.current) clearTimeout(orSaveTimer.current)
    orSaveTimer.current = setTimeout(() => {
      const body = orPending.current; orPending.current = {}
      fetch('/api/platform-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {})
    }, 600)
  }
  const optionsMap = (opts: OROption[]) => Object.fromEntries(opts.map(o => [o.id, o.on]))

  function connectOR() { if (orKey.trim()) { setOrConnected(true); saveORConfig({ connected: true, options: orOptions, prompts: orPrompts }) } }
  function disconnectOR() { setOrConnected(false); setOrKey(''); saveORConfig({ connected: false, options: orOptions, prompts: orPrompts }) }
  function toggleOR(id: string) { setOrOptions(prev => { const next = prev.map(o => o.id === id ? { ...o, on: !o.on } : o); saveORConfig({ connected: orConnected, options: next, prompts: orPrompts }); persistOR({ options: optionsMap(next) }); return next }) }
  function setPrompt(id: PromptId, val: string) { setOrPrompts(prev => { const next = { ...prev, [id]: val }; saveORConfig({ connected: orConnected, options: orOptions, prompts: next }); persistOR({ prompts: next }); return next }) }
  function resetPrompt(id: PromptId) { setPrompt(id, DEFAULT_PROMPTS[id]) }
  function setModelCfg(v: string) { setOrModel(v); persistOR({ model: v }) }
  function setFallbacksCfg(v: string) { setOrFallbacks(v); persistOR({ fallbackModels: v.split(',').map(s => s.trim()).filter(Boolean) }) }

  // ?invite=<token> en la URL → mostrar la pantalla de activación del equipo.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('invite')
    if (t) setInviteToken(t)
  }, [])

  // Verifica la sesión admin real (Supabase + allowlist) al cargar.
  useEffect(() => { fetch('/api/admin/session').then(r => r.json()).then(d => {
    setAuthed(!!d.admin)
    if (d.role) setAdminRole(d.role)
    if (d.email) {
      if (!d.role || d.role === 'super_admin') {
        // Tarjeta propia del super admin (no vive en admin_team; se pinta desde la sesión).
        setStaff(prev => prev.map(s => s.role === 'Super Admin' ? { ...s, email: d.email, name: d.email.split('@')[0] } : s))
      } else {
        // Operador/Analista: sin tarjeta sintética; ya aparece en la lista real del equipo.
        setStaff(prev => prev.filter(s => s.role !== 'Super Admin'))
      }
    }
  }).catch(() => {}) }, [])
  function login() { setAuthed(true) }
  async function logout() { try { await createClient().auth.signOut() } catch {} setAuthed(false) }

  // ?invite=<token> → pantalla de activación del equipo (operador / analista).
  if (inviteToken) return <AdminAccept token={inviteToken} onAuth={() => { setAuthed(true); setInviteToken(null); window.history.replaceState({}, '', '/admin') }} />
  if (!authed) return <AdminLogin onAuth={login} />

  const fmt = (n: number) => '$' + n.toLocaleString('es-MX')

  // Permiso de escritura en la UI (misma matriz que canWrite del backend).
  // Operador: soporte, moderación y reservas. Analista: solo lectura. Super admin: todo.
  const canWriteUI = (mod: string) => adminRole === 'super_admin' || (adminRole === 'operador' && ['support', 'moderation', 'reservations'].includes(mod))

  // ── Derivados reales para el Resumen (base de datos) ──
  // Reservas por negocio (biz_id → n) desde /api/admin/reservations.
  const bizReservas = (b: Biz) => (b.id ? resStats.byBiz[b.id] : undefined) ?? b.reservas
  // Destacados activos por nivel (real, desde businesses.tier).
  const premiumLive = bizes.filter(b => b.dest === 'Premium').length
  const destacadoLive = bizes.filter(b => b.dest === 'Destacado').length
  // "Lista de espera" real: negocios activos sin visibilidad pagada (demanda potencial de cupo).
  const sinDestacar = bizes.filter(b => b.estado === 'Activo' && b.dest === '—').length
  // Ingresos reales desde /api/admin/revenue (payments).
  const platformMonth = revenue?.totals.platformMonth ?? 0
  const featuredMonth = revenue?.totals.byType?.featured?.revenueMonth ?? 0
  const featuredActive = premiumLive + destacadoLive

  // ── Módulo Destacados (cupos reales) ──
  const featInventory = featured?.inventory ?? []
  const featActive = featured?.active ?? []
  const featTotals = featured?.totals ?? { premiumSold: 0, premiumCap: 0, destacadoSold: 0, destacadoCap: 0, waitlist: 0 }
  const featSoldTotal = featTotals.premiumSold + featTotals.destacadoSold
  const featCapTotal = featTotals.premiumCap + featTotals.destacadoCap
  const featOcc = featCapTotal ? Math.round((featSoldTotal / featCapTotal) * 100) : 0

  // Guarda un cupo (capacidad) editado y refresca el inventario en vivo.
  async function saveCap(categoria: string, municipio: string, premium_cap: number, destacado_cap: number) {
    setFeatured(prev => prev ? { ...prev, inventory: prev.inventory.map(r => r.categoria === categoria && r.municipio === municipio ? { ...r, premiumCap: premium_cap, destacadoCap: destacado_cap } : r) } : prev)
    setCapEdit(null)
    try {
      await fetch('/api/admin/featured', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoria, municipio, premium_cap, destacado_cap }) })
      const d = await fetch('/api/admin/featured').then(r => r.ok ? r.json() : null)
      if (d?.inventory) setFeatured(d)
    } catch {}
  }

  // Negocios filtrados
  const bizRows = bizes.map((b, idx) => ({ b, idx })).filter(({ b }) =>
    (bf === 'Todos' || b.estado === bf) && b.name.toLowerCase().includes(bq.trim().toLowerCase()))
  // Reservas filtradas
  const resRows = reservasList.filter(r =>
    (rf === 'Todas' || r.estado === rf) && (r.guest + ' ' + r.biz).toLowerCase().includes(rq.trim().toLowerCase()))

  function moderate(id: string, ok: boolean) {
    setModQueue(q => q.filter(m => m.id !== id))
    setResolved(s => ok ? { ...s, aprobadas: s.aprobadas + 1 } : { ...s, rechazadas: s.rechazadas + 1 })
    fetch('/api/admin/moderation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, decision: ok ? 'approved' : 'rejected' }),
    }).catch(() => {})
  }
  function toggleBiz(idx: number) {
    setBizes(prev => prev.map((b, i) => i === idx ? { ...b, estado: b.estado === 'Activo' ? 'Pausado' : 'Activo' } : b))
  }

  async function addBusiness() {
    const name = newBizName.trim()
    const email = newBizEmail.trim()
    if (!name) { setNewBizError('Ingresa el nombre del negocio.'); return }
    if (bizes.some(b => b.name.toLowerCase() === name.toLowerCase())) { setNewBizError('Ya existe un negocio con ese nombre.'); return }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setNewBizEmailError('Ingresa un correo válido para enviar la invitación.'); return }

    setAddBizLoading(true)
    try {
      const res = await fetch('/api/invite-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, cat: newBizCat, estado: newBizState, municipio: newBizMun, plan: newBizPlan }),
      })
      const data = await res.json()
      if (!res.ok) { setNewBizError(data.error ?? 'Error al crear la invitación.'); return }

      const newBiz: Biz = {
        name, mono: name.trim().charAt(0).toUpperCase(), cat: newBizCat, mun: newBizMun,
        plan: newBizPlan, estado: 'Pausado', dest: '—', reservas: 0,
        grad: BIZ_GRADIENTS[bizes.length % BIZ_GRADIENTS.length],
        email, invitePending: true,
      }
      setBizes(prev => [...prev, newBiz])
      setInviteSent(data.warning ? `${email} (revisa logs — posible error de envío)` : email)
      setTimeout(() => setInviteSent(null), 5000)
      setNewBizName('')
      setNewBizEmail('')
      setNewBizEmailError('')
      setNewBizCat(bizCategories[0]?.label ?? '')
      setNewBizState('Baja California Sur')
      setNewBizMun('Los Cabos')
      setNewBizPlan('Reva')
      setNewBizError('')
      setAddBizOpen(false)
    } finally {
      setAddBizLoading(false)
    }
  }

  async function resendInvite(biz: Biz) {
    if (!biz.email || resendLoading) return
    setResendLoading(true)
    try {
      const res = await fetch('/api/resend-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: biz.email }),
      })
      const data = await res.json()
      if (!res.ok) { setNewBizError(data.error ?? 'No se pudo reenviar la invitación.'); return }
      setInviteSent(data.warning ? `${biz.email} (revisa logs — posible error de envío)` : biz.email)
      setTimeout(() => setInviteSent(null), 5000)
    } finally {
      setResendLoading(false)
    }
  }

  // Notificaciones de la plataforma, derivadas de la actividad en vivo
  const liveNotifs = [
    ...modQueue.map(m => ({
      id: `mod-${m.id}`, icon: 'flag', tint: R.amberTint, color: R.amberDeep,
      title: `Por aprobar · ${m.nivel}`, sub: `${m.biz} · ${m.que}`, time: m.enviado, view: 'moderacion',
    })),
    ...tickets.filter(t => t.status === 'nuevo').map(t => ({
      id: `tic-${t.id}`, icon: 'chat', tint: R.coralTint, color: R.coralPress,
      title: `Ticket nuevo · ${t.user}`, sub: t.issue, time: t.time, view: 'soporte',
    })),
  ]

  function openNotif(v: string) {
    setNotifOpen(false)
    setInteg(null)
    setView(v)
  }

  const titles: Record<string, [string, string]> = {
    overview: ['Resumen', 'Cómo va la plataforma hoy'],
    destacados: ['Destacados', 'Inventario, ingresos y rotación del marketplace'],
    ingresos: ['Ingresos', 'Todo lo que genera la plataforma, en tiempo real'],
    negocios: ['Negocios', 'Todos los negocios en Reva'],
    reservas: ['Reservas', 'Reservas en toda la plataforma'],
    moderacion: ['Moderación', 'Aprueba el contenido destacado'],
    informes: ['Informes', 'Genera y descarga reportes de cada módulo'],
    rove: ['Reva+ Rewards', 'Aprueba recompensas y monitorea boletos'],
    soporte: ['Soporte', 'Conversaciones de usuarios con el equipo Reva'],
    integraciones: ['Integraciones', 'Conexiones de la plataforma'],
    ajustes: ['Ajustes', 'Configuración de la plataforma'],
  }
  const [title, subtitle] = titles[view] ?? ['', '']
  const detail = selBiz !== null ? bizes[selBiz] : null

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: R.ui, background: R.bg, color: R.ink, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 236, flexShrink: 0, background: R.dusk, color: '#fff', display: 'flex', flexDirection: 'column', padding: '22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 22px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: R.coral, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 17c0-4.4 3.2-8 7-8s7 3.6 7 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /><circle cx="12" cy="17" r="2.2" fill="#fff" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 17, lineHeight: 1 }}>Reva</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.55)', fontWeight: 700, letterSpacing: '.05em' }}>SUPER ADMIN</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.filter(it => adminRole === 'super_admin' || !['integraciones', 'ajustes'].includes(it.id)).map(it => {
            const on = view === it.id
            const badge = it.id === 'moderacion' ? modQueue.length : it.id === 'soporte' ? tickets.filter(t => t.status === 'nuevo').length : it.id === 'rove' ? roveRewards.filter(r => r.status === 'pending').length : 0
            return (
              <button key={it.id} onClick={() => { setView(it.id); setInteg(null) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', background: on ? 'rgba(255,255,255,.12)' : 'transparent', color: on ? '#fff' : 'rgba(255,255,255,.6)', fontWeight: on ? 700 : 500, fontSize: 14.5, fontFamily: R.ui }}>
                <Icon n={it.icon} size={20} color={on ? '#fff' : 'rgba(255,255,255,.5)'} stroke={on ? 2.3 : 2} />
                {it.label}
                {badge > 0 && <span style={{ marginLeft: 'auto', background: R.coral, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 18, height: 18, display: 'grid', placeItems: 'center', padding: '0 5px' }}>{badge}</span>}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.08)', borderRadius: 14, padding: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(140deg,#444,#111)', display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', flexShrink: 0 }}>R</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Operador Reva</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>Los Cabos, BCS</div>
            </div>
          </div>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', color: 'rgba(255,255,255,.7)', fontFamily: R.ui, fontWeight: 600, fontSize: 13.5 }}>
            <Icon n="logout" size={16} color="rgba(255,255,255,.7)" /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 28px', borderBottom: `1px solid ${R.line}`, background: R.surface, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 22, color: R.ink, letterSpacing: '-.02em' }}>{title}</div>
            <div style={{ fontSize: 13, color: R.inkSoft }}>{subtitle}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notificaciones de la plataforma */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                aria-label="Notificaciones"
                style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 40, height: 40, background: notifOpen ? R.coralTint : R.bgAlt, border: 'none', borderRadius: 999, cursor: 'pointer' }}
              >
                <Icon n="bell" size={18} color={notifOpen ? R.coralPress : R.inkSoft} />
                {liveNotifs.length > 0 && (
                  <span style={{ position: 'absolute', top: 5, right: 5, minWidth: 17, height: 17, padding: '0 4px', boxSizing: 'border-box', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700, color: '#fff', background: R.coral, border: `2px solid ${R.surface}`, borderRadius: 999 }}>{liveNotifs.length}</span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 340, maxHeight: 420, overflowY: 'auto', background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, boxShadow: '0 18px 48px rgba(34,28,25,.16)', zIndex: 41 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: `1px solid ${R.lineSoft}`, position: 'sticky', top: 0, background: R.surface }}>
                      <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 15, color: R.ink }}>Notificaciones</span>
                      {liveNotifs.length > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '2px 9px', borderRadius: 999 }}>{liveNotifs.length} nuevas</span>}
                    </div>
                    {liveNotifs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 20px', color: R.inkSoft, fontSize: 13 }}>
                        <Icon n="check" size={26} color={R.jade} />
                        <div style={{ marginTop: 8 }}>Todo al día — sin pendientes.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {liveNotifs.map(n => (
                          <button key={n.id} onClick={() => openNotif(n.view)} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: `1px solid ${R.lineSoft}`, cursor: 'pointer', fontFamily: R.ui, width: '100%' }}>
                            <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 9, background: n.tint, display: 'grid', placeItems: 'center' }}>
                              <Icon n={n.icon} size={16} color={n.color} />
                            </span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</span>
                                <span style={{ fontSize: 11, color: R.inkFaint, flexShrink: 0 }}>{n.time}</span>
                              </span>
                              <span style={{ display: 'block', fontSize: 12.5, color: R.inkSoft, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.sub}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: R.jadeTint, borderRadius: 999, padding: '8px 14px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: R.jade }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#16614c' }}>Plataforma operativa</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 28px' }}>
          {view === 'overview' && (() => {
            const pendingMod = modQueue.length
            const pendingTickets = tickets.filter(t => t.status !== 'resuelto').length
            const topBizes = [...bizes].filter(b => b.estado === 'Activo').sort((a, b) => bizReservas(b) - bizReservas(a)).slice(0, 5)
            const nextReservas = reservasList.filter(r => r.estado !== 'Cancelada').slice(0, 5)
            const pausedBizes = bizes.filter(b => b.estado === 'Pausado').length
            return (
              <>
                {/* Pendientes que requieren acción ahora */}
                {(pendingMod > 0 || pendingTickets > 0) && (
                  <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                    {pendingMod > 0 && (
                      <button onClick={() => setView('moderacion')} style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', background: R.amberTint, border: `1px solid ${R.amber}`, borderRadius: 16, padding: '14px 18px', cursor: 'pointer', fontFamily: R.ui }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n="flag" size={18} color={R.amberDeep} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14.5, color: R.amberDeep }}>{pendingMod} elemento{pendingMod !== 1 ? 's' : ''} por aprobar</div>
                          <div style={{ fontSize: 12.5, color: R.inkSoft }}>Contenido destacado esperando moderación</div>
                        </div>
                        <Icon n="chevron" size={18} color={R.amberDeep} />
                      </button>
                    )}
                    {pendingTickets > 0 && (
                      <button onClick={() => setView('soporte')} style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', background: R.coralTint, border: `1px solid ${R.coral}`, borderRadius: 16, padding: '14px 18px', cursor: 'pointer', fontFamily: R.ui }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n="chat" size={18} color={R.coralPress} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14.5, color: R.coralPress }}>{pendingTickets} ticket{pendingTickets !== 1 ? 's' : ''} de soporte abiertos</div>
                          <div style={{ fontSize: 12.5, color: R.inkSoft }}>Usuarios esperando respuesta</div>
                        </div>
                        <Icon n="chevron" size={18} color={R.coralPress} />
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
                  <KPI label="Negocios activos" value={`${bizes.filter(b => b.estado === 'Activo').length}`} sub={pausedBizes ? `${pausedBizes} pausados · ${bizes.length} en total` : `${bizes.length} en total`} tint={R.coralTint} icon={<Icon n="grid" size={20} color={R.coral} />} />
                  <KPI label="Reservas (mes)" value={resStats.month.toLocaleString('es-MX')} sub="vía Reva" tint={R.jadeTint} icon={<Icon n="cal" size={20} color={R.jade} />} />
                  <KPI label="Ingreso plataforma (mes)" value={fmt(platformMonth)} sub="comisiones + destacados" tint={R.amberTint} icon={<Icon n="coins" size={20} color={R.amber} />} />
                  <KPI label="Ingreso por Destacados (mes)" value={fmt(featuredMonth)} sub={`${featuredActive} ${featuredActive === 1 ? 'campaña activa' : 'campañas activas'}`} tint={R.coralTint} icon={<Icon n="spark" size={20} color={R.coral} />} />
                </div>

                <Card style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Destacados — negocios activos</span>
                    <button onClick={() => setView('destacados')} style={{ background: 'none', border: 'none', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, color: R.coral, cursor: 'pointer' }}>Ver módulo →</button>
                  </div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 12.5, color: R.inkSoft, marginBottom: 6 }}>★ Premium</div><div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 22, color: R.ink }}>{premiumLive} <span style={{ fontSize: 13, fontWeight: 600, color: R.inkFaint }}>{premiumLive === 1 ? 'negocio' : 'negocios'}</span></div></div>
                    <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 12.5, color: R.inkSoft, marginBottom: 6 }}>✦ Destacado</div><div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 22, color: R.ink }}>{destacadoLive} <span style={{ fontSize: 13, fontWeight: 600, color: R.inkFaint }}>{destacadoLive === 1 ? 'negocio' : 'negocios'}</span></div></div>
                    <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 12.5, color: R.inkSoft, marginBottom: 6 }}>Sin destacar</div><div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 22, color: R.ink }}>{sinDestacar} <span style={{ fontSize: 13, fontWeight: 600, color: R.inkFaint }}>{sinDestacar === 1 ? 'negocio' : 'negocios'}</span></div></div>
                  </div>
                </Card>

                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Top negocios por reservas */}
                  <div style={{ flex: '1 1 360px', minWidth: 320 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Negocios con más reservas</span>
                      <button onClick={() => setView('negocios')} style={{ background: 'none', border: 'none', fontFamily: R.ui, fontWeight: 700, fontSize: 13, color: R.coral, cursor: 'pointer' }}>Ver todos →</button>
                    </div>
                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                      {topBizes.map((b, i) => (
                        <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(140deg, ${b.grad[0]}, ${b.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', fontSize: 13, flexShrink: 0 }}>{b.mono}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                            <div style={{ fontSize: 12, color: R.inkSoft }}>{b.cat} · {b.mun}</div>
                          </div>
                          <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 14, color: R.ink, flexShrink: 0 }}>{bizReservas(b)}</span>
                        </div>
                      ))}
                    </Card>
                  </div>

                  {/* Próximas reservas */}
                  <div style={{ flex: '1 1 360px', minWidth: 320 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Próximas reservas</span>
                      <button onClick={() => setView('reservas')} style={{ background: 'none', border: 'none', fontFamily: R.ui, fontWeight: 700, fontSize: 13, color: R.coral, cursor: 'pointer' }}>Ver todas →</button>
                    </div>
                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                      {nextReservas.map((r, i) => {
                        const [tc, tb] = RES_COLOR[r.estado]
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                            <div style={{ width: 64, flexShrink: 0, fontFamily: R.display, fontWeight: 700, fontSize: 12.5, color: R.ink }}>{r.cuando}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13.5, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.guest} · {r.biz}</div>
                              <div style={{ fontSize: 12, color: R.inkSoft }}>{r.party} personas · {r.via}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: tc, background: tb, padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>{r.estado}</span>
                          </div>
                        )
                      })}
                    </Card>
                  </div>
                </div>

                {/* Accesos rápidos */}
                <div style={{ marginTop: 22 }}>
                  <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, marginBottom: 12 }}>Accesos rápidos</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    {[
                      { v: 'negocios', icon: 'plus', label: 'Agregar negocio', sub: 'Alta de negocio nuevo' },
                      { v: 'moderacion', icon: 'flag', label: 'Moderación', sub: `${pendingMod} pendientes` },
                      { v: 'soporte', icon: 'chat', label: 'Soporte', sub: `${pendingTickets} abiertos` },
                      { v: 'integraciones', icon: 'link', label: 'Integraciones', sub: 'IA, lealtad, pagos' },
                    ].filter(q => adminRole === 'super_admin' || q.v !== 'integraciones').map(q => (
                      <button key={q.v} onClick={() => setView(q.v)} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', textAlign: 'left', background: R.surface, border: `1px solid ${R.line}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', fontFamily: R.ui }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: R.bgAlt, display: 'grid', placeItems: 'center' }}><Icon n={q.icon} size={16} color={R.ink} /></div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: R.ink }}>{q.label}</div>
                          <div style={{ fontSize: 11.5, color: R.inkSoft }}>{q.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )
          })()}

          {view === 'destacados' && (
            <>
              <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                <KPI label="Ingreso por Destacados (mes)" value={fmt(featuredMonth)} sub={`${featuredActive} ${featuredActive === 1 ? 'campaña activa' : 'campañas activas'}`} tint={R.coralTint} icon={<Icon n="coins" size={20} color={R.coral} />} />
                <KPI label="Ocupación de cupos" value={`${featOcc}%`} sub={`${featSoldTotal} de ${featCapTotal} vendidos`} tint={R.jadeTint} icon={<Icon n="spark" size={20} color={R.jade} />} />
                <KPI label="En lista de espera" value={`${featTotals.waitlist}`} sub="activos sin cupo" tint={R.amberTint} icon={<Icon n="clock" size={20} color={R.amber} />} />
              </div>
              <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, marginBottom: 12 }}>Inventario por categoría × municipio</div>
              <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 26 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 70px 64px', gap: 14, padding: '12px 18px', borderBottom: `1px solid ${R.line}`, background: R.bgAlt, fontSize: 11.5, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  <span>Categoría · Municipio</span><span>★ Premium</span><span>✦ Destacado</span><span style={{ textAlign: 'right' }}>Espera</span><span style={{ textAlign: 'right' }}>Cupos</span>
                </div>
                {featInventory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: R.inkSoft, fontSize: 14 }}>
                    {featured ? 'Aún no hay negocios destacados ni cupos configurados.' : 'Cargando inventario…'}
                  </div>
                ) : featInventory.map((r, i) => {
                  const k = `${r.categoria}|||${r.municipio}`
                  const editing = capEdit === k
                  return (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 70px 64px', gap: 14, alignItems: 'center', padding: '14px 18px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                      <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14, color: R.ink }}>{r.categoria}</div><div style={{ fontSize: 12.5, color: R.inkSoft }}>{r.municipio}</div></div>
                      {editing ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: R.ink }}>{r.premiumSold}/</span><input type="number" min={0} value={capDraft.premium} onChange={e => setCapDraft(d => ({ ...d, premium: Math.max(0, Number(e.target.value) || 0) }))} style={{ width: 46, border: `1px solid ${R.line}`, borderRadius: 8, padding: '5px 6px', fontFamily: R.ui, fontSize: 13, color: R.ink, outline: 'none' }} /></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: R.ink }}>{r.destacadoSold}/</span><input type="number" min={0} value={capDraft.destacado} onChange={e => setCapDraft(d => ({ ...d, destacado: Math.max(0, Number(e.target.value) || 0) }))} style={{ width: 46, border: `1px solid ${R.line}`, borderRadius: 8, padding: '5px 6px', fontFamily: R.ui, fontSize: 13, color: R.ink, outline: 'none' }} /></div>
                          <span style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 700, color: r.waitlist ? R.amberDeep : R.inkFaint }}>{r.waitlist || '—'}</span>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => saveCap(r.categoria, r.municipio, capDraft.premium, capDraft.destacado)} aria-label="Guardar" style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: R.jade, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon n="check" size={14} color="#fff" stroke={3} /></button>
                            <button onClick={() => setCapEdit(null)} aria-label="Cancelar" style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${R.line}`, background: R.surface, cursor: 'pointer', color: R.inkSoft, fontSize: 15, lineHeight: 1 }}>×</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Bar sold={r.premiumSold} total={r.premiumCap} color={R.amber} />
                          <Bar sold={r.destacadoSold} total={r.destacadoCap} color={R.coral} />
                          <span style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 700, color: r.waitlist ? R.amberDeep : R.inkFaint }}>{r.waitlist || '—'}</span>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {canWriteUI('featured') && (
                              <button onClick={() => { setCapDraft({ premium: r.premiumCap, destacado: r.destacadoCap }); setCapEdit(k) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 12.5, color: R.coral }}>Editar</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </Card>
              <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, marginBottom: 12 }}>Negocios destacados ahora</div>
              {featActive.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '32px 0', color: R.inkSoft, fontSize: 14 }}>
                  {featured ? 'Ningún negocio tiene un Destacado vigente. Cuando un negocio compre una campaña, aparecerá aquí.' : 'Cargando campañas…'}
                </Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {featActive.map(a => {
                    const nc = nivColor(a.nivel)
                    return (
                      <Card key={a.id} style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(140deg, ${a.grad[0]}, ${a.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{a.mono}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15.5, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.biz}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: nc.press, background: nc.tint, padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>{nc.badge}</span>
                          </div>
                          <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 2 }}>{a.cat} · {a.mun}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
                            <span style={{ fontSize: 12.5, color: R.ink }}>Destaca: <strong style={{ fontWeight: 700 }}>{a.que}</strong></span>
                            <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 14, color: nc.press }}>{a.amount ? fmt(a.amount) : '—'}</span>
                          </div>
                          <div style={{ fontSize: 12, color: R.inkFaint, marginTop: 4 }}>{a.dias === null ? 'Sin fecha de expiración' : `${a.dias} ${a.dias === 1 ? 'día restante' : 'días restantes'}`} · en rotación</div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {view === 'ingresos' && (() => {
            const t = revenue?.totals
            const feat = t?.byType?.featured ?? { count: 0, gross: 0, revenue: 0 }
            const dep = t?.byType?.deposit ?? { count: 0, gross: 0, revenue: 0 }
            const sub = t?.byType?.subscription
            const rate = Math.round((t?.commissionRate ?? 0.02) * 100)
            const money2 = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            const conceptOf = (ty: string) => ty === 'featured' ? 'Destacado' : ty === 'deposit' ? 'Depósito' : ty === 'subscription' ? 'Suscripción' : ty
            const allPays = revenue?.payments ?? []
            const payRows = allPays.filter(p =>
              revFilter === 'Todos' ? true : revFilter === 'Destacados' ? p.type === 'featured' : p.type === 'deposit')
            return (
              <>
                <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
                  <KPI label="Ingreso de Reva (total)" value={fmt(Math.round(t?.platform ?? 0))} sub={`${t?.count ?? 0} pagos cobrados`} tint={R.coralTint} icon={<Icon n="coins" size={20} color={R.coral} />} />
                  <KPI label="Ingreso de Reva (este mes)" value={fmt(Math.round(t?.platformMonth ?? 0))} sub="destacados + comisiones" tint={R.jadeTint} icon={<Icon n="chart" size={20} color={R.jade} />} />
                  <KPI label="Volumen procesado (GMV)" value={fmt(Math.round(t?.gmv ?? 0))} sub="total movido por el sistema" tint={R.amberTint} icon={<Icon n="spark" size={20} color={R.amber} />} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 26 }}>
                  <Card style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '3px 8px', borderRadius: 999 }}>✦ Destacados</span>
                      <span style={{ fontSize: 12.5, color: R.inkSoft }}>{feat.count} pagos</span>
                    </div>
                    <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 24, color: R.ink }}>{fmt(Math.round(feat.revenue))}</div>
                    <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 4 }}>El negocio paga el 100% a Reva.</div>
                  </Card>
                  <Card style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: R.jade, background: R.jadeTint, padding: '3px 8px', borderRadius: 999 }}>Comisión de depósitos</span>
                      <span style={{ fontSize: 12.5, color: R.inkSoft }}>{dep.count} pagos</span>
                    </div>
                    <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 24, color: R.ink }}>{fmt(Math.round(dep.revenue))}</div>
                    <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 4 }}>{rate}% de {money2(dep.gross)} en depósitos. El resto va al negocio.</div>
                  </Card>
                  {sub && sub.count > 0 && (
                    <Card style={{ padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: R.inkSoft, background: R.bgAlt, padding: '3px 8px', borderRadius: 999 }}>Suscripciones</span>
                        <span style={{ fontSize: 12.5, color: R.inkSoft }}>{sub.count} pagos</span>
                      </div>
                      <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 24, color: R.ink }}>{fmt(Math.round(sub.revenue))}</div>
                      <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 4 }}>Planes cobrados a negocios.</div>
                    </Card>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, marginRight: 'auto' }}>Transacciones</div>
                  <Chips options={['Todos', 'Destacados', 'Depósitos']} value={revFilter} onChange={v => setRevFilter(v as typeof revFilter)} />
                </div>
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr', gap: 14, padding: '12px 18px', borderBottom: `1px solid ${R.line}`, background: R.bgAlt, fontSize: 11.5, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    <span>Cuándo</span><span>Negocio</span><span>Concepto</span><span style={{ textAlign: 'right' }}>Monto</span><span style={{ textAlign: 'right' }}>Ingreso Reva</span>
                  </div>
                  {payRows.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: R.inkSoft, fontSize: 14 }}>
                      {revLoaded ? 'Aún no hay pagos registrados. Cuando un negocio compre un Destacado o un cliente pague un depósito, aparecerá aquí.' : 'Cargando ingresos…'}
                    </div>
                  ) : payRows.map((p, i) => (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr', gap: 14, alignItems: 'center', padding: '13px 18px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                      <span style={{ fontSize: 13, color: R.inkSoft }}>{new Date(p.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(140deg, ${p.grad[0]}, ${p.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', fontSize: 13, flexShrink: 0 }}>{p.mono}</div>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.biz_name}</span>
                      </div>
                      <span><span style={{ fontSize: 11, fontWeight: 700, color: p.type === 'featured' ? R.coralPress : R.jade, background: p.type === 'featured' ? R.coralTint : R.jadeTint, padding: '3px 9px', borderRadius: 999 }}>{conceptOf(p.type)}</span></span>
                      <span style={{ textAlign: 'right', fontSize: 13.5, color: R.inkSoft }}>{money2(p.amount)}</span>
                      <span style={{ textAlign: 'right', fontFamily: R.display, fontWeight: 700, fontSize: 13.5, color: R.ink }}>{money2(p.revenue)}</span>
                    </div>
                  ))}
                </Card>
              </>
            )
          })()}

          {view === 'negocios' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <SearchBox value={bq} onChange={setBq} placeholder="Buscar negocio…" />
                <Chips options={['Todos', 'Activo', 'Pausado']} value={bf} onChange={setBf} />
                {canWriteUI('businesses') && (
                  <button onClick={() => setAddBizOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', padding: '10px 16px', border: 'none', borderRadius: 12, background: R.ink, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>
                    <Icon n="plus" size={15} color="#fff" /> Agregar negocio
                  </button>
                )}
              </div>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr 0.8fr 1fr 0.9fr', gap: 14, padding: '12px 18px', borderBottom: `1px solid ${R.line}`, background: R.bgAlt, fontSize: 11.5, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  <span>Negocio</span><span>Categoría · Municipio</span><span>Plan</span><span>Destacado</span><span style={{ textAlign: 'right' }}>Estado</span>
                </div>
                {bizRows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: R.inkSoft, fontSize: 14 }}>Sin resultados.</div>
                ) : bizRows.map(({ b, idx }, i) => (
                  <div key={idx} onClick={() => setSelBiz(idx)} style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr 0.8fr 1fr 0.9fr', gap: 14, alignItems: 'center', padding: '13px 18px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(140deg, ${b.grad[0]}, ${b.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', fontSize: 14, flexShrink: 0 }}>{b.mono}</div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                    </div>
                    <span style={{ fontSize: 13, color: R.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.cat} · {b.mun}</span>
                    <span style={{ fontSize: 13, color: R.ink }}>{b.plan}</span>
                    <span>{b.dest === '—' ? <span style={{ color: R.inkFaint, fontSize: 13 }}>—</span> : <span style={{ fontSize: 10.5, fontWeight: 700, color: nivColor(b.dest as Niv).press, background: nivColor(b.dest as Niv).tint, padding: '3px 8px', borderRadius: 999 }}>{nivColor(b.dest as Niv).badge}</span>}</span>
                    <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: b.estado === 'Activo' ? R.jade : R.inkFaint }}>● {b.estado}</span>
                  </div>
                ))}
              </Card>
            </>
          )}

          {view === 'reservas' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <SearchBox value={rq} onChange={setRq} placeholder="Buscar por cliente o negocio…" />
                <Chips options={['Todas', 'Confirmada', 'Sentados', 'Por confirmar', 'Cancelada']} value={rf} onChange={setRf} />
              </div>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.4fr 0.8fr 1fr', gap: 14, padding: '12px 18px', borderBottom: `1px solid ${R.line}`, background: R.bgAlt, fontSize: 11.5, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  <span>Cuándo</span><span>Cliente</span><span>Negocio</span><span>Personas</span><span style={{ textAlign: 'right' }}>Estado</span>
                </div>
                {resRows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: R.inkSoft, fontSize: 14 }}>Sin resultados.</div>
                ) : resRows.map((r, i) => {
                  const [tc, tb] = RES_COLOR[r.estado]
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.4fr 0.8fr 1fr', gap: 14, alignItems: 'center', padding: '13px 18px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                      <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 13.5, color: R.ink }}>{r.cuando}</span>
                      <span style={{ fontSize: 13.5, color: R.ink }}>{r.guest} <span style={{ color: R.inkFaint, fontSize: 11.5 }}>· {r.via}</span></span>
                      <span style={{ fontSize: 13, color: R.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.biz}</span>
                      <span style={{ fontSize: 13, color: R.ink }}>{r.party}</span>
                      <span style={{ textAlign: 'right' }}><span style={{ fontSize: 11.5, fontWeight: 700, color: tc, background: tb, padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>{r.estado}</span></span>
                    </div>
                  )
                })}
              </Card>
            </>
          )}

          {view === 'moderacion' && (
            <>
              <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
                <KPI label="Pendientes de revisar" value={`${modQueue.length}`} sub="contenido destacado" tint={R.amberTint} icon={<Icon n="flag" size={20} color={R.amber} />} />
                <KPI label="Aprobadas hoy" value={`${resolved.aprobadas}`} tint={R.jadeTint} icon={<Icon n="check" size={20} color={R.jade} />} />
                <KPI label="Rechazadas hoy" value={`${resolved.rechazadas}`} tint={R.coralTint} icon={<Icon n="x" size={20} color={R.coral} />} />
              </div>
              <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 14 }}>Antes de mostrar un Destacado, revisa que el contenido sea honesto, real y apropiado.</div>
              {modQueue.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '44px 0', color: R.inkSoft }}>
                  <Icon n="check" size={28} color={R.jade} stroke={2.4} /> <div style={{ marginTop: 8 }}>Todo revisado. Sin contenido pendiente.</div>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {modQueue.map(m => {
                    const nc = nivColor(m.nivel)
                    return (
                      <Card key={m.id} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(140deg, ${m.grad[0]}, ${m.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.mono}</div>
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15.5, color: R.ink }}>{m.biz}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: nc.press, background: nc.tint, padding: '3px 8px', borderRadius: 999 }}>{nc.badge}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: R.inkSoft, background: R.bgAlt, padding: '3px 8px', borderRadius: 999 }}>{m.tipo}</span>
                          </div>
                          <div style={{ fontSize: 13, color: R.ink, marginTop: 5 }}>Quiere destacar: <strong style={{ fontWeight: 700 }}>{m.que}</strong></div>
                          <div style={{ fontSize: 12, color: R.inkFaint, marginTop: 2 }}>Enviado {m.enviado}</div>
                        </div>
                        {canWriteUI('moderation') ? (
                          <div style={{ display: 'flex', gap: 9, flexShrink: 0 }}>
                            <button onClick={() => moderate(m.id, false)} style={{ padding: '10px 16px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, color: R.coralPress }}>Rechazar</button>
                            <button onClick={() => moderate(m.id, true)} style={{ padding: '10px 16px', border: 'none', borderRadius: 12, background: R.jade, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}><Icon n="check" size={15} color="#fff" stroke={3} /> Aprobar</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: R.inkFaint, background: R.bgAlt, padding: '6px 12px', borderRadius: 999, flexShrink: 0 }}>Solo lectura</span>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {view === 'informes' && (() => {
            const money = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            const dateShort = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) }
            const badge = (txt: string, color: string, bg: string) => <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>{txt}</span>
            const monoAvatar = (mono: string, grad: [string, string]) => <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(140deg, ${grad[0]}, ${grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', fontSize: 12, flexShrink: 0 }}>{mono}</div>
            const nameCell = (name: string, mono: string, grad: [string, string]) => <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>{monoAvatar(mono, grad)}<span style={{ fontWeight: 600, fontSize: 13.5, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span></div>
            const txt = (v: ReactNode, style?: CSSProperties) => <span style={{ fontSize: 13, color: R.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...style }}>{v}</span>
            // Celdas alineadas a la derecha (helpers en vez de JSX suelto en arrays).
            const rt = (v: ReactNode, style?: CSSProperties) => <span style={{ textAlign: 'right', display: 'block', fontSize: 13, color: R.ink, whiteSpace: 'nowrap', ...style }}>{v}</span>
            const rtNum = (v: ReactNode) => rt(v, { fontFamily: R.display, fontWeight: 700, fontSize: 13.5 })
            const bold = (v: ReactNode) => <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 13.5, color: R.ink }}>{v}</span>

            const STATUS_LABEL: Record<string, string> = { nuevo: 'Nuevo', en_progreso: 'En progreso', resuelto: 'Resuelto' }
            const ROVE_LABEL: Record<string, string> = { pending: 'En revisión', active: 'Activa', paused: 'Pausada', rejected: 'Rechazada' }

            // Definiciones de cada reporte (columnas, filtros, filas y KPIs) desde datos reales.
            const REPORTS: Record<ReportKey, ReportDef> = {
              negocios: {
                columns: [{ label: 'Negocio' }, { label: 'Categoría' }, { label: 'Municipio' }, { label: 'Plan' }, { label: 'Destacado' }, { label: 'Reservas', align: 'right' }, { label: 'Estado', align: 'right' }],
                filters: ['Todos', 'Activo', 'Pausado'],
                kpis: [
                  { label: 'Negocios totales', value: `${bizes.length}`, tint: R.coralTint, icon: <Icon n="grid" size={20} color={R.coral} /> },
                  { label: 'Activos', value: `${bizes.filter(b => b.estado === 'Activo').length}`, tint: R.jadeTint, icon: <Icon n="check" size={20} color={R.jade} /> },
                  { label: 'Destacados vigentes', value: `${featuredActive}`, tint: R.amberTint, icon: <Icon n="spark" size={20} color={R.amber} /> },
                ],
                rows: bizes.map(b => {
                  const n = bizReservas(b)
                  return {
                    search: `${b.name} ${b.cat} ${b.mun} ${b.dest}`.toLowerCase(),
                    filter: b.estado,
                    cells: [
                      nameCell(b.name, b.mono, b.grad), txt(b.cat), txt(b.mun), txt(b.plan),
                      b.dest === '—' ? txt('—') : badge(nivColor(b.dest as Niv).badge, nivColor(b.dest as Niv).press, nivColor(b.dest as Niv).tint),
                      rtNum(n),
                      rt(`● ${b.estado}`, { fontSize: 12, fontWeight: 700, color: b.estado === 'Activo' ? R.jade : R.inkFaint }),
                    ],
                    csv: [b.name, b.cat, b.mun, b.plan, b.dest === '—' ? '' : b.dest, n, b.estado],
                  }
                }),
              },
              reservas: {
                columns: [{ label: 'Cuándo' }, { label: 'Cliente' }, { label: 'Negocio' }, { label: 'Vía' }, { label: 'Personas', align: 'right' }, { label: 'Estado', align: 'right' }],
                filters: ['Todos', 'Confirmada', 'Sentados', 'Por confirmar', 'Cancelada'],
                kpis: [
                  { label: 'Reservas listadas', value: `${reservasList.length}`, tint: R.coralTint, icon: <Icon n="cal" size={20} color={R.coral} /> },
                  { label: 'Confirmadas', value: `${reservasList.filter(r => r.estado === 'Confirmada').length}`, tint: R.jadeTint, icon: <Icon n="check" size={20} color={R.jade} /> },
                  { label: 'Canceladas', value: `${reservasList.filter(r => r.estado === 'Cancelada').length}`, tint: R.amberTint, icon: <Icon n="x" size={20} color={R.amber} /> },
                ],
                rows: reservasList.map(r => ({
                  search: `${r.guest} ${r.biz} ${r.via} ${r.estado}`.toLowerCase(),
                  filter: r.estado,
                  cells: [
                    bold(r.cuando),
                    txt(r.guest, { color: R.ink }), txt(r.biz), txt(r.via),
                    rt(r.party),
                    rt(badge(r.estado, RES_COLOR[r.estado][0], RES_COLOR[r.estado][1])),
                  ],
                  csv: [r.cuando, r.guest, r.biz, r.via, r.party, r.estado],
                })),
              },
              ingresos: (() => {
                const pays = revenue?.payments ?? []
                const conceptOf = (ty: string) => ty === 'featured' ? 'Destacado' : ty === 'deposit' ? 'Depósito' : ty === 'subscription' ? 'Suscripción' : ty
                return {
                  columns: [{ label: 'Fecha' }, { label: 'Negocio' }, { label: 'Concepto' }, { label: 'Monto', align: 'right' }, { label: 'Ingreso Reva', align: 'right' }],
                  filters: ['Todos', 'Destacado', 'Depósito', 'Suscripción'],
                  kpis: [
                    { label: 'Ingreso Reva (total)', value: fmt(Math.round(revenue?.totals.platform ?? 0)), tint: R.coralTint, icon: <Icon n="coins" size={20} color={R.coral} /> },
                    { label: 'GMV procesado', value: fmt(Math.round(revenue?.totals.gmv ?? 0)), tint: R.jadeTint, icon: <Icon n="chart" size={20} color={R.jade} /> },
                    { label: 'Pagos cobrados', value: `${revenue?.totals.count ?? 0}`, tint: R.amberTint, icon: <Icon n="card" size={20} color={R.amber} /> },
                  ],
                  rows: pays.map(p => ({
                    search: `${p.biz_name} ${conceptOf(p.type)} ${p.guest_name ?? ''}`.toLowerCase(),
                    filter: conceptOf(p.type),
                    cells: [
                      txt(dateShort(p.created_at)), nameCell(p.biz_name, p.mono, p.grad),
                      badge(conceptOf(p.type), p.type === 'featured' ? R.coralPress : R.jade, p.type === 'featured' ? R.coralTint : R.jadeTint),
                      rt(money(p.amount), { color: R.inkSoft, fontSize: 13.5 }),
                      rtNum(money(p.revenue)),
                    ],
                    csv: [dateShort(p.created_at), p.biz_name, conceptOf(p.type), p.amount, p.revenue],
                  })),
                }
              })(),
              destacados: {
                columns: [{ label: 'Negocio' }, { label: 'Categoría' }, { label: 'Municipio' }, { label: 'Nivel' }, { label: 'Contenido' }, { label: 'Días', align: 'right' }, { label: 'Monto', align: 'right' }],
                filters: ['Todos', 'Premium', 'Destacado'],
                kpis: [
                  { label: 'Campañas vigentes', value: `${featActive.length}`, tint: R.coralTint, icon: <Icon n="spark" size={20} color={R.coral} /> },
                  { label: 'Ocupación de cupos', value: `${featOcc}%`, tint: R.jadeTint, icon: <Icon n="chart" size={20} color={R.jade} /> },
                  { label: 'Ingreso destacados', value: fmt(Math.round(revenue?.totals.byType?.featured?.revenue ?? 0)), tint: R.amberTint, icon: <Icon n="coins" size={20} color={R.amber} /> },
                ],
                rows: featActive.map(f => ({
                  search: `${f.biz} ${f.cat} ${f.mun} ${f.nivel} ${f.que}`.toLowerCase(),
                  filter: f.nivel,
                  cells: [
                    nameCell(f.biz, f.mono, f.grad), txt(f.cat), txt(f.mun),
                    badge(nivColor(f.nivel).badge, nivColor(f.nivel).press, nivColor(f.nivel).tint), txt(f.que, { color: R.ink }),
                    rt(f.dias ?? '—'),
                    rtNum(fmt(Math.round(f.amount))),
                  ],
                  csv: [f.biz, f.cat, f.mun, f.nivel, f.que, f.dias ?? '', Math.round(f.amount)],
                })),
              },
              moderacion: {
                columns: [{ label: 'Negocio' }, { label: 'Nivel' }, { label: 'Tipo' }, { label: 'Contenido' }, { label: 'Enviado', align: 'right' }],
                filters: ['Todos', 'Servicio', 'Negocio', 'Promoción'],
                kpis: [
                  { label: 'En cola', value: `${modQueue.length}`, tint: R.amberTint, icon: <Icon n="flag" size={20} color={R.amber} /> },
                  { label: 'Aprobadas hoy', value: `${resolved.aprobadas}`, tint: R.jadeTint, icon: <Icon n="check" size={20} color={R.jade} /> },
                  { label: 'Rechazadas hoy', value: `${resolved.rechazadas}`, tint: R.coralTint, icon: <Icon n="x" size={20} color={R.coral} /> },
                ],
                rows: modQueue.map(m => ({
                  search: `${m.biz} ${m.nivel} ${m.tipo} ${m.que}`.toLowerCase(),
                  filter: m.tipo,
                  cells: [
                    nameCell(m.biz, m.mono, m.grad), badge(nivColor(m.nivel).badge, nivColor(m.nivel).press, nivColor(m.nivel).tint),
                    badge(m.tipo, R.inkSoft, R.bgAlt), txt(m.que, { color: R.ink }),
                    rt(m.enviado, { fontSize: 12.5, color: R.inkFaint }),
                  ],
                  csv: [m.biz, m.nivel, m.tipo, m.que, m.enviado],
                })),
              },
              soporte: {
                columns: [{ label: 'Usuario' }, { label: 'Ciudad' }, { label: 'Modo' }, { label: 'Asunto' }, { label: 'Recibido' }, { label: 'Estado', align: 'right' }],
                filters: ['Todos', 'Nuevo', 'En progreso', 'Resuelto'],
                kpis: [
                  { label: 'Tickets totales', value: `${tickets.length}`, tint: R.coralTint, icon: <Icon n="chat" size={20} color={R.coral} /> },
                  { label: 'Nuevos', value: `${tickets.filter(t => t.status === 'nuevo').length}`, tint: R.amberTint, icon: <Icon n="bell" size={20} color={R.amber} /> },
                  { label: 'Resueltos', value: `${tickets.filter(t => t.status === 'resuelto').length}`, tint: R.jadeTint, icon: <Icon n="check" size={20} color={R.jade} /> },
                ],
                rows: tickets.map(t => {
                  const sc = t.status === 'resuelto' ? [R.jade, R.jadeTint] : t.status === 'en_progreso' ? [R.amberDeep, R.amberTint] : [R.coralPress, R.coralTint]
                  return {
                    search: `${t.user} ${t.city} ${t.mode} ${t.issue}`.toLowerCase(),
                    filter: STATUS_LABEL[t.status] ?? t.status,
                    cells: [
                      txt(t.user, { color: R.ink, fontWeight: 600 }), txt(t.city), txt(t.mode), txt(t.issue, { color: R.ink }), txt(t.time),
                      rt(badge(STATUS_LABEL[t.status] ?? t.status, sc[0], sc[1])),
                    ],
                    csv: [t.user, t.city, t.mode, t.issue, t.time, STATUS_LABEL[t.status] ?? t.status],
                  }
                }),
              },
              rove: {
                columns: [{ label: 'Recompensa' }, { label: 'Negocio' }, { label: 'Categoría' }, { label: 'Costo', align: 'right' }, { label: 'Stock', align: 'right' }, { label: 'Estado', align: 'right' }],
                filters: ['Todos', 'En revisión', 'Activa', 'Pausada', 'Rechazada'],
                kpis: [
                  { label: 'Recompensas', value: `${roveRewards.length}`, tint: R.coralTint, icon: <Icon n="ticket" size={20} color={R.coral} /> },
                  { label: 'Activas', value: `${roveRewards.filter(r => r.status === 'active').length}`, tint: R.jadeTint, icon: <Icon n="check" size={20} color={R.jade} /> },
                  { label: 'En revisión', value: `${roveRewards.filter(r => r.status === 'pending').length}`, tint: R.amberTint, icon: <Icon n="clock" size={20} color={R.amber} /> },
                ],
                rows: roveRewards.map(r => {
                  const meta = ROVE_STATUS_META[r.status]
                  return {
                    search: `${r.title} ${r.bizName} ${r.category} ${ROVE_LABEL[r.status] ?? r.status}`.toLowerCase(),
                    filter: ROVE_LABEL[r.status] ?? r.status,
                    cells: [
                      txt(r.title, { color: R.ink, fontWeight: 600 }),
                      nameCell(r.bizName, r.bizLetter, [r.bizColor, r.bizColor]),
                      txt(`${ROVE_CAT_EMOJI[r.category] ?? ''} ${r.category}`),
                      rtNum(`${r.ticketCost} 🎟️`),
                      rt(r.stock ?? '∞'),
                      rt(badge(meta?.label ?? r.status, meta?.color ?? R.inkSoft, meta?.bg ?? R.bgAlt)),
                    ],
                    csv: [r.title, r.bizName, r.category, r.ticketCost, r.stock ?? 'ilimitado', ROVE_LABEL[r.status] ?? r.status],
                  }
                }),
              },
            }

            const REPORT_TABS: { key: ReportKey; label: string; icon: string }[] = [
              { key: 'negocios', label: 'Negocios', icon: 'grid' },
              { key: 'reservas', label: 'Reservas', icon: 'cal' },
              { key: 'ingresos', label: 'Ingresos', icon: 'coins' },
              { key: 'destacados', label: 'Destacados', icon: 'spark' },
              { key: 'moderacion', label: 'Moderación', icon: 'flag' },
              { key: 'soporte', label: 'Soporte', icon: 'chat' },
              { key: 'rove', label: 'Reva+ Rewards', icon: 'ticket' },
            ]

            const def = REPORTS[repType]
            const q = repQuery.trim().toLowerCase()
            const filtered = def.rows.filter(row =>
              (repFilter === 'Todos' || row.filter === repFilter) && (!q || row.search.includes(q)))
            const activeTab = REPORT_TABS.find(t => t.key === repType)!
            const gridCols = def.columns.map(c => c.align ? '0.9fr' : '1.3fr').join(' ')

            function exportReport() {
              const headers = def.columns.map(c => c.label)
              const rows = filtered.map(r => r.csv)
              const stamp = new Date().toISOString().slice(0, 10)
              downloadCSV(`reva-informe-${repType}-${stamp}.csv`, headers, rows)
            }

            return (
              <>
                {/* Selector de reporte por módulo */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {REPORT_TABS.map(t => {
                    const on = t.key === repType
                    return (
                      <button key={t.key} onClick={() => { setRepType(t.key); setRepFilter('Todos'); setRepQuery('') }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, color: on ? R.coralPress : R.inkSoft, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
                        <Icon n={t.icon} size={16} color={on ? R.coralPress : R.inkFaint} /> {t.label}
                      </button>
                    )
                  })}
                </div>

                {/* KPIs del reporte activo */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                  {def.kpis.map((k, i) => <KPI key={i} label={k.label} value={k.value} tint={k.tint} icon={k.icon} />)}
                </div>

                {/* Buscador + filtros + descarga */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <SearchBox value={repQuery} onChange={setRepQuery} placeholder={`Buscar en ${activeTab.label.toLowerCase()}…`} />
                  <Chips options={def.filters} value={repFilter} onChange={setRepFilter} />
                  <button onClick={exportReport} disabled={filtered.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', padding: '10px 16px', border: 'none', borderRadius: 12, background: filtered.length === 0 ? R.bgAlt : R.ink, color: filtered.length === 0 ? R.inkFaint : '#fff', cursor: filtered.length === 0 ? 'default' : 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>
                    <Icon n="download" size={16} color={filtered.length === 0 ? R.inkFaint : '#fff'} /> Descargar CSV
                  </button>
                </div>

                <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 10 }}>
                  {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}{filtered.length !== def.rows.length ? ` de ${def.rows.length}` : ''} · el CSV incluye solo lo filtrado
                </div>

                {/* Tabla del reporte */}
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: def.columns.length * 130 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 14, padding: '12px 18px', borderBottom: `1px solid ${R.line}`, background: R.bgAlt, fontSize: 11.5, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                        {def.columns.map((c, i) => <span key={i} style={{ textAlign: c.align ?? 'left' }}>{c.label}</span>)}
                      </div>
                      {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: R.inkSoft, fontSize: 14 }}>
                          {def.rows.length === 0 ? 'Aún no hay datos para este reporte.' : 'Sin resultados para tu búsqueda.'}
                        </div>
                      ) : filtered.map((row, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 14, alignItems: 'center', padding: '13px 18px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                          {row.cells.map((cell, j) => <div key={j} style={{ minWidth: 0 }}>{cell}</div>)}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            )
          })()}

          {view === 'soporte' && (() => {
            const ticket = tickets.find(t => t.id === selTicket) ?? null
            const newCount = tickets.filter(t => t.status === 'nuevo').length
            const progCount = tickets.filter(t => t.status === 'en_progreso').length
            const doneCount = tickets.filter(t => t.status === 'resuelto').length
            const stColor = (s: Ticket['status']) => s === 'nuevo' ? [R.coral, R.coralTint] : s === 'en_progreso' ? [R.amberDeep, R.amberTint] : [R.jade, R.jadeTint]
            const stLabel = (s: Ticket['status']) => s === 'nuevo' ? 'Nuevo' : s === 'en_progreso' ? 'En progreso' : 'Resuelto'

            function sendReply() {
              if (!replyText.trim() || !selTicket) return
              const txt = replyText.trim()
              setTickets(prev => prev.map(t => t.id === selTicket
                ? { ...t, status: 'en_progreso', thread: [...t.thread, { from: 'agent', txt, time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }] }
                : t
              ))
              setReplyText('')
              // Persiste la respuesta en la base (agrega al hilo + marca en_progreso).
              fetch('/api/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selTicket, txt }) }).catch(() => {})
            }
            // Cambia el estado del ticket y lo persiste en la base.
            function setTicketStatus(id: string, status: Ticket['status']) {
              setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
              fetch('/api/admin/support', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }).catch(() => {})
            }

            return ticket ? (
              // ── Ticket detail — two-column layout ──
              <div>
                <button onClick={() => setSelTicket(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: R.inkSoft, fontFamily: R.ui, fontSize: 13.5, fontWeight: 600, marginBottom: 18 }}>
                  <Icon n="back" size={16} color={R.inkSoft} /> Volver a tickets
                </button>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

                  {/* ── Left: conversation ── */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Card style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 16 }}>{ticket.id}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: ticket.mode === 'Explorer' ? R.coralPress : R.jade, background: ticket.mode === 'Explorer' ? R.coralTint : R.jadeTint, padding: '3px 9px', borderRadius: 999 }}>{ticket.mode}</span>
                          </div>
                          <div style={{ fontSize: 14.5, color: R.ink, fontWeight: 600 }}>{ticket.issue}</div>
                          <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 4 }}>{ticket.user} · {ticket.city} · {ticket.time}</div>
                        </div>

                        {/* Status selector */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.07em' }}>Estatus</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: stColor(ticket.status)[0], flexShrink: 0 }} />
                            {canWriteUI('support') ? (
                              <>
                                <select
                                  value={ticket.status}
                                  onChange={e => setTicketStatus(ticket.id, e.target.value as Ticket['status'])}
                                  style={{ border: `1px solid ${R.line}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, fontFamily: R.ui, fontWeight: 600, color: stColor(ticket.status)[0], background: stColor(ticket.status)[1], cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none', paddingRight: 28 }}>
                                  <option value="nuevo">Nuevo</option>
                                  <option value="en_progreso">En progreso</option>
                                  <option value="resuelto">Resuelto</option>
                                </select>
                                <span style={{ marginLeft: -26, pointerEvents: 'none', display: 'flex' }}><Icon n="chevron" size={14} color={R.inkFaint} /></span>
                              </>
                            ) : (
                              <span style={{ fontSize: 13.5, fontFamily: R.ui, fontWeight: 600, color: stColor(ticket.status)[0], background: stColor(ticket.status)[1], padding: '8px 12px', borderRadius: 10 }}>{stLabel(ticket.status)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ maxHeight: 400, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {ticket.thread.map((m, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.from === 'user' ? 'flex-start' : 'flex-end', gap: 4 }}>
                            <div style={{ fontSize: 11.5, color: R.inkFaint, fontWeight: 600 }}>{m.from === 'user' ? ticket.user : 'Operador Reva'} · {m.time}</div>
                            <div style={{ maxWidth: '80%', padding: '11px 14px', borderRadius: m.from === 'user' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: m.from === 'user' ? R.bgAlt : R.dusk, color: m.from === 'user' ? R.ink : '#fff', fontSize: 14, lineHeight: 1.45 }}>
                              {m.txt}
                            </div>
                          </div>
                        ))}
                      </div>
                      {ticket.status !== 'resuelto' && canWriteUI('support') && (
                        <div style={{ borderTop: `1px solid ${R.line}`, padding: '14px 18px', display: 'flex', gap: 10 }}>
                          <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()}
                            placeholder="Escribe una respuesta al usuario…"
                            style={{ flex: 1, border: `1px solid ${R.line}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, color: R.ink, fontFamily: R.ui, outline: 'none' }} />
                          <button onClick={sendReply} style={{ padding: '10px 18px', border: 'none', borderRadius: 12, background: R.coral, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>Enviar</button>
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* ── Right: user panel ── */}
                  <div style={{ width: 268, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* User profile card */}
                    <Card style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 46, height: 46, borderRadius: '50%', background: ticket.mode === 'Explorer' ? R.coralTint : R.jadeTint, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, fontSize: 18, color: ticket.mode === 'Explorer' ? R.coral : R.jade, flexShrink: 0 }}>
                          {ticket.user[0]}
                        </div>
                        <div>
                          <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15.5, color: R.ink }}>{ticket.user}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: ticket.mode === 'Explorer' ? R.coralPress : R.jade, background: ticket.mode === 'Explorer' ? R.coralTint : R.jadeTint, padding: '2px 8px', borderRadius: 999 }}>{ticket.mode}</span>
                            <span style={{ fontSize: 12, color: R.inkFaint }}>{ticket.city}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {[
                          { label: 'Email', val: ticket.email },
                          ...(ticket.phone ? [{ label: 'Teléfono', val: ticket.phone }] : []),
                          { label: 'Idioma', val: ticket.lang },
                          { label: 'Miembro desde', val: ticket.memberSince },
                        ].map((row, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                            <span style={{ color: R.inkFaint, fontWeight: 600 }}>{row.label}</span>
                            <span style={{ color: R.ink, fontWeight: 500, textAlign: 'right', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.val}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Stats */}
                    <Card style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Actividad</div>
                      <div style={{ display: 'flex', gap: 0 }}>
                        {[
                          { val: ticket.reservasTotal, label: 'Reservas' },
                          { val: ticket.prevTickets.length, label: 'Tickets prev.' },
                          { val: ticket.mode === 'Vecino' ? '★ Local' : '🌍 Turista', label: 'Perfil' },
                        ].map((s, i) => (
                          <div key={i} style={{ flex: 1, textAlign: 'center', borderLeft: i ? `1px solid ${R.line}` : 'none', padding: '0 8px' }}>
                            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink }}>{s.val}</div>
                            <div style={{ fontSize: 11.5, color: R.inkFaint, marginTop: 2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Historial de tickets */}
                    <Card style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Historial de tickets</div>
                      {ticket.prevTickets.length === 0 ? (
                        <div style={{ fontSize: 13, color: R.inkFaint, fontStyle: 'italic' }}>Sin tickets anteriores</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                          {ticket.prevTickets.map((pt, i) => (
                            <div key={i} style={{ padding: '10px 12px', background: R.bg, borderRadius: 12, border: `1px solid ${R.lineSoft}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: R.inkFaint }}>{pt.id}</span>
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: R.jade, background: R.jadeTint, padding: '1px 7px', borderRadius: 999 }}>{pt.status}</span>
                              </div>
                              <div style={{ fontSize: 12.5, color: R.ink, lineHeight: 1.35 }}>{pt.issue}</div>
                              <div style={{ fontSize: 11, color: R.inkFaint, marginTop: 3 }}>{pt.date}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Acciones rápidas */}
                    <Card style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Acciones</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button onClick={() => navigator.clipboard?.writeText(ticket.email)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', border: `1px solid ${R.line}`, borderRadius: 11, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontSize: 13, color: R.ink, fontWeight: 600, textAlign: 'left' }}>
                          <Icon n="link" size={15} color={R.inkSoft} /> Copiar email
                        </button>
                        <button onClick={() => { setSelTicket(null); setView('reservas') }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', border: `1px solid ${R.line}`, borderRadius: 11, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontSize: 13, color: R.ink, fontWeight: 600, textAlign: 'left' }}>
                          <Icon n="cal" size={15} color={R.inkSoft} /> Ver reservas
                        </button>
                        {ticket.status !== 'resuelto' && (
                          <button onClick={() => setTicketStatus(ticket.id, 'resuelto')} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', border: 'none', borderRadius: 11, background: R.jadeTint, cursor: 'pointer', fontFamily: R.ui, fontSize: 13, color: R.jade, fontWeight: 700, textAlign: 'left' }}>
                            <Icon n="check" size={15} color={R.jade} stroke={3} /> Marcar resuelto
                          </button>
                        )}
                      </div>
                    </Card>

                  </div>
                </div>
              </div>
            ) : (
              // ── Ticket list ──
              <>
                {/* KPI cards — clickeables como filtros */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                  {([
                    { filter: 'nuevo' as const, label: 'Tickets nuevos', value: newCount, tint: R.coralTint, icon: <Icon n="chat" size={20} color={R.coral} />, active: R.coral },
                    { filter: 'en_progreso' as const, label: 'En progreso', value: progCount, tint: R.amberTint, icon: <Icon n="clock" size={20} color={R.amber} />, active: R.amber },
                    { filter: 'resuelto' as const, label: 'Resueltos hoy', value: doneCount, tint: R.jadeTint, icon: <Icon n="check" size={20} color={R.jade} />, active: R.jade },
                  ]).map(k => {
                    const on = statusFilter === k.filter
                    return (
                      <div key={k.filter} onClick={() => setStatusFilter(on ? 'todos' : k.filter)}
                        style={{ flex: 1, minWidth: 0, background: R.surface, border: `2px solid ${on ? k.active : R.line}`, borderRadius: 18, padding: '18px 20px', cursor: 'pointer', transition: 'border-color .15s', boxShadow: on ? `0 0 0 3px ${k.tint}` : 'none' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: k.tint, display: 'grid', placeItems: 'center', marginBottom: 12 }}>{k.icon}</div>
                        <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 26, color: R.ink, lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontSize: 13, color: on ? k.active : R.inkSoft, fontWeight: on ? 700 : 400, marginTop: 6 }}>{k.label}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Search bar */}
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Icon n="search" size={16} color={R.inkFaint} />
                  </div>
                  <input
                    value={supportSearch}
                    onChange={e => setSupportSearch(e.target.value)}
                    placeholder="Buscar por usuario, ticket, problema o ciudad…"
                    style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 12, padding: '11px 16px 11px 42px', fontSize: 14, fontFamily: R.ui, color: R.ink, outline: 'none', background: R.surface, transition: 'border-color .15s' }}
                    onFocus={e => e.target.style.borderColor = R.coral}
                    onBlur={e => e.target.style.borderColor = R.line}
                  />
                  {supportSearch && (
                    <button onClick={() => setSupportSearch('')}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: R.inkFaint, fontSize: 18, lineHeight: 1 }}>
                      ×
                    </button>
                  )}
                </div>

                {/* Filter tab pills */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {([
                    { id: 'todos' as const, label: `Todos (${tickets.length})` },
                    { id: 'nuevo' as const, label: `Nuevo (${newCount})` },
                    { id: 'en_progreso' as const, label: `En progreso (${progCount})` },
                    { id: 'resuelto' as const, label: `Resuelto (${doneCount})` },
                  ]).map(f => {
                    const on = statusFilter === f.id
                    return (
                      <button key={f.id} onClick={() => setStatusFilter(f.id)}
                        style={{ padding: '7px 14px', borderRadius: 999, border: on ? 'none' : `1px solid ${R.line}`, background: on ? R.dusk : R.surface, color: on ? '#fff' : R.inkSoft, fontFamily: R.ui, fontWeight: on ? 700 : 500, fontSize: 13.5, cursor: 'pointer', transition: 'all .15s' }}>
                        {f.label}
                      </button>
                    )
                  })}
                  {statusFilter !== 'todos' && (
                    <button onClick={() => setStatusFilter('todos')}
                      style={{ padding: '7px 12px', borderRadius: 999, border: 'none', background: 'transparent', color: R.coral, fontFamily: R.ui, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      × Limpiar filtro
                    </button>
                  )}
                </div>

                {(() => {
                  const q = supportSearch.trim().toLowerCase()
                  const filtered = tickets.filter(t =>
                    (statusFilter === 'todos' || t.status === statusFilter) &&
                    (!q || t.user.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) ||
                     t.issue.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) ||
                     t.email.toLowerCase().includes(q))
                  )
                  return (
                    <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 14 }}>
                      {q || statusFilter !== 'todos'
                        ? <>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}{statusFilter !== 'todos' ? ` · ${stLabel(statusFilter)}` : ''}{q ? ` · "${supportSearch}"` : ''}</>
                        : 'Mensajes enviados desde la pantalla de Ayuda y soporte en la app.'}
                    </div>
                  )
                })()}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tickets.filter(t =>
                    (statusFilter === 'todos' || t.status === statusFilter) &&
                    (!supportSearch.trim() || [t.user, t.id, t.issue, t.city, t.email].some(f => f.toLowerCase().includes(supportSearch.trim().toLowerCase())))
                  ).map(t => {
                    const last = t.thread[t.thread.length - 1]
                    const [sc, st] = stColor(t.status)
                    return (
                      <Card key={t.id} onClick={() => setSelTicket(t.id)} style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: t.mode === 'Explorer' ? R.coralTint : R.jadeTint, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <Icon n="chat" size={19} color={t.mode === 'Explorer' ? R.coral : R.jade} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 14.5, color: R.ink }}>{t.user}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: sc, background: st, padding: '2px 8px', borderRadius: 999 }}>{stLabel(t.status)}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: R.inkFaint }}>{t.id}</span>
                          </div>
                          <div style={{ fontSize: 13.5, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.issue}</div>
                          <div style={{ fontSize: 12, color: R.inkFaint, marginTop: 2 }}>{t.city} · {t.mode} · último: "{last.txt.slice(0, 55)}…"</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: R.inkFaint }}>{t.time}</span>
                          <Icon n="chevron" size={16} color={R.inkFaint} />
                        </div>
                      </Card>
                    )
                  })}
                  {tickets.filter(t =>
                    (statusFilter === 'todos' || t.status === statusFilter) &&
                    (!supportSearch.trim() || [t.user, t.id, t.issue, t.city, t.email].some(f => f.toLowerCase().includes(supportSearch.trim().toLowerCase())))
                  ).length === 0 && (
                    <Card style={{ textAlign: 'center', padding: '44px 0', color: R.inkSoft }}>
                      <Icon n="search" size={28} color={R.inkFaint} stroke={1.8} />
                      <div style={{ marginTop: 8 }}>
                        {supportSearch.trim() ? `Sin resultados para "${supportSearch}"` : 'Sin tickets con este estatus.'}
                      </div>
                      {supportSearch.trim() && (
                        <button onClick={() => setSupportSearch('')} style={{ marginTop: 10, background: 'none', border: 'none', color: R.coral, fontFamily: R.ui, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                          Limpiar búsqueda
                        </button>
                      )}
                    </Card>
                  )}
                </div>
              </>
            )
          })()}

          {view === 'rove' && (
            <RoveAdminView rewards={roveRewards} onUpdate={updateRoveReward} canWrite={canWriteUI('rove')} />
          )}

          {view === 'integraciones' && adminRole === 'super_admin' && (
            <div style={{ maxWidth: 760 }}>
              {/* Listado de conexiones */}
              {integ === null && (
                <>
                  <div style={{ fontSize: 13.5, color: R.inkSoft, marginBottom: 16 }}>Elige una conexión para configurar su módulo.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 14 }}>
                    {INTEGRATIONS.map(it => {
                      const connected = it.id === 'openrouter' ? orConnected : it.id === 'boomerangme' ? bmConnected : true
                      return (
                        <Card key={it.id} onClick={() => setInteg(it.id)} style={{ padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                            <div style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(140deg, ${it.grad[0]}, ${it.grad[1]})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                              <Icon n={it.icon} size={23} color="#fff" fill={it.iconFill ? '#fff' : 'none'} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 17, color: R.ink }}>{it.name}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{it.tag}</div>
                            </div>
                            <Icon n="chevron" size={18} color={R.inkFaint} />
                          </div>
                          <div style={{ fontSize: 13, color: R.inkSoft, lineHeight: 1.45 }}>{it.desc}</div>
                          <div>
                            {connected
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#16614c', background: R.jadeTint, padding: '4px 11px', borderRadius: 999 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: R.jade }} /> Conectado</span>
                              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: R.amberDeep, background: R.amberTint, padding: '4px 11px', borderRadius: 999 }}><Icon n="clock" size={12} color={R.amberDeep} /> Pendiente</span>}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Módulo · OpenRouter */}
              {integ === 'openrouter' && (
                <>
                  <button onClick={() => setInteg(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: R.inkSoft, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, padding: 0, marginBottom: 18 }}>
                    <Icon n="back" size={17} color={R.inkSoft} /> Integraciones
                  </button>
                  <Card style={{ marginBottom: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 13, background: 'linear-gradient(140deg,#0EA5A4,#0B6E6D)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Icon n="cpu" size={24} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 18, color: R.ink }}>OpenRouter</span>
                          {orConnected
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#16614c', background: R.jadeTint, padding: '3px 10px', borderRadius: 999 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: R.jade }} /> Conectado</span>
                            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: R.amberDeep, background: R.amberTint, padding: '3px 10px', borderRadius: 999 }}><Icon n="clock" size={12} color={R.amberDeep} /> Pendiente · falta API key</span>}
                        </div>
                        <div style={{ fontSize: 13.5, color: R.inkSoft, marginTop: 4 }}>Motor de inteligencia artificial de la plataforma. Una sola conexión alimenta todas las funciones de IA de Reva.</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>API Key</div>
                        <input value={orKey} onChange={e => setOrKey(e.target.value)} disabled={orConnected} type="password" placeholder="sk-or-…" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: orConnected ? R.bgAlt : R.surface }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Modelo por defecto</div>
                        <input value={orModel} onChange={e => setModelCfg(e.target.value)} placeholder={OR_DEFAULT_MODEL} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Modelos de respaldo <span style={{ textTransform: 'none', letterSpacing: 0, color: R.inkFaint, fontWeight: 600 }}>· opcional, separados por coma</span></div>
                      <input value={orFallbacks} onChange={e => setFallbacksCfg(e.target.value)} placeholder="anthropic/claude-3.5-haiku, google/gemini-flash-1.5" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }} />
                      <div style={{ fontSize: 12, color: R.inkFaint, marginTop: 7 }}>Si el modelo principal se satura, la IA salta automáticamente al siguiente. Verifica los slugs en openrouter.ai/models.</div>
                    </div>
                    <div style={{ fontSize: 12, color: R.inkFaint, marginBottom: 14 }}>Ejemplos: <code style={{ background: R.bgAlt, padding: '2px 6px', borderRadius: 6, fontSize: 12, color: R.ink }}>openai/gpt-4o</code> · <code style={{ background: R.bgAlt, padding: '2px 6px', borderRadius: 6, fontSize: 12, color: R.ink }}>anthropic/claude-3.5-haiku</code> · <code style={{ background: R.bgAlt, padding: '2px 6px', borderRadius: 6, fontSize: 12, color: R.ink }}>google/gemini-flash-1.5</code></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {orConnected ? (
                        <button onClick={disconnectOR} style={{ padding: '11px 18px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: R.coralPress }}>Desconectar</button>
                      ) : (
                        <button onClick={connectOR} disabled={!orKey.trim()} style={{ padding: '11px 20px', border: 'none', borderRadius: 12, background: orKey.trim() ? R.coral : R.coralTint, cursor: orKey.trim() ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: orKey.trim() ? '#fff' : R.coralPress }}>Conectar</button>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: R.inkFaint }}>
                        <Icon n="shield" size={14} color={R.jade} /> La llave se guarda cifrada a nivel plataforma.
                      </span>
                    </div>
                    {!orConnected && (
                      <div style={{ marginTop: 14, padding: '11px 13px', background: R.amberTint, borderRadius: 10, fontSize: 12.5, color: R.amberDeep }}>
                        <strong>Pendiente:</strong> agrega tu API key de openrouter.ai/keys para activar la IA de la plataforma. Todo lo demás ya está listo.
                      </div>
                    )}
                  </Card>

                  {/* Funciones de IA habilitadas */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Funciones de IA habilitadas</div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '3px 10px', borderRadius: 999 }}>{orOptions.filter(o => o.on).length} de {orOptions.length}</span>
                  </div>
                  <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 14 }}>Elige qué funciones de IA usan el motor de OpenRouter.</div>
                  <Card style={{ padding: 0, overflow: 'hidden', opacity: orConnected ? 1 : .85 }}>
                    {orOptions.map((o, i) => (
                      <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: R.ink }}>{o.label}</div>
                          <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 1 }}>{o.desc}</div>
                        </div>
                        <button onClick={() => toggleOR(o.id)} aria-label={o.label} style={{ width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', background: o.on ? R.jade : R.inkFaint, position: 'relative', flexShrink: 0 }}>
                          <span style={{ position: 'absolute', top: 2, left: o.on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
                        </button>
                      </div>
                    ))}
                  </Card>
                  {!orConnected && <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 10 }}>Puedes preconfigurar qué funciones habilitar; se activarán al conectar OpenRouter.</div>}

                  {/* Prompts de la IA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 6 }}>
                    <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Prompts de la IA</div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '3px 10px', borderRadius: 999 }}>{PROMPT_DEFS.filter(p => orPrompts[p.id] !== DEFAULT_PROMPTS[p.id]).length} editados</span>
                  </div>
                  <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 14 }}>Edita las instrucciones que sigue la IA en cada situación. Conserva los {'{{'}placeholders{'}}'} para que se inyecten los datos reales.</div>
                  <Card style={{ padding: 0, overflow: 'hidden' }}>
                    {PROMPT_DEFS.map((p, i) => {
                      const open = orPromptOpen === p.id
                      const edited = orPrompts[p.id] !== DEFAULT_PROMPTS[p.id]
                      const isCli = p.user === 'cliente'
                      return (
                        <div key={p.id} style={{ borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                          <button onClick={() => setOrPromptOpen(open ? null : p.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: open ? R.bgAlt : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: R.ui }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: 14.5, color: R.ink }}>{p.label}</span>
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: isCli ? '#16614c' : R.amberDeep, background: isCli ? R.jadeTint : R.amberTint, padding: '2px 8px', borderRadius: 999 }}>{isCli ? 'Cliente' : 'Negocio'}</span>
                                {edited && <span style={{ fontSize: 10.5, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '2px 8px', borderRadius: 999 }}>Editado</span>}
                              </div>
                              <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 2 }}>{p.description}</div>
                            </div>
                            <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}><Icon n="chevron" size={18} color={R.inkFaint} /></span>
                          </button>
                          {open && (
                            <div style={{ padding: '4px 18px 18px' }}>
                              <textarea
                                value={orPrompts[p.id]}
                                onChange={e => setPrompt(p.id, e.target.value)}
                                spellCheck={false}
                                rows={14}
                                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 12, padding: '13px 14px', fontSize: 12.5, lineHeight: 1.5, color: R.ink, outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', background: R.surface, resize: 'vertical' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                                <div style={{ fontSize: 12, color: R.inkFaint }}>
                                  {p.placeholders.length > 0
                                    ? <>Placeholders: {p.placeholders.map((ph, k) => <code key={ph} style={{ background: R.bgAlt, padding: '2px 6px', borderRadius: 6, fontSize: 11.5, color: R.ink, marginRight: k < p.placeholders.length - 1 ? 5 : 0 }}>{ph}</code>)}</>
                                    : <>Sin placeholders.</>}
                                </div>
                                <button onClick={() => resetPrompt(p.id)} disabled={!edited} style={{ border: 'none', background: 'transparent', cursor: edited ? 'pointer' : 'default', color: edited ? R.coralPress : R.inkFaint, fontFamily: R.ui, fontWeight: 700, fontSize: 12.5, padding: 0 }}>↺ Restablecer</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </Card>
                  <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 10 }}>Los cambios se guardan al instante y los usa la IA del cliente y del negocio.</div>
                </>
              )}

              {/* Módulo · BoomerangMe */}
              {integ === 'boomerangme' && (
                <>
                  <button onClick={() => setInteg(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: R.inkSoft, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, padding: 0, marginBottom: 18 }}>
                    <Icon n="back" size={17} color={R.inkSoft} /> Integraciones
                  </button>
                  <Card style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: 'linear-gradient(140deg,#7C5CFF,#4A2FBF)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon n="spark" size={24} color="#fff" fill="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 18, color: R.ink }}>BoomerangMe</span>
                      {bmConnected
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#16614c', background: R.jadeTint, padding: '3px 10px', borderRadius: 999 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: R.jade }} /> Conectado</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: R.amberDeep, background: R.amberTint, padding: '3px 10px', borderRadius: 999 }}><Icon n="clock" size={12} color={R.amberDeep} /> Pendiente · faltan API keys</span>}
                    </div>
                    <div style={{ fontSize: 13.5, color: R.inkSoft, marginTop: 4 }}>Plataforma de lealtad digital. La conexión es a nivel plataforma: los negocios la usan sin manejar las llaves.</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>API Key</div>
                    <input value={bmKey} onChange={e => setBmKey(e.target.value)} disabled={bmConnected} type="password" placeholder="Pega tu API Key" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: bmConnected ? R.bgAlt : R.surface }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>API Secret</div>
                    <input value={bmSecret} onChange={e => setBmSecret(e.target.value)} disabled={bmConnected} type="password" placeholder="Pega tu API Secret" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: bmConnected ? R.bgAlt : R.surface }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {bmConnected ? (
                    <button onClick={disconnectBM} style={{ padding: '11px 18px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: R.coralPress }}>Desconectar</button>
                  ) : (
                    <button onClick={connectBM} disabled={!bmKey.trim() || !bmSecret.trim()} style={{ padding: '11px 20px', border: 'none', borderRadius: 12, background: (bmKey.trim() && bmSecret.trim()) ? R.coral : R.coralTint, cursor: (bmKey.trim() && bmSecret.trim()) ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: (bmKey.trim() && bmSecret.trim()) ? '#fff' : R.coralPress }}>Conectar</button>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: R.inkFaint }}>
                    <Icon n="shield" size={14} color={R.jade} /> Las llaves se guardan cifradas a nivel plataforma.
                  </span>
                </div>
                {!bmConnected && (
                  <div style={{ marginTop: 14, padding: '11px 13px', background: R.amberTint, borderRadius: 10, fontSize: 12.5, color: R.amberDeep }}>
                    <strong>Pendiente:</strong> agrega las API keys de boomerangme.biz para activar la integración. Todo lo demás ya está listo.
                  </div>
                )}
              </Card>

              {/* Opciones de lealtad habilitadas */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Opciones de lealtad habilitadas</div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '3px 10px', borderRadius: 999 }}>{bmOptions.filter(o => o.on).length} de {bmOptions.length}</span>
              </div>
              <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 14 }}>Los negocios solo verán y podrán usar las opciones que actives aquí.</div>
              <Card style={{ padding: 0, overflow: 'hidden', opacity: bmConnected ? 1 : .85 }}>
                {bmOptions.map((o, i) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: R.ink }}>{o.label}</div>
                      <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 1 }}>{o.desc}</div>
                    </div>
                    <button onClick={() => toggleBM(o.id)} aria-label={o.label} style={{ width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', background: o.on ? R.jade : R.inkFaint, position: 'relative', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: 2, left: o.on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
                    </button>
                  </div>
                ))}
              </Card>
              {!bmConnected && <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 10 }}>Puedes preconfigurar qué opciones habilitar; se activarán para los negocios al conectar.</div>}
                </>
              )}

              {/* Módulo · Stripe */}
              {integ === 'stripe' && (
                <>
                  <button onClick={() => setInteg(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: R.inkSoft, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, padding: 0, marginBottom: 18 }}>
                    <Icon n="back" size={17} color={R.inkSoft} /> Integraciones
                  </button>
                  {/* Conexión Stripe — gestionada por variables de entorno */}
                  <Card style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: 'linear-gradient(140deg,#635BFF,#4B45C6)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon n="card" size={24} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 18, color: R.ink }}>Stripe</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#16614c', background: R.jadeTint, padding: '3px 10px', borderRadius: 999 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: R.jade }} /> Conectado</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: R.inkSoft, marginTop: 4 }}>Pagos y cobros de la plataforma: depósitos de reserva y campañas de Destacados. La conexión es a nivel plataforma.</div>
                  </div>
                </div>
                <div style={{ padding: '12px 14px', background: R.bgAlt, borderRadius: 12, fontSize: 12.5, color: R.inkSoft, lineHeight: 1.5 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: R.ink, fontWeight: 700, marginBottom: 4 }}>
                    <Icon n="shield" size={14} color={R.jade} /> Llaves gestionadas en el entorno
                  </div>
                  Las llaves de Stripe (publicable, secreta y firma del webhook) viven en las variables de entorno de la plataforma y no se editan aquí. Endpoint del webhook: <code style={{ background: R.surface, padding: '2px 6px', borderRadius: 6, fontSize: 12, color: R.ink }}>/api/stripe/webhook</code>
                </div>
              </Card>

              {/* Cobros habilitados */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Cobros habilitados</div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '3px 10px', borderRadius: 999 }}>{stOptions.filter(o => o.on).length} de {stOptions.length}</span>
              </div>
              <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 14 }}>Define qué cobros realiza Reva a través de Stripe.</div>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {stOptions.map((o, i) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: R.ink }}>{o.label}</div>
                      <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 1 }}>{o.desc}</div>
                    </div>
                    <button onClick={() => toggleStripe(o.id)} aria-label={o.label} style={{ width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', background: o.on ? R.jade : R.inkFaint, position: 'relative', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: 2, left: o.on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
                    </button>
                  </div>
                ))}
              </Card>
                </>
              )}
            </div>
          )}

          {view === 'ajustes' && adminRole === 'super_admin' && (
            <div style={{ maxWidth: 640 }}>
              {/* ── Equipo Reva ──────────────────────────── */}
              <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Icon n="users" size={17} color={R.coral} />
                  <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15, color: R.ink }}>Equipo Reva</span>
                </div>
                <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 16 }}>Acceso al panel de super administrador.</div>

                {/* member list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {staff.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: R.bg, border: `1px solid ${R.line}`, borderRadius: 12 }}>
                      {/* avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: m.role === 'Super Admin' ? R.coralTint : m.role === 'Operador' ? R.jadeTint : R.bgAlt, display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: R.display, fontWeight: 800, fontSize: 15, color: m.role === 'Super Admin' ? R.coralPress : m.role === 'Operador' ? R.jade : R.inkSoft }}>
                        {(m.name || m.email).slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.name || m.email}
                        </div>
                        {m.name && <div style={{ fontSize: 12, color: R.inkFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>}
                      </div>
                      {/* role chip */}
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 999, whiteSpace: 'nowrap', background: m.role === 'Super Admin' ? R.coralTint : m.role === 'Operador' ? R.jadeTint : R.bgAlt, color: m.role === 'Super Admin' ? R.coralPress : m.role === 'Operador' ? R.jade : R.inkSoft }}>
                        {m.role}
                      </span>
                      {/* invited badge */}
                      {m.status === 'invitado' && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', background: resentStaffIds.includes(m.id) ? R.jadeTint : R.amberTint, color: resentStaffIds.includes(m.id) ? R.jade : R.amberDeep }}>
                          {resentStaffIds.includes(m.id) ? 'Reenviado ✓' : 'Pendiente'}
                        </span>
                      )}
                      {m.status === 'invitado' && adminRole === 'super_admin' && (
                        <button onClick={() => resendStaffInvite(m)} title="Reenviar invitación" aria-label="Reenviar" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: R.inkFaint, display: 'grid', placeItems: 'center' }}>
                          <Icon n="send" size={13} color={R.inkFaint} />
                        </button>
                      )}
                      {/* remove (solo super admin, nunca a un Super Admin) */}
                      {m.role !== 'Super Admin' && adminRole === 'super_admin' && (
                        <button onClick={() => removeStaff(m)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: R.inkFaint, display: 'grid', placeItems: 'center' }} aria-label="Eliminar">
                          <Icon n="x" size={15} color={R.inkFaint} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* invite form — solo el super admin gestiona el equipo */}
                {adminRole === 'super_admin' && (
                <div style={{ borderTop: `1px solid ${R.line}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 9 }}>Invitar al equipo</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <Icon n="mail" size={15} color={R.inkFaint} stroke={1.8} />
                      </div>
                      <input
                        value={staffEmail}
                        onChange={e => { setStaffEmail(e.target.value); setStaffError('') }}
                        onKeyDown={e => e.key === 'Enter' && sendStaffInvite()}
                        placeholder="correo@reva.mx"
                        style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${staffError ? R.coral : R.line}`, borderRadius: 10, padding: '10px 12px 10px 34px', fontSize: 13.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }}
                      />
                    </div>
                    <select value={staffRole} onChange={e => setStaffRole(e.target.value as 'Operador' | 'Analista')} style={{ border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 10px', fontSize: 13.5, color: R.ink, background: R.bg, fontFamily: R.ui, cursor: 'pointer', outline: 'none' }}>
                      <option value="Operador">Operador</option>
                      <option value="Analista">Analista</option>
                    </select>
                  </div>
                  {staffError && <div style={{ fontSize: 12, color: R.coral, marginBottom: 6 }}>{staffError}</div>}
                  {staffNote && <div style={{ fontSize: 12, color: R.jade, marginBottom: 6 }}>{staffNote}</div>}
                  <button onClick={sendStaffInvite} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', border: 'none', borderRadius: 10, background: R.ink, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>
                    <Icon n="send" size={14} color="#fff" />
                    Enviar invitación
                  </button>
                  <div style={{ fontSize: 11.5, color: R.inkFaint, marginTop: 8 }}>
                    Operador: soporte, moderación y reservas. Analista: solo lectura de métricas.
                  </div>
                </div>
                )}
              </div>

              {/* ── Ajustes generales ─────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 'plataforma', label: 'Plataforma', sub: 'Nombre, logo e idioma por defecto', icon: 'globe' },
                  { id: 'categorias', label: 'Categorías de negocio', sub: 'Agrega o quita categorías para dar de alta negocios', icon: 'grid' },
                  { id: 'notificaciones', label: 'Notificaciones', sub: 'Alertas por correo al equipo Reva', icon: 'bell' },
                  { id: 'seguridad', label: 'Seguridad', sub: 'Autenticación de dos factores, sesiones activas', icon: 'shield' },
                  { id: 'facturacion', label: 'Facturación', sub: 'Plan de la plataforma y método de pago', icon: 'credit' },
                ].map(row => (
                  <button key={row.id} onClick={() => setSettingsPanel(row.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', background: R.surface, border: `1px solid ${R.line}`, borderRadius: 14, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left', width: '100%' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: R.bgAlt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon n={row.icon} size={17} color={R.inkSoft} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: R.ink, margin: 0 }}>{row.label}</p>
                      <p style={{ fontSize: 12.5, color: R.inkSoft, margin: '2px 0 0' }}>{row.sub}</p>
                    </div>
                    <Icon n="chevron" size={17} color={R.inkFaint} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Settings panel modal ───────────────────── */}
      {settingsPanel && (
        <div onClick={() => setSettingsPanel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink }}>{panelTitles[settingsPanel]}</span>
              <button onClick={() => setSettingsPanel(null)} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {/* ── Plataforma ── */}
            {settingsPanel === 'plataforma' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label>
                  <span style={lblStyle}>Nombre de la plataforma</span>
                  <input value={platName} onChange={e => setPlatName(e.target.value)} style={fldStyle} />
                </label>
                <label>
                  <span style={lblStyle}>URL pública</span>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 13.5, color: R.inkFaint }}>https://</span>
                    <input value={platUrl} onChange={e => setPlatUrl(e.target.value)} style={{ ...fldStyle, paddingLeft: 70 }} />
                  </div>
                </label>
                <label>
                  <span style={lblStyle}>Idioma por defecto</span>
                  <select value={platLang} onChange={e => setPlatLang(e.target.value)} style={{ ...fldStyle, cursor: 'pointer' }}>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label>
                  <span style={lblStyle}>Zona horaria</span>
                  <select value={platTz} onChange={e => setPlatTz(e.target.value)} style={{ ...fldStyle, cursor: 'pointer' }}>
                    <option value="America/Mazatlan">América/Mazatlán (GMT-7)</option>
                    <option value="America/Mexico_City">América/Ciudad de México (GMT-6)</option>
                    <option value="America/Tijuana">América/Tijuana (GMT-8)</option>
                    <option value="America/Cancun">América/Cancún (GMT-5)</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={lblStyle}>Logo de la plataforma</span>
                  <div style={{ height: 90, borderRadius: 12, border: `1.5px dashed ${R.line}`, background: R.surface, display: 'grid', placeItems: 'center', cursor: 'pointer', color: R.inkSoft, fontSize: 13 }}>
                    <Icon n="plus" size={18} color={R.inkFaint} /> Subir imagen
                  </div>
                  <input type="file" accept="image/*" style={{ display: 'none' }} />
                </label>
              </div>
            )}

            {/* ── Categorías de negocio ── */}
            {settingsPanel === 'categorias' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 2 }}>Estas categorías aparecen al dar de alta un negocio desde Negocios → Agregar negocio.</div>

                {bizCategories.length === 0 && (
                  <div style={{ padding: '18px', textAlign: 'center', border: `1px dashed ${R.line}`, borderRadius: 12, color: R.inkFaint, fontSize: 13 }}>
                    Sin categorías. Agrega al menos una.
                  </div>
                )}
                {bizCategories.map(c => {
                  const enUso = bizes.filter(b => b.cat === c.label).length
                  return (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: `1px solid ${R.line}`, borderRadius: 12, background: R.surface }}>
                      <span style={{ fontSize: 19 }}>{c.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13.5, color: R.ink, margin: 0 }}>{c.label}</p>
                        <p style={{ fontSize: 11.5, color: R.inkFaint, margin: '1px 0 0' }}>{enUso > 0 ? `${enUso} negocio${enUso === 1 ? '' : 's'} usando esta categoría` : 'Sin negocios todavía'}</p>
                      </div>
                      <button onClick={() => removeCategory(c.label)} title="Eliminar categoría" aria-label="Eliminar categoría"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: R.inkFaint, display: 'grid', placeItems: 'center' }}>
                        <Icon n="trash" size={15} color={R.inkFaint} />
                      </button>
                    </div>
                  )
                })}

                {/* add new category */}
                <div style={{ borderTop: `1px solid ${R.line}`, marginTop: 8, paddingTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 9 }}>Nueva categoría</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      value={catEmoji}
                      onChange={e => { setCatEmoji(e.target.value); setCatError('') }}
                      placeholder="🏷️"
                      maxLength={4}
                      style={{ width: 56, boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 0', fontSize: 18, textAlign: 'center', outline: 'none', fontFamily: R.ui, background: R.surface }}
                    />
                    <input
                      value={catLabel}
                      onChange={e => { setCatLabel(e.target.value); setCatError('') }}
                      onKeyDown={e => e.key === 'Enter' && addCategory()}
                      placeholder="Ej. Veterinaria"
                      style={{ flex: 1, boxSizing: 'border-box', border: `1px solid ${catError ? R.coral : R.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }}
                    />
                  </div>
                  {catError && <div style={{ fontSize: 12, color: R.coral, marginBottom: 6 }}>{catError}</div>}
                  <button onClick={addCategory} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', border: 'none', borderRadius: 10, background: R.ink, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>
                    <Icon n="plus" size={14} color="#fff" /> Agregar categoría
                  </button>
                  <div style={{ fontSize: 11.5, color: R.inkFaint, marginTop: 8 }}>
                    El emoji es opcional — si lo dejas vacío se usa 🏷️ por defecto.
                  </div>
                </div>
              </div>
            )}

            {/* ── Notificaciones ── */}
            {settingsPanel === 'notificaciones' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label>
                  <span style={lblStyle}>Correos receptores</span>
                  <input value={notifEmail} onChange={e => setNotifEmail(e.target.value)} placeholder="correo1@reva.mx, correo2@reva.mx" style={fldStyle} />
                  <span style={{ fontSize: 11.5, color: R.inkFaint, marginTop: 4, display: 'block' }}>Separa múltiples correos con coma.</span>
                </label>
                <div style={{ height: 1, background: R.line }} />
                <span style={lblStyle}>Eventos que generan alerta</span>
                {([
                  { key: 'nuevaReserva', label: 'Nueva reserva confirmada' },
                  { key: 'nuevoDestacado', label: 'Nuevo destacado comprado' },
                  { key: 'nuevoNegocio', label: 'Nuevo negocio registrado' },
                  { key: 'reporteDiario', label: 'Reporte diario de resumen' },
                  { key: 'soporteUrgente', label: 'Ticket de soporte urgente' },
                ] as { key: keyof typeof notifs; label: string }[]).map(n => (
                  <button key={n.key} onClick={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${R.line}`, borderRadius: 12, background: R.surface, cursor: 'pointer', fontFamily: R.ui, width: '100%', marginTop: -6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: R.ink }}>{n.label}</span>
                    <span style={{ width: 38, height: 22, borderRadius: 999, background: notifs[n.key] ? R.jade : R.line, position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                      <span style={{ position: 'absolute', top: 3, left: notifs[n.key] ? 18 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Seguridad ── */}
            {settingsPanel === 'seguridad' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <button onClick={() => setTwoFa(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: `1px solid ${R.line}`, borderRadius: 12, background: R.surface, cursor: 'pointer', fontFamily: R.ui }}>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: R.ink, margin: 0 }}>Autenticación de dos factores</p>
                    <p style={{ fontSize: 12.5, color: R.inkSoft, margin: '3px 0 0' }}>Protege el acceso con un código extra.</p>
                  </div>
                  <span style={{ width: 42, height: 25, borderRadius: 999, background: twoFa ? R.jade : R.line, position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                    <span style={{ position: 'absolute', top: 3, left: twoFa ? 20 : 3, width: 19, height: 19, borderRadius: '50%', background: '#fff', transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                  </span>
                </button>
                <label>
                  <span style={lblStyle}>Expiración de sesión</span>
                  <select value={sessExpiry} onChange={e => setSessExpiry(e.target.value)} style={{ ...fldStyle, cursor: 'pointer' }}>
                    <option value="24h">24 horas</option>
                    <option value="7d">7 días</option>
                    <option value="30d">30 días</option>
                    <option value="never">No expirar</option>
                  </select>
                </label>
                <div>
                  <span style={lblStyle}>Sesiones activas</span>
                  {[
                    { device: 'Chrome · macOS', loc: 'Los Cabos, BCS', time: 'Ahora', current: true },
                    { device: 'Safari · iPhone', loc: 'Los Cabos, BCS', time: 'Hace 2h', current: false },
                    { device: 'Chrome · Windows', loc: 'CDMX', time: 'Hace 3d', current: false },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? `1px solid ${R.lineSoft}` : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: s.current ? R.jadeTint : R.bgAlt, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Icon n="shield" size={16} color={s.current ? R.jade : R.inkFaint} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 13.5, color: R.ink, margin: 0 }}>{s.device}</p>
                        <p style={{ fontSize: 12, color: R.inkFaint, margin: '2px 0 0' }}>{s.loc} · {s.time}</p>
                      </div>
                      {s.current
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: R.jade, background: R.jadeTint, padding: '3px 9px', borderRadius: 999 }}>Actual</span>
                        : <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: R.coral }}>Cerrar</button>}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: R.inkFaint, background: R.bgAlt, borderRadius: 10, padding: '10px 12px' }}>
                  Historial: último acceso hoy a las 09:14 desde Los Cabos, BCS.
                </div>
              </div>
            )}

            {/* ── Facturación ── */}
            {settingsPanel === 'facturacion' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <span style={lblStyle}>Plan de suscripción</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 14px', marginTop: 8, border: `1px solid ${R.coral}`, background: R.coralTint, borderRadius: 14, fontFamily: R.ui, textAlign: 'left' }}>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: R.coralPress }}>Plan Reva</span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, background: R.jade, color: '#fff', padding: '2px 8px', borderRadius: 999 }}>15 días gratis</span>
                        <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 14, color: R.ink, marginLeft: 'auto' }}>$300/mes</span>
                      </span>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: R.coralPress, marginTop: 2 }}>+ 2% por procesamiento de pagos</span>
                      <span style={{ display: 'block', fontSize: 12, color: R.inkFaint, marginTop: 2 }}>Agente de IA · agenda · panel · mensajes · reportes completos · soporte prioritario</span>
                    </span>
                  </div>
                </div>
                {/* Destacado add-on */}
                <div style={{ border: `1px solid ${R.amberTint}`, borderRadius: 14, padding: '13px 14px', background: R.amberTint }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: R.amberDeep, margin: 0 }}>✦ Destacado — add-on</p>
                      <p style={{ fontSize: 12, color: R.amberDeep, margin: '3px 0 0', opacity: .85 }}>Sin comisión adicional · compatible con cualquier plan</p>
                    </div>
                    <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 14, color: R.amberDeep, whiteSpace: 'nowrap' }}>Desde $2,500/sem</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {['Aparición al tope de búsquedas', 'Banner en Discovery', 'Estadísticas de visibilidad'].map(f => (
                      <span key={f} style={{ fontSize: 11.5, fontWeight: 600, background: 'rgba(154,108,28,.12)', color: R.amberDeep, padding: '3px 9px', borderRadius: 999 }}>{f}</span>
                    ))}
                  </div>
                </div>
                <div style={{ height: 1, background: R.line }} />
                <div>
                  <span style={lblStyle}>Método de pago</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${R.line}`, borderRadius: 12, background: R.surface, marginTop: 6 }}>
                    <div style={{ width: 42, height: 28, borderRadius: 6, background: R.dusk, display: 'grid', placeItems: 'center' }}>
                      <Icon n="credit" size={16} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 13.5, color: R.ink, margin: 0 }}>Visa •••• 4242</p>
                      <p style={{ fontSize: 12, color: R.inkFaint, margin: '2px 0 0' }}>Vence 12/27</p>
                    </div>
                    <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: R.coral }}>Cambiar</button>
                  </div>
                </div>
                <div style={{ background: R.bgAlt, borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: R.ink, margin: 0 }}>Próximo cobro</p>
                  <p style={{ fontSize: 12.5, color: R.inkSoft, margin: '3px 0 0' }}>$300 MXN · 1 de agosto 2026</p>
                </div>
              </div>
            )}

            {/* save */}
            {settingsPanel === 'categorias' || settingsPanel === 'facturacion' ? (
              // Categorías y Facturación se gestionan con sus propios controles.
              <button onClick={() => setSettingsPanel(null)} style={{ width: '100%', marginTop: 22, padding: '13px', border: 'none', borderRadius: 14, background: R.ink, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5 }}>
                Listo
              </button>
            ) : (
              <button onClick={saveSettings} disabled={settingsSaving} style={{ width: '100%', marginTop: 22, padding: '13px', border: 'none', borderRadius: 14, background: R.ink, color: '#fff', cursor: settingsSaving ? 'default' : 'pointer', opacity: settingsSaving ? 0.7 : 1, fontFamily: R.ui, fontWeight: 700, fontSize: 14.5 }}>
                {settingsSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Agregar negocio ───────────────────────── */}
      {addBizOpen && (
        <div onClick={() => setAddBizOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink }}>Agregar negocio</span>
              <button onClick={() => setAddBizOpen(false)} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 18 }}>Da de alta un negocio y envíale una invitación por correo para que complete su registro.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 6 }}>Nombre del negocio</span>
                <input
                  value={newBizName}
                  onChange={e => { setNewBizName(e.target.value); setNewBizError('') }}
                  placeholder="Ej. Cabo Real Estate"
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${newBizError ? R.coral : R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }}
                />
              </label>

              <label>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 6 }}>Correo del negocio</span>
                <input
                  type="email"
                  value={newBizEmail}
                  onChange={e => { setNewBizEmail(e.target.value); setNewBizEmailError('') }}
                  placeholder="contacto@negocio.mx"
                  style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${newBizEmailError ? R.coral : R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }}
                />
                {newBizEmailError && <span style={{ fontSize: 12, color: R.coral, marginTop: 4, display: 'block' }}>{newBizEmailError}</span>}
                <span style={{ fontSize: 12, color: R.inkFaint, marginTop: 5, display: 'block' }}>Se enviará una invitación a este correo para que el negocio complete su registro.</span>
              </label>

              <div>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 8 }}>Categoría</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {bizCategories.map(c => {
                    const on = newBizCat === c.label
                    return (
                      <button key={c.label} onClick={() => setNewBizCat(c.label)}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px', borderRadius: 12, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left' }}>
                        <span style={{ fontSize: 17 }}>{c.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: on ? R.coralPress : R.ink }}>{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <label>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 6 }}>Estado</span>
                <select value={newBizState} onChange={e => selectBizState(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface, cursor: 'pointer' }}>
                  {STATES_DATA.map(s => <option key={s.abbr} value={s.name}>{s.name}</option>)}
                </select>
              </label>

              <label>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 6 }}>Municipio <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: R.inkFaint }}>· {newBizState}</span></span>
                <select value={newBizMun} onChange={e => setNewBizMun(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface, cursor: 'pointer' }}>
                  {newBizMunicipios.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <div>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 8 }}>Plan inicial</span>
                <div style={{ padding: '11px', borderRadius: 12, border: `1px solid ${R.coral}`, background: R.coralTint, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, color: R.coralPress, textAlign: 'center' }}>
                  Plan Reva · $300/mes · 15 días gratis
                </div>
              </div>

              {newBizError && <div style={{ fontSize: 12.5, color: R.coral }}>{newBizError}</div>}

              <button onClick={addBusiness} disabled={addBizLoading} style={{ width: '100%', marginTop: 4, padding: '13px', border: 'none', borderRadius: 14, background: R.ink, color: '#fff', cursor: addBizLoading ? 'default' : 'pointer', opacity: addBizLoading ? .7 : 1, fontFamily: R.ui, fontWeight: 700, fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon n="send" size={16} color="#fff" />
                {addBizLoading ? 'Enviando invitación…' : 'Agregar negocio y enviar invitación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detalle de negocio */}
      {detail && (
        <div onClick={() => setSelBiz(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: `linear-gradient(140deg, ${detail.grad[0]}, ${detail.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', fontSize: 18, flexShrink: 0 }}>{detail.mono}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink }}>{detail.name}</div>
                <div style={{ fontSize: 13, color: R.inkSoft }}>{detail.cat} · {detail.mun}</div>
              </div>
              <button onClick={() => setSelBiz(null)} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px' }}><span style={{ fontSize: 13, color: R.inkSoft }}>Plan</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{detail.plan}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Destacado</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{detail.dest === '—' ? 'No' : detail.dest}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Reservas</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{bizReservas(detail)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Estado</span><span style={{ fontSize: 13.5, fontWeight: 700, color: detail.estado === 'Activo' ? R.jade : R.inkFaint }}>{detail.estado}</span></div>
            </div>
            {detail.invitePending && detail.email && canWriteUI('businesses') && (
              <button onClick={() => resendInvite(detail)} disabled={resendLoading} style={{ width: '100%', padding: '12px', border: `1px solid ${R.line}`, borderRadius: 12, background: R.surface, color: R.ink, cursor: resendLoading ? 'default' : 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: resendLoading ? .6 : 1 }}>
                <Icon n="mail" size={16} color={R.ink} />
                {resendLoading ? 'Reenviando…' : 'Reenviar invitación'}
              </button>
            )}
            {canWriteUI('businesses') && (
              <button onClick={() => { toggleBiz(selBiz!) }} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: 12, background: detail.estado === 'Activo' ? R.bgAlt : R.jade, color: detail.estado === 'Activo' ? R.ink : '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14 }}>
                {detail.estado === 'Activo' ? 'Pausar negocio' : 'Reactivar negocio'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toast: invitación enviada */}
      {inviteSent && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: R.jade, color: '#fff', padding: '13px 22px', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,.3)', zIndex: 70, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <Icon n="mail" size={17} color="#fff" />
          Invitación enviada a {inviteSent}
        </div>
      )}
    </div>
  )
}
