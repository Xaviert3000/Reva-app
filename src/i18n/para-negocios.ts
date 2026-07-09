import type { Lang } from './landing'

export interface BizDict {
  navHome: string
  navHowItWorks: string
  navForBusiness: string
  navCta: string
  eyebrow: string
  titleBefore: string
  titleAccent: string
  lede: string
  heroCta: string
  panelTitle: string
  panelAgentActive: string
  stats: { label: string; value: string }[]
  requests: { name: string; detail: string; tag: string; tagColor: string }[]
  panelFooter: string
  typesTitle: string
  types: { icon: string; label: string }[]
  valueTitle: string
  valueProps: { icon: string; title: string; desc: string }[]
  plansTitle: string
  plansSubtitle: string
  planName: string
  planTrial: string
  planPrice: string
  planPeriod: string
  planCommission: string
  planFeatures: string[]
  planCta: string
}

const es: BizDict = {
  navHome: 'Inicio',
  navHowItWorks: 'Cómo funciona',
  navForBusiness: 'Para negocios',
  navCta: 'Ingresa →',
  eyebrow: 'Para negocios',
  titleBefore: 'Tu agente de IA recibe reservas ',
  titleAccent: 'mientras duermes.',
  lede: 'Cada negocio en Reva tiene su propio agente que negocia con los clientes en tiempo real — sin que tengas que contestar el teléfono ni el WhatsApp.',
  heroCta: 'Registrar mi negocio',
  panelTitle: 'Solicitudes en vivo',
  panelAgentActive: '● Agente activo',
  stats: [
    { label: 'Reservas hoy', value: '18' },
    { label: 'Ingresos atribuidos', value: '$14.2k' },
    { label: 'Vía Reva', value: '64%' },
  ],
  requests: [
    { name: 'Jordan A.', detail: 'Hoy · 20:00 · 2 personas · Mesa tranquila', tag: 'Reva negociando', tagColor: 'bg-amber/15 text-amber-700' },
    { name: 'Daniela R.', detail: 'Hoy · 21:00 · 4 personas · Lo de siempre 🌮', tag: 'Auto-confirmable', tagColor: 'bg-jade/15 text-jade' },
    { name: 'Marcus T.', detail: 'Vie 12 · 19:00 · 6 personas · Cumpleaños', tag: 'Acción requerida', tagColor: 'bg-coral/15 text-coral' },
  ],
  panelFooter: '3 entrantes · última actualización hace 12 s',
  typesTitle: 'Funciona para cualquier giro',
  types: [
    { icon: '🍽️', label: 'Restaurantes' },
    { icon: '🍸', label: 'Bares' },
    { icon: '💆', label: 'Spas' },
    { icon: '🏥', label: 'Clínicas' },
    { icon: '✂️', label: 'Salones' },
    { icon: '🚣', label: 'Tours' },
    { icon: '⚖️', label: 'Despachos' },
    { icon: '🏠', label: 'Inmobiliarias' },
  ],
  valueTitle: 'Qué incluye Reva para tu negocio',
  valueProps: [
    { icon: '🤖', title: 'Agente de IA tuyo', desc: 'Responde, negocia y confirma reservas las 24 horas. Tú lo configuras en 5 minutos.' },
    { icon: '📅', title: 'Agenda en tiempo real', desc: 'Ve todas tus reservas en un panel limpio. Vista de día y semana, detalle de cada cliente.' },
    { icon: '💬', title: 'Mensajes centralizados', desc: 'Todos los chats con clientes en un solo lugar. Responde desde el panel sin saltar a WhatsApp.' },
    { icon: '📊', title: 'Métricas reales', desc: 'Reservas, ingresos atribuidos, % via Reva, satisfacción. Datos que sí importan.' },
    { icon: '⭐', title: 'Destacados', desc: 'Compra visibilidad cuando quieras — al tope de búsquedas, en Discovery, sin disimulo.' },
    { icon: '🎟️', title: 'Integración Reva+', desc: 'Tus clientes acumulan boletos al reservar contigo. Los fidelizas sin hacer nada extra.' },
  ],
  plansTitle: 'Un solo plan',
  plansSubtitle: 'Empieza gratis 15 días. Solo pagas cuando funciona.',
  planName: 'Reva',
  planTrial: '15 días gratis',
  planPrice: '$300',
  planPeriod: '/mes',
  planCommission: '+ 2% por procesamiento de pagos',
  planFeatures: ['Agente de IA', 'Agenda en tiempo real', 'Panel del negocio', 'Mensajes vía Reva', 'Reportes completos', 'Soporte prioritario'],
  planCta: 'Empezar gratis',
}

const en: BizDict = {
  navHome: 'Home',
  navHowItWorks: 'How it works',
  navForBusiness: 'For business',
  navCta: 'Log in →',
  eyebrow: 'For business',
  titleBefore: 'Your AI agent takes bookings ',
  titleAccent: 'while you sleep.',
  lede: 'Every business on Reva has its own agent that negotiates with customers in real time — without you ever picking up the phone or WhatsApp.',
  heroCta: 'Register my business',
  panelTitle: 'Live requests',
  panelAgentActive: '● Agent active',
  stats: [
    { label: 'Bookings today', value: '18' },
    { label: 'Attributed revenue', value: '$14.2k' },
    { label: 'Via Reva', value: '64%' },
  ],
  requests: [
    { name: 'Jordan A.', detail: 'Today · 8:00 PM · 2 people · Quiet table', tag: 'Reva negotiating', tagColor: 'bg-amber/15 text-amber-700' },
    { name: 'Daniela R.', detail: 'Today · 9:00 PM · 4 people · The usual 🌮', tag: 'Auto-confirmable', tagColor: 'bg-jade/15 text-jade' },
    { name: 'Marcus T.', detail: 'Fri 12 · 7:00 PM · 6 people · Birthday', tag: 'Action required', tagColor: 'bg-coral/15 text-coral' },
  ],
  panelFooter: '3 incoming · last updated 12 s ago',
  typesTitle: 'Works for any kind of business',
  types: [
    { icon: '🍽️', label: 'Restaurants' },
    { icon: '🍸', label: 'Bars' },
    { icon: '💆', label: 'Spas' },
    { icon: '🏥', label: 'Clinics' },
    { icon: '✂️', label: 'Salons' },
    { icon: '🚣', label: 'Tours' },
    { icon: '⚖️', label: 'Law firms' },
    { icon: '🏠', label: 'Real estate' },
  ],
  valueTitle: 'What Reva includes for your business',
  valueProps: [
    { icon: '🤖', title: 'Your own AI agent', desc: 'It answers, negotiates and confirms bookings 24/7. You set it up in 5 minutes.' },
    { icon: '📅', title: 'Real-time schedule', desc: 'See all your bookings in a clean panel. Day and week views, full detail per customer.' },
    { icon: '💬', title: 'Centralized messages', desc: 'Every customer chat in one place. Reply from the panel without jumping to WhatsApp.' },
    { icon: '📊', title: 'Real metrics', desc: 'Bookings, attributed revenue, % via Reva, satisfaction. Data that actually matters.' },
    { icon: '⭐', title: 'Featured spots', desc: 'Buy visibility whenever you want — top of search, in Discovery, no disguise.' },
    { icon: '🎟️', title: 'Reva+ integration', desc: 'Your customers earn tickets when they book with you. You build loyalty without lifting a finger.' },
  ],
  plansTitle: 'One single plan',
  plansSubtitle: 'Start free for 15 days. You only pay when it works.',
  planName: 'Reva',
  planTrial: '15 days free',
  planPrice: '$300',
  planPeriod: '/mo',
  planCommission: '+ 2% payment processing',
  planFeatures: ['AI agent', 'Real-time schedule', 'Business panel', 'Messages via Reva', 'Full reports', 'Priority support'],
  planCta: 'Start free',
}

const dictionaries: Record<Lang, BizDict> = { es, en }

export function getBizDict(lang: Lang): BizDict {
  return dictionaries[lang]
}
