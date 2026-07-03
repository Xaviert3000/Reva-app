'use client'
import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { BM_OPTIONS_DEFAULT, loadBMConfig, type BMOption, type BMConfig } from '@/lib/boomerangme-config'
import { parseRoveToken, ROVE_SERIALS, type RoveProgram } from '@/lib/rove'
import { type RoveReward, type RewardCategory } from '@/lib/rove-rewards'
import { type Mode, type ProactiveAlert, type AlertType, CATALOG, AGENDA, BIZ, slotsFromHours, slotAvailability, endTime, tracksStock, inStock } from '@/lib/data'
import { saveStock, decrementStock as decrementStockDB, fetchStock } from '@/lib/inventory'

// ── Design tokens ──────────────────────────────────────────
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

// ── Icons ──────────────────────────────────────────────────
function Icon({ n, size = 20, color = 'currentColor', stroke = 2, fill = 'none' }: {
  n: string; size?: number; color?: string; stroke?: number; fill?: string
}) {
  const paths: Record<string, React.ReactNode> = {
    inbox: <><path d="M4 16V8a2 2 0 012-2h12a2 2 0 012 2v8" /><path d="M4 16h4l1.5 2h5l1.5-2H20v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" /></>,
    cal: <><rect x="4" y="5.5" width="16" height="15" rx="3" /><path d="M4 10h16M8 3.5v4M16 3.5v4" /></>,
    chat: <path d="M5 18l-1.5 3.5L7 20.5A8.5 8 0 1020 13c0 4.4-3.6 7-8 7a9 9 0 01-7-2z" />,
    chart: <><path d="M4 20h16M4 20V10l6-4M20 20V6l-6 4M10 6v14M14 10v10" /></>,
    spark: <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />,
    grid: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>,
    box: <><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" /></>,
    gift: <><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M4 13h16M12 9v11M12 9c-1-3-5-3-5-.5S10 9 12 9zM12 9c1-3 5-3 5-.5S14 9 12 9z" /></>,
    scan: <><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" /><path d="M3 12h18" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    check: <path d="M5 13l4 4 10-11" />,
    chevR: <path d="M9 5l7 7-7 7" />,
    chevD: <path d="M6 9l6 6 6-6" />,
    chevL: <path d="M15 5l-7 7 7 7" />,
    bell: <><path d="M18 8.5a6 6 0 10-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5z" /><path d="M13.7 19.5a2 2 0 01-3.4 0" /></>,
    card: <><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19M6.5 14.5h4" /></>,
    cash: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5h.01M18 14.5h.01" /></>,
    trash: <><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" /></>,
    printer: <><path d="M6 9V3h12v6" /><path d="M6 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-1" /><rect x="7" y="14" width="10" height="7" rx="1" /></>,
    report: <><path d="M9 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-5-5z" /><path d="M14 3v5h5" /><path d="M8 17v-3M12 17v-5M16 17v-2" /></>,
    bolt: <path d="M13 3L5 13h7l-1 8 8-10h-7l1-8z" />,
    send: <path d="M5 12l14-7-5 16-3-6-6-3z" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    arrowR: <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>,
    globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" /></>,
    home: <><path d="M4 11l8-6.5 8 6.5" /><path d="M6 10v9.5h12V10" /></>,
    user: <><circle cx="12" cy="8" r="3.6" /><path d="M5.5 20a6.5 6.5 0 0113 0" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
    shield: <path d="M12 3l7 2.5v5.5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V5.5L12 3z" />,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    ticket: <><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2 2 2 0 000 4 2 2 0 00-2 2H6a2 2 0 01-2-2 2 2 0 000-4z" /><path d="M14 6v12" strokeDasharray="2 2.5" /></>,
    camera: <><path d="M3 8.5a2 2 0 012-2h2L8.2 4.7A1 1 0 019 4.3h6a1 1 0 01.8.4L17 6.5h2a2 2 0 012 2V18a2 2 0 01-2 2H5a2 2 0 01-2-2V8.5z" /><circle cx="12" cy="13" r="3.4" /></>,
    qr: <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" /><path d="M14 14h3M20.5 14v6.5M14 17.5v3M17.5 20.5h3" /></>,
    users: <><circle cx="8" cy="8" r="3.5" /><path d="M2 20a7 7 0 0112 0" /><circle cx="17" cy="8" r="3.5" /><path d="M23 20a7 7 0 00-10-5.8" /></>,
    mail: <><rect x="2" y="5" width="20" height="15" rx="2.5" /><path d="M2 8l10 7 10-7" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
      {paths[n] ?? null}
    </svg>
  )
}

// ── Data ───────────────────────────────────────────────────
const VERTICALS = [
  {
    id: 'resto', name: 'La Lupita', full: 'La Lupita Taco & Mezcal', mono: 'L',
    grad: ['#E27A52', '#B5472F'] as [string, string],
    hood: 'San José del Cabo', kind: 'Restaurante', unit: 'personas', hours: '13:00 – 23:00',
    rfc: 'LUP190423K10', address: 'Blvd. Mijares 12, Centro, San José del Cabo, BCS', phone: '+52 624 142 0011',
    capacity: { used: 32, total: 60, label: 'lugares' },
    metrics: { reservasHoy: 18, ingreso: '$14.2k', viaReva: 64, rove: 241,
      trend: [9, 12, 8, 14, 11, 18, 16], trendLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'] },
    requests: [
      { id: 1, who: 'Jordan A.', via: 'Explorer', party: 2, time: '20:30', when: 'Hoy', note: 'Mesa tranquila, aniversario', state: 'negotiating' },
      { id: 2, who: 'Daniela R.', via: 'Vecino', party: 4, time: '21:00', when: 'Hoy', note: 'Lo de siempre 🌮', state: 'auto' },
      { id: 3, who: 'Marcus T.', via: 'Explorer', party: 6, time: '19:00', when: 'Vie 12', note: 'Cumpleaños, ¿pastel?', state: 'action' },
    ],
    agenda: AGENDA.lupita,
    messages: [
      { who: 'Jordan A.', via: 'Explorer', last: 'Is the terrace pet-friendly?', time: '2m', unread: true,
        thread: [{ from: 'reva', txt: 'Jordan (Explorer) pregunta por la terraza.' }, { from: 'guest', txt: 'Is the terrace pet-friendly? Bringing our small dog 🐶' }] },
      { who: 'Daniela R.', via: 'Vecino', last: '¿Tienen el mezcal de la casa?', time: '18m', unread: true,
        thread: [{ from: 'guest', txt: '¿Tienen el mezcal de la casa esta noche?' }, { from: 'biz', txt: '¡Claro! Te aparto una botella.' }] },
      { who: 'Marcus T.', via: 'Explorer', last: 'Cake is sorted, thanks!', time: '1h', unread: false,
        thread: [{ from: 'guest', txt: 'Can you do a birthday cake?' }, { from: 'biz', txt: 'Yes — tres leches, $280. Want it?' }, { from: 'guest', txt: 'Cake is sorted, thanks!' }] },
    ],
    catalog: CATALOG.lupita,
  },
  {
    id: 'spa', name: 'Sereno', full: 'Sereno Spa & Temazcal', mono: 'S',
    grad: ['#C9A2B4', '#6E4A63'] as [string, string],
    hood: 'Corredor Turístico', kind: 'Spa & Bienestar', unit: 'servicio', hours: '09:00 – 20:00',
    rfc: 'SER210308M45', address: 'Carr. Transpeninsular Km 7.5, Corredor Turístico, Los Cabos, BCS', phone: '+52 624 145 0088',
    capacity: { used: 9, total: 14, label: 'citas' },
    metrics: { reservasHoy: 11, ingreso: '$22.8k', viaReva: 58, rove: 96,
      trend: [6, 8, 7, 9, 10, 11, 9], trendLabels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'] },
    requests: [
      { id: 1, who: 'Emily W.', via: 'Explorer', party: 2, time: '16:00', when: 'Hoy', note: 'Masaje en pareja, vista al mar', state: 'negotiating' },
      { id: 2, who: 'Carla M.', via: 'Vecino', party: 1, time: '12:00', when: 'Mañana', note: 'Temazcal luna llena', state: 'auto' },
    ],
    agenda: AGENDA.sereno,
    messages: [
      { who: 'Emily W.', via: 'Explorer', last: 'Can we get the ocean cabana?', time: '5m', unread: true,
        thread: [{ from: 'reva', txt: 'Emily (Explorer) quiere masaje en pareja hoy 16:00.' }, { from: 'guest', txt: 'Can we get the ocean-view cabana?' }] },
      { who: 'Carla M.', via: 'Vecino', last: '¡Perfecto, ahí estaré!', time: '40m', unread: false,
        thread: [{ from: 'guest', txt: '¿El temazcal es con luna llena?' }, { from: 'biz', txt: 'Sí, mañana 12:00.' }, { from: 'guest', txt: '¡Perfecto, ahí estaré!' }] },
    ],
    catalog: CATALOG.sereno,
  },
]

type Vert = typeof VERTICALS[0]

const NAV = [
  { id: 'requests', icon: 'inbox', label: 'Solicitudes' },
  { id: 'agenda', icon: 'cal', label: 'Agenda' },
  { id: 'messages', icon: 'chat', label: 'Mensajes' },
  { id: 'metrics', icon: 'chart', label: 'Métricas' },
  { id: 'reports', icon: 'report', label: 'Informes' },
  { id: 'destacado', icon: 'spark', label: 'Destacado' },
  { id: 'catalog', icon: 'grid', label: 'Catálogo' },
  { id: 'inventory', icon: 'box', label: 'Inventario' },
  { id: 'pos', icon: 'card', label: 'Punto de venta' },
  { id: 'promos', icon: 'gift', label: 'Promociones' },
  { id: 'scanner', icon: 'scan', label: 'Escáner' },
  { id: 'settings', icon: 'settings', label: 'Ajustes' },
]

const VIEW_TITLES: Record<string, [string, string]> = {
  requests: ['Solicitudes en vivo', 'Lo que Reva está trayendo a tu puerta'],
  agenda: ['Agenda', 'Tu día, mesa por mesa'],
  messages: ['Mensajes', 'Conversaciones con tus clientes, vía Reva'],
  metrics: ['Métricas', 'Cómo Reva mueve tu negocio'],
  reports: ['Informes', 'El pulso completo de tu negocio, módulo por módulo'],
  destacado: ['Destacado', 'Aparece primero — siempre marcado como tal'],
  catalog: ['Catálogo', 'Lo que Reva puede ofrecer y reservar'],
  inventory: ['Inventario', 'Disponibilidad de tus productos y servicios'],
  pos: ['Punto de venta', 'Cobra al instante desde tu catálogo'],
  promos: ['Promociones', 'Lealtad y ofertas'],
  scanner: ['Escáner', 'Sella, suma puntos y canjea al momento'],
  settings: ['Ajustes', 'Tu negocio, tu agente y cómo cobra'],
}

const TAG_COLORS: Record<string, [string, string]> = {
  'Confirmada': [R.jade, R.jadeTint],
  'Sentados': [R.dusk, '#EAECEF'],
  'En curso': [R.dusk, '#EAECEF'],
  'Por confirmar': [R.amberDeep, R.amberTint],
  'Zarpó': [R.inkSoft, R.bgAlt],
  'En abordaje': ['#16614c', R.jadeTint],
}

// ── Onboarding ─────────────────────────────────────────────
const BIZ_TYPES = [
  { id: 'restaurante', label: 'Restaurante', icon: '🍽️', name: 'La Lupita Taco & Mezcal',
    services: ['Mesa estándar (2–4 personas)', 'Mesa terraza (vista)', 'Mezcal flight', 'Evento privado'],
    agent: '"Hola, soy el agente de {negocio}. Veo que buscas mesa para 2 esta noche — tenemos disponibilidad en terraza a las 20:30. ¿Te confirmo?"' },
  { id: 'bar', label: 'Bar / Vida nocturna', icon: '🍸', name: 'Cabo Azul Rooftop',
    services: ['Mesa lounge', 'Área VIP / servicio de botella', 'Barra (sin reserva)', 'Evento privado'],
    agent: '"Hola, soy el agente de {negocio}. Para esta noche tengo lounge para 4 a las 22:00 o zona VIP con botella. ¿Cuál te aparto?"' },
  { id: 'spa', label: 'Spa & Bienestar', icon: '💆', name: 'Sereno Spa & Temazcal',
    services: ['Masaje 80 min', 'Masaje en pareja', 'Temazcal (ceremonia)', 'Ritual día completo'],
    agent: '"Hola, soy el agente de {negocio}. Veo que buscas masaje en pareja hoy — tengo cabaña con vista al mar a las 16:00. ¿Te la reservo?"' },
  { id: 'medico', label: 'Médico / Clínica', icon: '🏥', name: 'Clínica Costa Médica',
    services: ['Consulta general', 'Consulta de especialidad', 'Estudios de laboratorio', 'Chequeo preventivo'],
    agent: '"Hola, soy el asistente de {negocio}. Para consulta general tengo espacio hoy a las 17:30 con el Dr. Núñez. ¿Agendo tu cita?"' },
  { id: 'dentista', label: 'Dentista', icon: '🦷', name: 'Dental Cabo Sonríe',
    services: ['Limpieza dental', 'Consulta / valoración', 'Blanqueamiento', 'Urgencia dental'],
    agent: '"Hola, soy el asistente de {negocio}. Para limpieza tengo espacio mañana a las 10:00. ¿Te agendo la cita?"' },
  { id: 'legal', label: 'Despacho legal', icon: '⚖️', name: 'Bufete Marina Legal',
    services: ['Consulta inicial', 'Asesoría inmobiliaria', 'Constitución de empresa', 'Revisión de contrato'],
    agent: '"Hola, soy el asistente de {negocio}. Para una consulta inicial tengo disponibilidad el jueves a las 11:00. ¿La aparto?"' },
  { id: 'inmobiliaria', label: 'Inmobiliaria', icon: '🏠', name: 'Cabo Real Estate',
    services: ['Visita a propiedad', 'Asesoría de compra', 'Avalúo', 'Renta vacacional'],
    agent: '"Hola, soy el agente de {negocio}. Puedo agendarte una visita a la propiedad de Pedregal mañana a las 12:00. ¿Te va bien?"' },
  { id: 'salon', label: 'Salón / Barbería', icon: '✂️', name: 'Studio Cabo Hair',
    services: ['Corte', 'Color / tinte', 'Peinado', 'Barba / afeitado'],
    agent: '"Hola, soy el asistente de {negocio}. Para corte tengo espacio hoy a las 18:00 con Andrea. ¿Te lo aparto?"' },
  { id: 'tours', label: 'Tours & Experiencias', icon: '🚣', name: 'Cabo Adventures Tours',
    services: ['Tour en yate', 'Snorkel / buceo', 'Avistamiento de ballenas', 'Experiencia privada'],
    agent: '"Hola, soy el agente de {negocio}. Para el tour en yate tengo lugares mañana a las 9:00, salida desde la marina. ¿Reservo 2?"' },
  { id: 'gym', label: 'Gimnasio / Estudio', icon: '💪', name: 'Pulse Fit Studio',
    services: ['Clase grupal', 'Sesión con entrenador', 'Pase de día', 'Membresía mensual'],
    agent: '"Hola, soy el asistente de {negocio}. Para la clase de funcional tengo cupo hoy a las 19:00. ¿Te aparto tu lugar?"' },
]

function BizOnboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [bizType, setBizType] = useState('restaurante')
  const [name, setName] = useState(BIZ_TYPES[0].name)
  const [nameEdited, setNameEdited] = useState(false)
  const [services, setServices] = useState(() => BIZ_TYPES[0].services.map(s => ({ name: s, desc: '', price: '', tax: 'IVA 16% incluido', on: true })))
  const [draft, setDraft] = useState({ name: '', desc: '', price: '', tax: '' })
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [agentMsg, setAgentMsg] = useState(() => BIZ_TYPES[0].agent.replace('{negocio}', BIZ_TYPES[0].name))
  const [agentEdited, setAgentEdited] = useState(false)
  const [payMode, setPayMode] = useState<'none' | 'deposit'>('none')
  const [activating, setActivating] = useState(false)

  const bt = BIZ_TYPES.find(t => t.id === bizType) ?? BIZ_TYPES[0]
  const steps = ['Negocio', 'Servicios', 'Horarios', 'Agente IA', 'Pagos']

  // Reset service list when the business type changes
  useEffect(() => {
    const t = BIZ_TYPES.find(x => x.id === bizType) ?? BIZ_TYPES[0]
    setServices(t.services.map(s => ({ name: s, desc: '', price: '', tax: 'IVA 16% incluido', on: true })))
    setEditIdx(null)
  }, [bizType])

  // Keep the agent greeting in sync with the business name / type, unless the user edited it
  useEffect(() => {
    if (agentEdited) return
    const t = BIZ_TYPES.find(x => x.id === bizType) ?? BIZ_TYPES[0]
    setAgentMsg(t.agent.replace('{negocio}', name.trim() || t.name))
  }, [bizType, name, agentEdited])

  function resetAgentMsg() {
    setAgentEdited(false)
    setAgentMsg(bt.agent.replace('{negocio}', name.trim() || bt.name))
  }

  function pickType(t: typeof BIZ_TYPES[number]) {
    setBizType(t.id)
    if (!nameEdited) setName(t.name)
  }

  function toggleService(i: number) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, on: !s.on } : s))
  }
  function updateService(i: number, patch: Partial<{ name: string; desc: string; price: string; tax: string }>) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }
  function addService() {
    const name = draft.name.trim()
    if (!name) return
    setServices(prev => [...prev, { name, desc: draft.desc.trim(), price: draft.price.trim(), tax: draft.tax.trim(), on: true }])
    setDraft({ name: '', desc: '', price: '', tax: '' })
  }
  function removeService(i: number) {
    setServices(prev => prev.filter((_, idx) => idx !== i))
    setEditIdx(null)
  }

  const fieldStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }

  function activate() { setActivating(true); setTimeout(onDone, 2000) }

  return (
    <div style={{ minHeight: '100vh', background: R.dusk, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 500, background: R.bg, borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
        <div style={{ background: R.dusk, padding: '24px 24px 20px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: R.coral, display: 'grid', placeItems: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 17c0-4.4 3.2-8 7-8s7 3.6 7 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/><circle cx="12" cy="17" r="2.2" fill="#fff"/></svg>
            </div>
            <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 18 }}>Panel del Negocio</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {steps.map((_, i) => <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: i <= step ? R.coral : 'rgba(255,255,255,.2)' }} />)}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>Paso {step + 1} de {steps.length}: {steps[step]}</p>
        </div>

        <div style={{ padding: 24 }}>
          {activating ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: R.coralTint, display: 'grid', placeItems: 'center', margin: '0 auto 16px', animation: 'pulse 1.4s infinite' }}>
                <svg width="36" height="36" viewBox="0 0 24 24"><path d="M5 17c0-4.4 3.2-8 7-8s7 3.6 7 8" fill="none" stroke={R.coral} strokeWidth="2.6" strokeLinecap="round"/><circle cx="12" cy="17" r="2.2" fill={R.coral}/></svg>
              </div>
              <p style={{ fontFamily: R.display, fontWeight: 800, fontSize: 18, color: R.ink, marginBottom: 4 }}>Activando tu agente…</p>
              <p style={{ fontSize: 13.5, color: R.inkSoft }}>Entrenando con tus datos, ya casi.</p>
            </div>
          ) : step === 0 ? (
            <>
              <h2 style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink, marginBottom: 18 }}>Cuéntanos de tu negocio</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 8 }}>Nombre del negocio</label>
                <input value={name} onChange={e => { setName(e.target.value); setNameEdited(true) }} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 8 }}>Tipo de negocio</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {BIZ_TYPES.map(t => (
                    <button key={t.id} onClick={() => pickType(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, border: `1px solid ${bizType === t.id ? R.coral : R.line}`, background: bizType === t.id ? R.coralTint : R.surface, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left' }}>
                      <span style={{ fontSize: 20 }}>{t.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: bizType === t.id ? R.coralPress : R.ink }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(1)} style={primaryBtn}>Continuar →</button>
            </>
          ) : step === 1 ? (
            <>
              <h2 style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink, marginBottom: 4 }}>Tus servicios</h2>
              <p style={{ fontSize: 13.5, color: R.inkSoft, marginBottom: 16 }}>Toca para activar o desactivar. Agrega los tuyos abajo con precio e impuestos.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {services.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: editIdx === i ? 'stretch' : 'center', gap: 12, padding: 14, border: `1px solid ${s.on ? R.coral : R.line}`, borderRadius: 12, background: s.on ? R.coralTint : R.surface }}>
                    {editIdx === i ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                        <input value={s.name} onChange={e => updateService(i, { name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') setEditIdx(null) }} placeholder="Título del servicio" style={fieldStyle} />
                        <input value={s.desc} onChange={e => updateService(i, { desc: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') setEditIdx(null) }} placeholder="Descripción (ej. 80 min · vista al mar)" style={fieldStyle} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input value={s.price} onChange={e => updateService(i, { price: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') setEditIdx(null) }} placeholder="Precio (ej. $2,400)" style={fieldStyle} />
                          <input value={s.tax} onChange={e => updateService(i, { tax: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') setEditIdx(null) }} placeholder="Impuestos (ej. IVA 16%)" style={fieldStyle} />
                        </div>
                        <button onClick={() => setEditIdx(null)} style={{ alignSelf: 'flex-end', border: 'none', borderRadius: 10, padding: '9px 18px', background: R.coral, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, color: '#fff' }}>Listo</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => toggleService(i)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: R.ui, textAlign: 'left', padding: 0 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.on ? R.coral : 'transparent', border: s.on ? 'none' : `2px solid ${R.line}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            {s.on && <Icon n="check" size={12} color="#fff" stroke={3} />}
                          </div>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, color: s.on ? R.ink : R.inkSoft, fontWeight: s.on ? 600 : 500 }}>{s.name}</span>
                              {s.price && <span style={{ fontSize: 13, fontWeight: 700, color: s.on ? R.coralPress : R.inkSoft }}>{s.price}</span>}
                            </span>
                            {(s.desc || s.tax) && <span style={{ fontSize: 12, color: R.inkSoft }}>{[s.desc, s.tax].filter(Boolean).join(' · ')}</span>}
                          </span>
                        </button>
                        <button onClick={() => setEditIdx(i)} aria-label="Editar servicio" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 4, flexShrink: 0 }}>
                          <Icon n="edit" size={16} color={R.inkSoft} />
                        </button>
                        <button onClick={() => removeService(i)} aria-label="Eliminar servicio" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 20, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>×</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ border: `1px dashed ${R.line}`, borderRadius: 14, padding: 14, marginBottom: 24, background: R.bgAlt }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Nuevo servicio</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') addService() }} placeholder="Título del servicio" style={fieldStyle} />
                  <input value={draft.desc} onChange={e => setDraft({ ...draft, desc: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') addService() }} placeholder="Descripción (ej. 80 min · vista al mar)" style={fieldStyle} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') addService() }} placeholder="Precio (ej. $2,400)" style={fieldStyle} />
                    <input value={draft.tax} onChange={e => setDraft({ ...draft, tax: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') addService() }} placeholder="Impuestos (ej. IVA 16%)" style={fieldStyle} />
                  </div>
                  <button onClick={addService} disabled={!draft.name.trim()} style={{ border: `1px solid ${R.coral}`, borderRadius: 10, padding: '11px 14px', background: draft.name.trim() ? R.coral : R.coralTint, cursor: draft.name.trim() ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: draft.name.trim() ? '#fff' : R.coralPress }}>+ Agregar servicio</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} style={ghostBtn}>← Atrás</button>
                <button onClick={() => setStep(2)} style={{ ...primaryBtn, flex: 1 }}>Continuar →</button>
              </div>
            </>
          ) : step === 2 ? (
            <>
              <h2 style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink, marginBottom: 16 }}>Horarios</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[['Apertura', '13:00'], ['Cierre', '23:00']].map(([lbl, val]) => (
                  <div key={lbl}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 8 }}>{lbl}</label>
                    <input type="time" defaultValue={val} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 12, padding: '12px 14px', fontSize: 14.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={ghostBtn}>← Atrás</button>
                <button onClick={() => setStep(3)} style={{ ...primaryBtn, flex: 1 }}>Continuar →</button>
              </div>
            </>
          ) : step === 3 ? (
            <>
              <h2 style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink, marginBottom: 6 }}>Tu agente de IA</h2>
              <p style={{ fontSize: 13.5, color: R.inkSoft, marginBottom: 16 }}>Reva va a negociar reservas en tiempo real por ti. Edita el saludo a tu manera.</p>
              <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: 16, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: R.coral, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 17c0-4.4 3.2-8 7-8s7 3.6 7 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/><circle cx="12" cy="17" r="2.2" fill="#fff"/></svg>
                  </div>
                  <textarea value={agentMsg} onChange={e => { setAgentMsg(e.target.value); setAgentEdited(true) }} rows={4} style={{ background: R.bgAlt, border: 'none', borderRadius: 14, borderTopLeftRadius: 4, padding: '12px 14px', fontSize: 13.5, color: R.ink, lineHeight: 1.5, flex: 1, resize: 'vertical', outline: 'none', fontFamily: R.ui, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: R.inkFaint }}>Toma el nombre de tu negocio automáticamente.</span>
                {agentEdited && <button onClick={resetAgentMsg} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.coralPress, fontFamily: R.ui, fontWeight: 700, fontSize: 12.5, padding: 0 }}>↺ Restablecer</button>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={ghostBtn}>← Atrás</button>
                <button onClick={() => setStep(4)} style={{ ...primaryBtn, flex: 1 }}>Continuar →</button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink, marginBottom: 6 }}>Pagos y cobros</h2>
              <p style={{ fontSize: 13.5, color: R.inkSoft, marginBottom: 16 }}>Define si cobras depósito al reservar.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {[
                  { id: 'none' as const, label: 'Sin depósito (confirmación inmediata)', sub: 'Recomendado para reservas rápidas' },
                  { id: 'deposit' as const, label: 'Depósito por reserva', sub: 'El huésped paga al confirmar' },
                ].map(o => {
                  const active = payMode === o.id
                  return (
                    <button key={o.id} onClick={() => setPayMode(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, border: `1px solid ${active ? R.coral : R.line}`, background: active ? R.coralTint : R.surface, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left', width: '100%' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? R.coral : R.line}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {active && <div style={{ width: 10, height: 10, borderRadius: '50%', background: R.coral }} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: active ? R.coralPress : R.ink }}>{o.label}</p>
                        <p style={{ fontSize: 12, color: R.inkSoft, marginTop: 2 }}>{o.sub}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(3)} style={ghostBtn}>← Atrás</button>
                <button onClick={activate} style={{ ...primaryBtn, flex: 1, background: R.jade }}>Activar agente y entrar</button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '13px', background: R.coral, color: '#fff', border: 'none', borderRadius: 14,
  fontFamily: R.ui, fontWeight: 700, fontSize: 15, cursor: 'pointer',
}
const ghostBtn: React.CSSProperties = {
  padding: '13px 18px', background: 'transparent', color: R.inkSoft, border: `1px solid ${R.line}`, borderRadius: 14,
  fontFamily: R.ui, fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
}

// ── UI Primitives ──────────────────────────────────────────
function BCard({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return <div onClick={onClick} style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 18, padding: '20px 22px', ...style }}>{children}</div>
}

function BMetric({ label, value, delta, up, tint, icon }: { label: string; value: string | number; delta?: string; up?: boolean; tint: string; icon: React.ReactNode }) {
  return (
    <div style={{ flex: 1, background: R.surface, border: `1px solid ${R.line}`, borderRadius: 18, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: tint, display: 'grid', placeItems: 'center' }}>{icon}</div>
        {delta && <span style={{ fontSize: 12, fontWeight: 700, color: up ? '#16614c' : R.coralPress, background: up ? R.jadeTint : R.coralTint, padding: '3px 9px', borderRadius: 999 }}>▲ {delta}</span>}
      </div>
      <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 28, color: R.ink, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 4 }}>{label}</div>
    </div>
  )
}

function ViaChip({ via }: { via: string }) {
  const isE = via === 'Explorer'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: isE ? R.coralTint : R.jadeTint, color: isE ? R.coralPress : '#16614c' }}>
      <Icon n={isE ? 'globe' : 'home'} size={11} color={isE ? R.coral : R.jade} /> Reva · {via}
    </span>
  )
}

function StateChip({ state }: { state: string }) {
  const cfg = state === 'negotiating'
    ? { label: 'Reva negociando', bg: R.amberTint, color: R.amberDeep }
    : state === 'auto'
    ? { label: 'Auto-confirmable', bg: R.jadeTint, color: '#16614c' }
    : { label: 'Acción requerida', bg: R.coralTint, color: R.coralPress }
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

function GuestAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: 38, height: 38, borderRadius: '50%', background: R.bgAlt, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 700, fontSize: 14, color: R.inkSoft, flexShrink: 0 }}>{initials}</div>
  )
}

function TagBadge({ tag }: { tag: string }) {
  const [color, bg] = TAG_COLORS[tag] ?? [R.inkSoft, R.bgAlt]
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>{tag}</span>
  )
}

// ── Views ──────────────────────────────────────────────────
function RequestsView({ vert, onGo }: { vert: Vert; onGo: (v: string) => void }) {
  const m = vert.metrics
  const [reqs, setReqs] = useState(vert.requests)

  return (
    <div style={{ flex: 1, minHeight: 0, padding: '24px 28px', display: 'flex', gap: 24, boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* 3 metrics */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexShrink: 0 }}>
          <BMetric label="Reservas hoy" value={m.reservasHoy} delta="22%" up tint={R.coralTint} icon={<Icon n="cal" size={20} color={R.coral} />} />
          <BMetric label="Ingreso atribuido" value={m.ingreso} delta="11%" up tint={R.jadeTint} icon={<Icon n="bolt" size={20} color={R.jade} />} />
          <BMetric label="Vía Reva" value={`${m.viaReva}%`} tint={R.amberTint} icon={<Icon n="spark" size={20} color={R.amber} />} />
        </div>

        {/* Requests */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexShrink: 0 }}>
          <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Entrantes</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '3px 9px', borderRadius: 999 }}>{reqs.length} nuevas</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
          {reqs.map(r => (
            <BCard key={r.id} style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <GuestAvatar name={r.who} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15.5, color: R.ink }}>{r.who}</span>
                    <ViaChip via={r.via} />
                  </div>
                  <div style={{ fontSize: 13, color: R.inkSoft, marginTop: 3 }}>
                    {r.when} · {r.time} · {r.party} {vert.unit} · <span style={{ color: R.ink }}>{r.note}</span>
                  </div>
                </div>
                <StateChip state={r.state} />
              </div>
              <div style={{ display: 'flex', gap: 9, marginTop: 14, paddingLeft: 50, alignItems: 'center' }}>
                {r.state === 'auto' ? (
                  <span style={{ fontSize: 13, color: R.inkSoft, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon n="check" size={15} color={R.jade} stroke={3} />
                    Reva confirmará automáticamente en 30 s ·
                    <button onClick={() => setReqs(rs => rs.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: R.coral, fontFamily: R.ui, fontSize: 13, padding: 0 }}>revisar</button>
                  </span>
                ) : (
                  <>
                    <button style={{ padding: '9px 18px', background: R.coral, color: '#fff', border: 'none', borderRadius: 999, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Abrir negociación</button>
                    <button onClick={() => setReqs(rs => rs.filter(x => x.id !== r.id))} style={{ padding: '9px 18px', background: R.bgAlt, color: R.ink, border: 'none', borderRadius: 999, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Ver detalle</button>
                  </>
                )}
              </div>
            </BCard>
          ))}
          {reqs.length === 0 && (
            <BCard style={{ textAlign: 'center', padding: '44px 0', color: R.inkSoft }}>
              <Icon n="check" size={28} color={R.jade} stroke={2.4} /> Todo atendido. Reva sigue trabajando por ti.
            </BCard>
          )}
        </div>
        {/* Destacado upsell */}
        <div onClick={() => onGo('destacado')} style={{ cursor: 'pointer', flexShrink: 0, marginTop: 16, borderRadius: 18, background: `linear-gradient(120deg, ${R.dusk}, ${R.duskSoft})`, color: '#fff', display: 'flex', alignItems: 'center', gap: 20, padding: '18px 24px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,.14)', padding: '4px 10px', borderRadius: 999 }}>
              <Icon n="spark" size={12} color="#fff" fill="#fff" /> Destacado
            </div>
            <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 20, marginTop: 12 }}>Aparece primero esta semana</div>
            <div style={{ fontSize: 13.5, opacity: .82, marginTop: 5 }}>Reva lo marca como Destacado — siempre honesto. Promedio +38% de solicitudes.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, fontWeight: 700, fontSize: 14 }}>
            Comprar slot <Icon n="arrowR" size={18} color="#fff" />
          </div>
        </div>
      </div>

      {/* Agenda mini sidebar */}
      <div style={{ width: 300, flexShrink: 0, overflowY: 'auto' }}>
        <BCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Agenda de hoy</span>
            <button onClick={() => onGo('agenda')} style={{ background: 'none', border: 'none', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, color: R.coral, cursor: 'pointer', padding: 0 }}>Ver todo</button>
          </div>
          {vert.agenda.slice(0, 5).map((a, i, arr) => {
            const [tc] = TAG_COLORS[a.tag] ?? [R.inkSoft]
            return (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 16 }}>
                <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 13.5, color: R.ink, width: 42, flexShrink: 0, paddingTop: 1 }}>{a.time}</div>
                <div style={{ position: 'relative', flexShrink: 0, width: 10 }}>
                  <span style={{ position: 'absolute', left: 1, top: 4, width: 8, height: 8, borderRadius: '50%', background: tc }} />
                  {i < arr.length - 1 && <span style={{ position: 'absolute', left: 4.5, top: 14, bottom: -12, width: 1.5, background: R.line }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{a.who}</div>
                  <div style={{ fontSize: 12, color: R.inkSoft, marginTop: 1 }}>{a.party} {vert.unit} · {a.resource}</div>
                  <TagBadge tag={a.tag} />
                </div>
              </div>
            )
          })}
        </BCard>
      </div>
    </div>
  )
}

const WEEK_SAMPLE: Record<number, { time: string; who: string; tag: string }[]> = {
  8: [{ time: '14:00', who: 'Pedro G.', tag: 'Confirmada' }, { time: '20:30', who: 'Lucía R.', tag: 'Confirmada' }],
  9: [{ time: '13:30', who: 'Marina T.', tag: 'Confirmada' }],
  10: [{ time: '19:00', who: 'Carlos V.', tag: 'Confirmada' }, { time: '21:00', who: 'Ana P.', tag: 'Por confirmar' }],
  11: [{ time: '14:30', who: 'Diego F.', tag: 'Confirmada' }],
  12: [{ time: '20:00', who: 'Sara M.', tag: 'Confirmada' }, { time: '21:30', who: 'Eva L.', tag: 'Por confirmar' }],
  14: [{ time: '13:00', who: 'Nora B.', tag: 'Confirmada' }],
}

const MONTH_COUNTS: Record<number, number> = {
  2: 2, 4: 1, 5: 3, 6: 1, 9: 1, 10: 2, 11: 1, 12: 2, 14: 1,
  16: 2, 17: 3, 19: 1, 20: 4, 21: 1, 23: 2, 24: 1, 26: 5, 27: 2, 28: 1, 30: 2,
}

type AgItem = { time: string; who: string; party: number; tag: string; resource: string; service?: string; durationMin?: number; note?: string }
type SelRes = { time: string; who: string; party?: number; tag: string; resource?: string; service?: string; durationMin?: number; note?: string; idx: number | null }

function AgendaView({ vert }: { vert: Vert }) {
  const [mode, setMode] = useState<'dia' | 'semana' | 'mes'>('dia')
  const [agenda, setAgenda] = useState<AgItem[]>(vert.agenda as AgItem[])
  const [sel, setSel] = useState<SelRes | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todas')
  const modes: [typeof mode, string][] = [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']]
  const title = mode === 'dia' ? 'Hoy · Sábado 13 jun' : mode === 'semana' ? '8 – 14 jun · Esta semana' : 'Junio 2026'

  useEffect(() => { setAgenda(vert.agenda as AgItem[]); setSel(null) }, [vert.id])

  const statuses = ['Todas', ...Array.from(new Set(agenda.map(a => a.tag)))]
  const rows = agenda
    .map((a, idx) => ({ a, idx }))
    .filter(({ a }) => (statusFilter === 'Todas' || a.tag === statusFilter) && a.who.toLowerCase().includes(query.trim().toLowerCase()))

  function setStatus(tag: string) {
    if (sel?.idx == null) return
    const i = sel.idx
    setAgenda(prev => prev.map((a, idx) => idx === i ? { ...a, tag } : a))
    setSel(s => s ? { ...s, tag } : s)
  }
  function cancelRes() {
    if (sel?.idx == null) return
    const i = sel.idx
    setAgenda(prev => prev.filter((_, idx) => idx !== i))
    setSel(null)
  }

  const [stc, stb] = sel ? (TAG_COLORS[sel.tag] ?? [R.inkSoft, R.bgAlt]) : [R.inkSoft, R.bgAlt]

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, padding: '24px 28px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 18, color: R.ink }}>{title}</div>
        <div style={{ display: 'flex', gap: 4, background: R.bgAlt, borderRadius: 999, padding: 4 }}>
          {modes.map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)} style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, background: mode === id ? R.surface : 'transparent', color: mode === id ? R.ink : R.inkSoft, boxShadow: mode === id ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{label}</button>
          ))}
        </div>
      </div>
      {mode === 'dia' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: R.surface, border: `1px solid ${R.line}`, borderRadius: 12, padding: '9px 12px', flex: '1 1 240px', maxWidth: 320 }}>
            <Icon n="search" size={16} color={R.inkFaint} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre…" style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: R.ui, fontSize: 14, color: R.ink, width: '100%' }} />
            {query && <button onClick={() => setQuery('')} aria-label="Limpiar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {statuses.map(s => {
              const on = statusFilter === s
              return <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, color: on ? R.coralPress : R.inkSoft, fontFamily: R.ui, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{s}</button>
            })}
          </div>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {mode === 'dia' && <DayAgenda rows={rows} unit={vert.unit} onSelect={(a, i) => setSel({ ...a, idx: i })} />}
        {mode === 'semana' && <WeekAgenda agenda={agenda} onSelect={setSel} />}
        {mode === 'mes' && <MonthAgenda todayCount={agenda.length} />}
      </div>

      {sel && (
        <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink }}>{sel.who}</div>
                <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11.5, fontWeight: 700, color: stc, background: stb, padding: '4px 11px', borderRadius: 999 }}>{sel.tag}</span>
              </div>
              <button onClick={() => setSel(null)} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: R.surface, border: `1px solid ${R.line}`, borderRadius: 12, overflow: 'hidden' }}>
              {sel.service && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px' }}><span style={{ fontSize: 13, color: R.inkSoft }}>Servicio</span><span style={{ fontSize: 13.5, fontWeight: 700, color: R.ink }}>{sel.service}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: sel.service ? `1px solid ${R.lineSoft}` : 'none' }}><span style={{ fontSize: 13, color: R.inkSoft }}>Hora</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{sel.time}</span></div>
              {!!sel.durationMin && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Termina</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{endTime(sel.time, sel.durationMin)} · {sel.durationMin} min</span></div>}
              {!!sel.party && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Personas</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{sel.party}</span></div>}
              {sel.resource && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Zona</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{sel.resource}</span></div>}
              {sel.note && <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Nota</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink, textAlign: 'right' }}>{sel.note}</span></div>}
            </div>
            {sel.idx !== null ? (
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                {sel.tag === 'Confirmada' ? (
                  <button onClick={() => setStatus('Sentados')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: R.dusk, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: '#fff' }}>Marcar sentados</button>
                ) : sel.tag !== 'Sentados' && (
                  <button onClick={() => setStatus('Confirmada')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: R.jade, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: '#fff' }}>Confirmar</button>
                )}
                <button onClick={cancelRes} style={{ padding: '12px 16px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: R.coralPress }}>Cancelar reserva</button>
              </div>
            ) : (
              <button onClick={() => setSel(null)} style={{ marginTop: 18, width: '100%', padding: '12px', border: 'none', borderRadius: 12, background: R.coral, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5, color: '#fff' }}>Cerrar</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DayAgenda({ rows, unit, onSelect }: { rows: { a: AgItem; idx: number }[]; unit: string; onSelect: (a: AgItem, i: number) => void }) {
  return (
    <BCard>
      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: R.inkSoft, fontSize: 14 }}>No hay reservas que coincidan con tu búsqueda.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map(({ a, idx }, i) => {
            const [tc, tb] = TAG_COLORS[a.tag] ?? [R.inkSoft, R.bgAlt]
            return (
              <div key={idx} onClick={() => onSelect(a, idx)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 12px', margin: '0 -12px', borderRadius: 12, cursor: 'pointer', borderTop: i ? `1px solid ${R.lineSoft}` : 'none' }}>
                <div style={{ width: 56, flexShrink: 0 }}>
                  <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15, color: R.ink }}>{a.time}</div>
                  {a.durationMin ? <div style={{ fontSize: 11.5, fontWeight: 600, color: R.inkFaint, marginTop: 1 }}>{endTime(a.time, a.durationMin)}</div> : null}
                </div>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: tc, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: R.display, fontWeight: 600, fontSize: 15, color: R.ink }}>{a.who}</div>
                  <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.service ? `${a.service}${a.resource ? ` · ${a.resource}` : ''}` : a.resource}</div>
                </div>
                <span style={{ fontSize: 13, color: R.inkSoft }}>{a.party} {unit}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: tc, background: tb, padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>{a.tag}</span>
              </div>
            )
          })}
        </div>
      )}
    </BCard>
  )
}

function WeekAgenda({ agenda, onSelect }: { agenda: AgItem[]; onSelect: (s: SelRes) => void }) {
  const days = ([
    { lbl: 'Lun', date: 8 }, { lbl: 'Mar', date: 9 }, { lbl: 'Mié', date: 10 }, { lbl: 'Jue', date: 11 },
    { lbl: 'Vie', date: 12 }, { lbl: 'Sáb', date: 13, today: true }, { lbl: 'Dom', date: 14 },
  ] as { lbl: string; date: number; today?: boolean }[]).map(d => ({
    ...d,
    items: d.today
      ? agenda.map((a, idx): SelRes => ({ time: a.time, who: a.who, party: a.party, tag: a.tag, resource: a.resource, service: a.service, durationMin: a.durationMin, note: a.note, idx }))
      : (WEEK_SAMPLE[d.date] ?? []).map((s): SelRes => ({ time: s.time, who: s.who, tag: s.tag, idx: null })),
  }))

  return (
    <BCard style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {days.map(d => (
          <div key={d.date} style={{ background: d.today ? R.coralTint : R.bg, border: `1px solid ${d.today ? R.coral : R.line}`, borderRadius: 14, padding: 10, minHeight: 240, display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.04em' }}>{d.lbl}</div>
              <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 17, color: d.today ? R.coralPress : R.ink, marginTop: 2 }}>{d.date}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.items.map((it, i) => {
                const [tc, tb] = TAG_COLORS[it.tag] ?? [R.inkSoft, R.bgAlt]
                return (
                  <div key={i} onClick={() => onSelect(it)} style={{ borderRadius: 8, padding: '6px 8px', background: tb, borderLeft: `3px solid ${tc}`, cursor: 'pointer' }}>
                    <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 12, color: R.ink }}>{it.time}</div>
                    <div style={{ fontSize: 11.5, color: R.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.who}</div>
                  </div>
                )
              })}
              {d.items.length === 0 && <div style={{ textAlign: 'center', fontSize: 12, color: R.inkFaint, paddingTop: 12 }}>—</div>}
            </div>
          </div>
        ))}
      </div>
    </BCard>
  )
}

function MonthAgenda({ todayCount }: { todayCount: number }) {
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const today = 13
  const daysInMonth = 30 // junio 2026, empieza en lunes
  const cells: (number | null)[] = []
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <BCard style={{ padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {labels.map(l => (
          <div key={l} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.04em' }}>{l}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const isToday = day === today
          const count = isToday ? todayCount : (MONTH_COUNTS[day] ?? 0)
          return (
            <div key={i} style={{ minHeight: 86, border: `1px solid ${isToday ? R.coral : R.lineSoft}`, borderRadius: 10, padding: 8, background: isToday ? R.coralTint : R.surface, position: 'relative' }}>
              <div style={{ fontFamily: R.display, fontWeight: isToday ? 800 : 600, fontSize: 13.5, color: isToday ? R.coralPress : R.ink }}>{day}</div>
              {count > 0 && (
                <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {Array.from({ length: Math.min(count, 4) }).map((_, k) => (
                      <span key={k} style={{ width: 5, height: 5, borderRadius: '50%', background: isToday ? R.coral : R.jade }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: R.inkSoft }}>{count} {count === 1 ? 'reserva' : 'reservas'}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </BCard>
  )
}

type ThreadItem = { from: string; txt: string }
function MessagesView({ vert }: { vert: Vert }) {
  const [active, setActive] = useState(0)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [threads, setThreads] = useState(() => vert.messages.map(m => ({ ...m, thread: m.thread.map(x => ({ ...x })) })))
  const thread = threads[active]
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [active, threads])

  function appendToActive(item: ThreadItem) {
    setThreads(prev => prev.map((m, i) => i === active ? { ...m, thread: [...m.thread, item], last: item.txt, unread: false } : m))
  }

  function sendManual() {
    const txt = reply.trim()
    if (!txt || sending) return
    appendToActive({ from: 'biz', txt })
    setReply('')
  }

  async function replyWithAgent() {
    if (sending) return
    setSending(true)
    const t = threads[active]
    const mode: Mode = t.via === 'Explorer' ? 'explorer' : 'vecino'
    const apiMsgs = t.thread.map(x => ({
      role: (x.from === 'biz' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: x.from === 'reva' ? `[Reva] ${x.txt}` : x.txt,
    }))
    const depositItem = vert.catalog.find(c => c.price.includes('$') && /depósito/i.test(c.price))
    const depositAmount = depositItem ? Number((depositItem.price.match(/\d[\d,]*/)?.[0] ?? '').replace(/,/g, '')) || undefined : undefined
    try {
      const res = await fetch('/api/biz-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMsgs,
          bizName: vert.full,
          bizType: vert.kind,
          greeting: `Hola, soy el agente de ${vert.full}.`,
          services: vert.catalog.map(c => c.name),
          hours: vert.hours,
          depositPolicy: depositItem ? 'deposit' : 'none',
          depositAmount,
          mode,
        }),
      })
      if (!res.ok || !res.body) throw new Error('API error')
      // burbuja vacía que se va llenando
      setThreads(prev => prev.map((m, i) => i === active ? { ...m, thread: [...m.thread, { from: 'biz', txt: '' }] } : m))
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const delta: string = JSON.parse(data).choices?.[0]?.delta?.content ?? ''
            if (delta) {
              acc += delta
              setThreads(prev => prev.map((m, i) => {
                if (i !== active) return m
                const tc = [...m.thread]
                tc[tc.length - 1] = { from: 'biz', txt: acc }
                return { ...m, thread: tc, last: acc }
              }))
            }
          } catch { /* skip */ }
        }
      }
      if (!acc) {
        setThreads(prev => prev.map((m, i) => i === active ? { ...m, thread: m.thread.slice(0, -1) } : m))
        appendToActive({ from: 'biz', txt: 'No pude generar la respuesta — revisa la conexión de OpenRouter en Ajustes.' })
      }
    } catch {
      appendToActive({ from: 'biz', txt: 'No pude generar la respuesta — revisa la conexión de OpenRouter en Ajustes.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* thread list */}
      <div style={{ width: 240, borderRight: `1px solid ${R.line}`, overflow: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${R.line}` }}>
          <p style={{ fontFamily: R.display, fontWeight: 700, fontSize: 14, color: R.ink }}>Mensajes</p>
        </div>
        {threads.map((m, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: '100%', textAlign: 'left', padding: '14px 16px', borderBottom: `1px solid ${R.lineSoft}`, background: active === i ? R.coralTint : 'transparent', border: 'none', cursor: 'pointer', fontFamily: R.ui }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: m.unread ? R.ink : R.inkSoft }}>{m.who}</span>
              <span style={{ fontSize: 11, color: R.inkFaint }}>{m.time}</span>
            </div>
            <p style={{ fontSize: 12.5, color: R.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.last}</p>
            {m.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: R.coral, marginTop: 6 }} />}
          </button>
        ))}
      </div>
      {/* thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${R.line}` }}>
          <p style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15, color: R.ink }}>{thread.who}</p>
          <p style={{ fontSize: 12.5, color: R.inkSoft }}>vía Reva · {thread.via}</p>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {thread.thread.map((t, i) => (
            <div key={i} style={{ alignSelf: t.from === 'biz' ? 'flex-end' : t.from === 'reva' ? 'center' : 'flex-start', maxWidth: '80%', background: t.from === 'biz' ? R.coral : t.from === 'reva' ? R.amberTint : R.surface, color: t.from === 'biz' ? '#fff' : t.from === 'reva' ? R.amberDeep : R.ink, border: t.from === 'guest' ? `1px solid ${R.line}` : 'none', borderRadius: 14, borderBottomRightRadius: t.from === 'biz' ? 4 : 14, borderBottomLeftRadius: t.from === 'guest' ? 4 : 14, padding: '10px 14px', fontSize: 13.5, lineHeight: 1.4 }}>
              {t.from === 'reva' && <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', display: 'block', marginBottom: 3, color: R.amberDeep }}>REVA</span>}
              {t.txt || <span style={{ opacity: .5 }}>escribiendo…</span>}
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${R.line}` }}>
          <button onClick={replyWithAgent} disabled={sending} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: sending ? R.amberTint : R.bgAlt, border: `1px solid ${R.line}`, borderRadius: 12, padding: '10px 14px', cursor: sending ? 'default' : 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13, color: sending ? R.amberDeep : R.ink, marginBottom: 10 }}>
            <Icon n="spark" size={15} color={sending ? R.amberDeep : R.coral} /> {sending ? 'El agente está escribiendo…' : 'Responder con el agente'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendManual() }} placeholder="Responder a mano…"
              style={{ flex: 1, background: R.bgAlt, border: `1px solid ${R.line}`, borderRadius: 999, padding: '10px 16px', fontSize: 13.5, color: R.ink, fontFamily: R.ui, outline: 'none' }} />
            <button onClick={sendManual} style={{ width: 40, height: 40, borderRadius: '50%', background: R.coral, border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon n="send" size={16} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniBar({ values, color, highlight }: { values: number[]; color: string; highlight?: number }) {
  const max = Math.max(...values, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 3, background: i === highlight ? color : `${color}40`, height: `${Math.max(4, (v / max) * 100)}%` }} />
      ))}
    </div>
  )
}

function MetricsView({ vert }: { vert: Vert }) {
  const m = vert.metrics
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [hoveredRev, setHoveredRev] = useState<number | null>(null)

  const avgTicket = vert.id === 'resto' ? 420 : 1850
  const base7 = m.trend
  const base30 = Array.from({ length: 30 }, (_, i) => Math.round((base7[i % 7] ?? 10) * (0.8 + Math.sin(i * 0.4) * 0.2)))
  const base90 = Array.from({ length: 90 }, (_, i) => Math.round((base7[i % 7] ?? 10) * (0.7 + Math.sin(i * 0.15) * 0.3 + i * 0.003)))

  const periodData = period === '7d' ? base7 : period === '30d' ? base30 : base90
  const labels7 = m.trendLabels
  const labels30 = Array.from({ length: 30 }, (_, i) => i % 7 === 0 ? `S${Math.floor(i / 7) + 1}` : '')
  const labels90 = Array.from({ length: 90 }, (_, i) => i % 30 === 0 ? `M${i / 30 + 1}` : '')
  const periodLabels = period === '7d' ? labels7 : period === '30d' ? labels30 : labels90

  const totalRes = periodData.reduce((a, b) => a + b, 0)
  const revenueData = periodData.map(v => v * avgTicket)
  const totalRev = revenueData.reduce((a, b) => a + b, 0)
  const maxRes = Math.max(...periodData, 1)
  const maxRev = Math.max(...revenueData, 1)
  const showEvery = period === '7d' ? 1 : period === '30d' ? 5 : 15
  const barGap = period === '7d' ? 14 : period === '30d' ? 6 : 3
  const barRadius = period === '7d' ? 9 : 5

  const periodDelta: Record<string, { res: string; rev: string }> = {
    '7d': { res: '19%', rev: '11%' }, '30d': { res: '14%', rev: '9%' }, '90d': { res: '22%', rev: '17%' },
  }
  const delta = periodDelta[period]
  const fmtRev = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`

  const viaReva = m.viaReva
  const direct = 100 - viaReva

  const insights = [
    { icon: 'bolt', color: R.jade, tint: R.jadeTint, text: `Sábado es tu día pico — ${Math.max(...base7)} reservas esta semana` },
    { icon: 'users', color: '#5A6FD6', tint: '#ECEFFE', text: `${viaReva}% de tus clientes llegan vía Reva` },
    { icon: 'spark', color: R.amber, tint: R.amberTint, text: `${m.rove} boletos Reva+ activos · ${Math.round(m.rove * 0.12)} canjes este mes` },
  ]

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['7d', '30d', '90d'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: period === p ? R.ink : R.bgAlt, color: period === p ? '#fff' : R.inkSoft,
          }}>{p === '7d' ? 'Últimos 7 días' : p === '30d' ? 'Últimos 30 días' : 'Últimos 90 días'}</button>
        ))}
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: R.coralTint, display: 'grid', placeItems: 'center' }}><Icon n="cal" size={20} color={R.coral} /></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16614c', background: R.jadeTint, padding: '3px 9px', borderRadius: 999 }}>▲ {delta.res}</span>
          </div>
          <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 28, color: R.ink, lineHeight: 1 }}>{totalRes}</div>
          <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 4 }}>Reservas</div>
          <div style={{ marginTop: 10 }}><MiniBar values={base7} color={R.coral} highlight={base7.indexOf(Math.max(...base7))} /></div>
        </div>

        <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: R.jadeTint, display: 'grid', placeItems: 'center' }}><Icon n="bolt" size={20} color={R.jade} /></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16614c', background: R.jadeTint, padding: '3px 9px', borderRadius: 999 }}>▲ {delta.rev}</span>
          </div>
          <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 28, color: R.ink, lineHeight: 1 }}>{fmtRev(totalRev)}</div>
          <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 4 }}>Ingreso atribuido</div>
          <div style={{ marginTop: 10 }}><MiniBar values={base7.map(v => v * avgTicket)} color={R.jade} highlight={base7.indexOf(Math.max(...base7))} /></div>
        </div>

        <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: R.amberTint, display: 'grid', placeItems: 'center' }}><Icon n="spark" size={20} color={R.amber} /></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16614c', background: R.jadeTint, padding: '3px 9px', borderRadius: 999 }}>▲ 6%</span>
          </div>
          <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 28, color: R.ink, lineHeight: 1 }}>{m.viaReva}%</div>
          <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 4 }}>Vía Reva</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 4, height: 6 }}>
            <div style={{ flex: m.viaReva, background: R.amber, borderRadius: 999 }} />
            <div style={{ flex: 100 - m.viaReva, background: R.bgAlt, borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10.5, color: R.inkFaint }}>Reva</span>
            <span style={{ fontSize: 10.5, color: R.inkFaint }}>Directo</span>
          </div>
        </div>

        <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: R.bgAlt, display: 'grid', placeItems: 'center' }}><Icon n="ticket" size={20} color={R.amberDeep} /></div>
          </div>
          <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 28, color: R.ink, lineHeight: 1 }}>{m.rove}</div>
          <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 4 }}>Boletos Reva+ activos</div>
          <div style={{ marginTop: 8, fontSize: 12, color: R.amberDeep, fontWeight: 600 }}>{Math.round(m.rove * 0.12)} canjes este mes</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <BCard style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Reservas por día</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: R.coral, background: R.coralTint, padding: '3px 10px', borderRadius: 999 }}>▲ {delta.res} vs ant.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: barGap, height: 160 }}>
            {periodData.map((v, i) => (
              <div key={i} onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: period === '7d' ? 7 : 4, height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'default' }}>
                {hoveredBar === i && <div style={{ position: 'absolute', top: 0, background: R.ink, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 10, transform: 'translateY(-4px)' }}>{v} res.</div>}
                {i % showEvery === 0 && <span style={{ fontSize: 11, fontWeight: 700, color: hoveredBar === i ? R.coral : R.ink }}>{v}</span>}
                <div style={{ width: '100%', maxWidth: period === '7d' ? 38 : undefined, height: `${Math.max(4, (v / maxRes) * 100)}%`, borderRadius: barRadius, background: hoveredBar === i ? R.coral : R.bgAlt, transition: 'background .1s' }} />
                {i % showEvery === 0 && <span style={{ fontSize: 11, color: R.inkFaint, fontWeight: 600 }}>{periodLabels[i]}</span>}
              </div>
            ))}
          </div>
        </BCard>

        <BCard style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Ingreso por día</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: R.jade, background: R.jadeTint, padding: '3px 10px', borderRadius: 999 }}>▲ {delta.rev} vs ant.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: barGap, height: 160 }}>
            {revenueData.map((v, i) => (
              <div key={i} onMouseEnter={() => setHoveredRev(i)} onMouseLeave={() => setHoveredRev(null)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: period === '7d' ? 7 : 4, height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'default' }}>
                {hoveredRev === i && <div style={{ position: 'absolute', top: 0, background: R.ink, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 10, transform: 'translateY(-4px)' }}>{fmtRev(v)}</div>}
                {i % showEvery === 0 && <span style={{ fontSize: 11, fontWeight: 700, color: hoveredRev === i ? R.jade : R.ink }}>{fmtRev(v)}</span>}
                <div style={{ width: '100%', maxWidth: period === '7d' ? 38 : undefined, height: `${Math.max(4, (v / maxRev) * 100)}%`, borderRadius: barRadius, background: hoveredRev === i ? R.jade : R.jadeTint, transition: 'background .1s' }} />
                {i % showEvery === 0 && <span style={{ fontSize: 11, color: R.inkFaint, fontWeight: 600 }}>{periodLabels[i]}</span>}
              </div>
            ))}
          </div>
        </BCard>
      </div>

      {/* Canal + Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <BCard style={{ padding: '22px 24px' }}>
          <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, marginBottom: 18 }}>Canal de reservas</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <svg width={80} height={80} viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
              <circle cx="40" cy="40" r="30" fill="none" stroke={R.bgAlt} strokeWidth="12" />
              <circle cx="40" cy="40" r="30" fill="none" stroke={R.amber} strokeWidth="12"
                strokeDasharray={`${(viaReva / 100) * 188.4} 188.4`} strokeLinecap="round"
                transform="rotate(-90 40 40)" />
              <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="800" fill={R.ink}>{viaReva}%</text>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: R.amber, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: R.ink, fontWeight: 600, flex: 1 }}>Vía Reva</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: R.ink }}>{viaReva}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: R.bgAlt, border: `2px solid ${R.line}`, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: R.inkSoft, fontWeight: 600, flex: 1 }}>Directo</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: R.inkSoft }}>{direct}%</span>
              </div>
              <div style={{ paddingTop: 10, borderTop: `1px solid ${R.line}`, fontSize: 12, color: R.inkSoft }}>
                {Math.round(totalRes * viaReva / 100)} de {totalRes} vía Reva
              </div>
            </div>
          </div>
        </BCard>

        <BCard style={{ padding: '22px 24px' }}>
          <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, marginBottom: 16 }}>Insights del período</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: ins.tint, borderRadius: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: ins.color + '22', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon n={ins.icon} size={17} color={ins.color} />
                </div>
                <span style={{ fontSize: 13, color: R.ink, lineHeight: 1.4 }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </BCard>
      </div>
    </div>
  )
}

const CATALOG_GRADS: [string, string][] = [
  ['#E27A52', '#B5472F'], ['#E9A24A', '#C25C3C'], ['#8B6CB0', '#4A3370'],
  ['#5FA6B0', '#2E6E78'], ['#C9A2B4', '#6E4A63'], ['#6E8FB0', '#33507A'],
]

type CatItem = { id?: string; name: string; sub: string; price: string; category?: string; grad: [string, string]; active: boolean; img?: string; duration?: number; scheduled?: boolean; days?: number[]; hours?: string; stock?: number }

// Maps a panel vertical id to its shared agenda/catalog key (see @/lib/data).
const SHARED_BIZ_ID: Record<string, string> = { resto: 'lupita', spa: 'sereno' }

// Weekday chips in display order (Mon→Sun), with their JS getDay() index.
const WEEKDAYS: { i: number; l: string }[] = [
  { i: 1, l: 'L' }, { i: 2, l: 'M' }, { i: 3, l: 'X' }, { i: 4, l: 'J' }, { i: 5, l: 'V' }, { i: 6, l: 'S' }, { i: 0, l: 'D' },
]
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
// Split a "HH:MM – HH:MM" range into [open, close] (handles – — or -).
function splitHours(h: string): [string, string] {
  const m = (h || '').match(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/)
  return m ? [m[1], m[2]] : ['', '']
}

function CatalogView({ vert, items, setItems }: { vert: Vert; items: CatItem[]; setItems: React.Dispatch<React.SetStateAction<CatItem[]>> }) {
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [vOpen, vClose] = splitHours(vert.hours)
  const [form, setForm] = useState({ name: '', sub: '', price: '', category: '', active: true, img: '', duration: '', scheduled: true, days: ALL_DAYS, open: vOpen, close: vClose, trackStock: false, stock: '' })
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('Todos')
  const [status, setStatus] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos')

  // Categorías ya usadas en el catálogo, para sugerir y reutilizar
  const knownCats = [...new Set(items.map(c => c.category?.trim()).filter(Boolean) as string[])]

  useEffect(() => { setEditing(null); setQuery(''); setCat('Todos'); setStatus('Todos') }, [vert.id])

  const q = query.trim().toLowerCase()
  const filtered = items.filter(c =>
    (cat === 'Todos' || c.category === cat) &&
    (status === 'Todos' || (status === 'Activos' ? c.active : !c.active)) &&
    (!q || (c.name + ' ' + c.sub + ' ' + (c.category ?? '')).toLowerCase().includes(q)))

  function openNew() {
    setForm({ name: '', sub: '', price: '', category: '', active: true, img: '', duration: '', scheduled: true, days: ALL_DAYS, open: vOpen, close: vClose, trackStock: false, stock: '' })
    setEditing('new')
  }
  function openEdit(i: number) {
    const c = items[i]
    const [o, cl] = splitHours(c.hours || vert.hours)
    setForm({ name: c.name, sub: c.sub, price: c.price, category: c.category ?? '', active: c.active, img: c.img ?? '', duration: c.duration ? String(c.duration) : '', scheduled: c.scheduled !== false, days: c.days ?? ALL_DAYS, open: o, close: cl, trackStock: typeof c.stock === 'number', stock: typeof c.stock === 'number' ? String(c.stock) : '' })
    setEditing(i)
  }
  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, img: reader.result as string }))
    reader.readAsDataURL(file)
  }
  function save() {
    if (!form.name.trim()) return
    const dur = parseInt(form.duration, 10)
    // Duration only matters for scheduled services; clear it otherwise.
    const duration = form.scheduled && Number.isFinite(dur) && dur > 0 ? dur : undefined
    const scheduled = form.scheduled ? undefined : false
    // Availability config only for scheduled services. Omit when it's the default.
    const days = form.scheduled && form.days.length > 0 && form.days.length < 7 ? [...form.days].sort() : undefined
    const ownHours = form.open && form.close ? `${form.open} – ${form.close}` : ''
    const hours = form.scheduled && ownHours && ownHours !== vert.hours ? ownHours : undefined
    // Inventario: número de unidades cuando se controla; undefined = ilimitado.
    const stk = parseInt(form.stock, 10)
    const stock = form.trackStock && Number.isFinite(stk) && stk >= 0 ? stk : undefined
    if (editing === 'new') {
      const grad = CATALOG_GRADS[items.length % CATALOG_GRADS.length]
      setItems(prev => [...prev, { name: form.name.trim(), sub: form.sub.trim(), price: form.price.trim() || 'Sin precio', category: form.category.trim() || undefined, grad, active: form.active, img: form.img || undefined, duration, scheduled, days, hours, stock }])
    } else if (typeof editing === 'number') {
      const existing = items[editing]
      // Persiste el inventario en Supabase si cambió (no-op en modo demo).
      if (existing?.id && (existing.stock ?? undefined) !== stock) void saveStock(existing.id, stock ?? null)
      setItems(prev => prev.map((c, idx) => idx === editing ? { ...c, name: form.name.trim(), sub: form.sub.trim(), price: form.price.trim() || 'Sin precio', category: form.category.trim() || undefined, active: form.active, img: form.img || undefined, duration, scheduled, days, hours, stock } : c))
    }
    setEditing(null)
  }
  function remove() {
    if (typeof editing === 'number') setItems(prev => prev.filter((_, idx) => idx !== editing))
    setEditing(null)
  }

  const fieldStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 18, color: R.ink }}>Catálogo</div>
          <div style={{ fontSize: 13.5, color: R.inkSoft }}>Lo que Reva puede ofrecer y reservar por ti</div>
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: R.ink, color: '#fff', border: 'none', borderRadius: 999, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
          <Icon n="plus" size={16} color="#fff" /> Agregar
        </button>
      </div>

      {/* Buscador + filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}><Icon n="search" size={16} color={R.inkFaint} /></span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar en el catálogo…"
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 999, padding: '11px 14px 11px 38px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: R.bgAlt, borderRadius: 999, padding: 4 }}>
          {(['Todos', 'Activos', 'Inactivos'] as const).map(s => {
            const on = status === s
            return (
              <button key={s} onClick={() => setStatus(s)}
                style={{ padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 12.5, background: on ? R.surface : 'transparent', color: on ? R.ink : R.inkSoft, boxShadow: on ? '0 1px 2px rgba(34,28,25,.08)' : 'none' }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {knownCats.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['Todos', ...knownCats].map(c => {
            const on = cat === c
            return (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding: '7px 14px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coral : R.surface, color: on ? '#fff' : R.inkSoft, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13 }}>
                {c}
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <BCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8, padding: '48px 0', color: R.inkSoft }}>
          <Icon n="search" size={26} color={R.inkFaint} />
          <div>No hay resultados con esos filtros.</div>
          {(query || cat !== 'Todos' || status !== 'Todos') && (
            <button onClick={() => { setQuery(''); setCat('Todos'); setStatus('Todos') }} style={{ marginTop: 4, padding: '8px 16px', background: R.bgAlt, border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13, color: R.inkSoft }}>Limpiar filtros</button>
          )}
        </BCard>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {filtered.map(c => (
          <BCard key={items.indexOf(c)} onClick={() => openEdit(items.indexOf(c))} style={{ padding: 0, overflow: 'hidden', display: 'flex', cursor: 'pointer' }}>
            <div style={{ width: 90, flexShrink: 0, background: c.img ? `center/cover no-repeat url(${c.img})` : `linear-gradient(140deg, ${c.grad[0]}, ${c.grad[1]})`, position: 'relative', opacity: c.active ? 1 : .5 }}>
              {!c.img && <div style={{ position: 'absolute', right: -4, bottom: -8, fontFamily: R.display, fontWeight: 800, fontSize: 52, color: 'rgba(255,255,255,.18)' }}>{vert.mono}</div>}
            </div>
            <div style={{ flex: 1, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15.5, color: R.ink }}>{c.name}</span>
                {c.category && <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, background: R.bgAlt, padding: '2px 8px', borderRadius: 999 }}>{c.category}</span>}
                {typeof c.stock === 'number' && (
                  c.stock === 0
                    ? <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: R.coralPress, background: R.coralTint, padding: '2px 8px', borderRadius: 999 }}>Agotado</span>
                    : <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: c.stock <= 3 ? R.amberDeep : R.jade, background: c.stock <= 3 ? R.amberTint : R.jadeTint, padding: '2px 8px', borderRadius: 999 }}>{c.stock} disp.</span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 2 }}>{c.sub}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 14, color: R.ink }}>{c.price}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: c.active ? R.jade : R.inkFaint, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.active ? R.jade : R.inkFaint }} /> {c.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </BCard>
        ))}
      </div>
      )}

      {editing !== null && (
        <div onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink }}>{editing === 'new' ? 'Nuevo servicio' : 'Editar servicio'}</span>
              <button onClick={() => setEditing(null)} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ position: 'relative', height: 120, borderRadius: 12, border: `1px dashed ${R.line}`, background: form.img ? `center/cover no-repeat url(${form.img})` : R.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {!form.img && (
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: R.inkSoft }}>
                    <Icon n="plus" size={22} color={R.inkSoft} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Subir imagen del servicio</span>
                  </span>
                )}
                {form.img && (
                  <span style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', gap: 6 }}>
                    <span style={{ background: 'rgba(34,28,25,.7)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>Cambiar</span>
                    <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setForm({ ...form, img: '' }) }} style={{ background: 'rgba(34,28,25,.7)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>Quitar</button>
                  </span>
                )}
                <input type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} />
              </label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del servicio" style={fieldStyle} />
              <input value={form.sub} onChange={e => setForm({ ...form, sub: e.target.value })} placeholder="Descripción (ej. 2–4 personas · Salón)" style={fieldStyle} />
              <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Precio (ej. $450 o Sin depósito)" style={fieldStyle} />

              {/* Calendar toggle: does this service take date + time bookings? */}
              <button onClick={() => setForm({ ...form, scheduled: !form.scheduled })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${form.scheduled ? R.coral : R.line}`, borderRadius: 10, background: form.scheduled ? R.coralTint : R.surface, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left' }}>
                <span style={{ minWidth: 0, paddingRight: 12 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: R.ink }}>Maneja calendario y horarios</span>
                  <span style={{ display: 'block', fontSize: 12, color: R.inkSoft, marginTop: 2 }}>El cliente elige fecha y hora. Apágalo para productos o cotizaciones.</span>
                </span>
                <span style={{ width: 34, height: 20, borderRadius: 999, background: form.scheduled ? R.coral : R.inkFaint, position: 'relative', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: form.scheduled ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
                </span>
              </button>
              {form.scheduled && (<>
                <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value.replace(/\D/g, '') })} inputMode="numeric" placeholder="Duración en minutos (ej. 90) — define los turnos" style={fieldStyle} />

                {/* Availability: which weekdays + hours this service is offered */}
                <div style={{ border: `1px solid ${R.line}`, borderRadius: 10, padding: '12px 13px', background: R.surface }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: R.inkSoft, marginBottom: 8 }}>Días disponibles</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                    {WEEKDAYS.map(({ i, l }) => {
                      const on = form.days.includes(i)
                      return (
                        <button key={i} type="button" aria-pressed={on}
                          onClick={() => setForm({ ...form, days: on ? form.days.filter(d => d !== i) : [...form.days, i] })}
                          style={{ flex: 1, height: 34, borderRadius: 8, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13, border: on ? `1px solid ${R.coral}` : `1px solid ${R.line}`, background: on ? R.coral : '#fff', color: on ? '#fff' : R.inkFaint }}>
                          {l}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: R.inkSoft, marginBottom: 8 }}>Horario del servicio</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input value={form.open} onChange={e => setForm({ ...form, open: e.target.value })} placeholder="09:00" style={{ ...fieldStyle, textAlign: 'center' }} />
                    <span style={{ color: R.inkFaint }}>–</span>
                    <input value={form.close} onChange={e => setForm({ ...form, close: e.target.value })} placeholder="20:00" style={{ ...fieldStyle, textAlign: 'center' }} />
                  </div>
                  <div style={{ fontSize: 11, color: R.inkFaint, marginTop: 8 }}>Por defecto, el horario del negocio ({vert.hours}). Cámbialo solo para este servicio.</div>
                </div>
              </>)}
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Categoría (ej. Bebidas, Mesas)" style={fieldStyle} />
              {knownCats.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: -2 }}>
                  {knownCats.map(cat => {
                    const on = form.category.trim().toLowerCase() === cat.toLowerCase()
                    return (
                      <button key={cat} type="button" onClick={() => setForm({ ...form, category: on ? '' : cat })}
                        style={{ padding: '5px 11px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, color: on ? R.coralPress : R.inkSoft, cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 12.5 }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              )}
              {/* Inventario: unidades disponibles que bajan con cada venta */}
              <button onClick={() => setForm({ ...form, trackStock: !form.trackStock })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${form.trackStock ? R.amberDeep : R.line}`, borderRadius: 10, background: form.trackStock ? R.amberTint : R.surface, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left' }}>
                <span style={{ minWidth: 0, paddingRight: 12 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: R.ink }}>Controlar inventario</span>
                  <span style={{ display: 'block', fontSize: 12, color: R.inkSoft, marginTop: 2 }}>Define cuántas unidades hay. Baja con cada venta y al llegar a 0 deja de ofrecerse.</span>
                </span>
                <span style={{ width: 34, height: 20, borderRadius: 999, background: form.trackStock ? R.amberDeep : R.inkFaint, position: 'relative', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: form.trackStock ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
                </span>
              </button>
              {form.trackStock && (
                <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value.replace(/\D/g, '') })} inputMode="numeric" placeholder="Unidades disponibles (ej. 10)" style={fieldStyle} />
              )}

              <button onClick={() => setForm({ ...form, active: !form.active })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${R.line}`, borderRadius: 10, background: R.surface, cursor: 'pointer', fontFamily: R.ui }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: R.ink }}>Activo en el catálogo</span>
                <span style={{ width: 34, height: 20, borderRadius: 999, background: form.active ? R.jade : R.inkFaint, position: 'relative', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: form.active ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
                </span>
              </button>

              {/* Disponibilidad: turnos que verá el cliente, según tu horario + duración + agenda */}
              {(() => {
                if (!form.scheduled) {
                  return (
                    <div style={{ border: `1px dashed ${R.line}`, borderRadius: 10, padding: '12px 13px', fontSize: 12.5, color: R.inkSoft, lineHeight: 1.5 }}>
                      Sin calendario: el cliente lo <b>solicita o compra</b> sin elegir fecha ni hora — Reva coordina los detalles.
                    </div>
                  )
                }
                const sharedId = SHARED_BIZ_ID[vert.id] ?? vert.id
                const svcHours = form.open && form.close ? `${form.open} – ${form.close}` : vert.hours
                const dur = parseInt(form.duration, 10)
                const valid = Number.isFinite(dur) && dur > 0
                const offeredToday = form.days.includes(new Date().getDay())
                // With a duration → generate slots from the service hours.
                // Without one → preview the business's default slots (what the customer sees).
                const slots = valid ? slotsFromHours(svcHours, dur) : (BIZ.find(b => b.id === sharedId)?.slots ?? [])
                if (slots.length === 0) {
                  return (
                    <div style={{ border: `1px dashed ${R.line}`, borderRadius: 10, padding: '12px 13px', fontSize: 12.5, color: R.inkSoft, lineHeight: 1.5 }}>
                      Agrega una <b>duración</b> y Reva genera los turnos desde tu horario (<b>{svcHours}</b>).
                    </div>
                  )
                }
                const avail = slotAvailability(sharedId, 0, slots, valid ? dur : undefined)
                const free = avail.filter(a => !a.taken).length
                return (
                  <div style={{ border: `1px solid ${R.line}`, borderRadius: 10, padding: '12px 13px', background: R.surface }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: R.inkSoft }}>Vista del cliente · hoy</span>
                      <span style={{ fontSize: 11.5, color: R.inkFaint }}>{svcHours}{valid ? ` · ${dur} min` : ''}{offeredToday ? ` · ${free} libres` : ''}</span>
                    </div>
                    {offeredToday ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {avail.map(({ time, taken }) => (
                          <span key={time} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: R.ui, border: `1px solid ${R.line}`, background: taken ? R.bgAlt : '#fff', color: taken ? R.inkFaint : R.ink, textDecoration: taken ? 'line-through' : 'none' }}>{time}</span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12.5, color: R.amberDeep, background: R.amberTint, borderRadius: 8, padding: '9px 11px' }}>Hoy no se ofrece — revisa <b>Días disponibles</b> arriba.</div>
                    )}
                    <div style={{ fontSize: 11, color: R.inkFaint, marginTop: 9, lineHeight: 1.45 }}>
                      {valid
                        ? 'Tachado = ocupado en tu Agenda. Así lo ve el cliente al reservar.'
                        : 'Horarios por defecto · agrega una duración para generarlos automáticamente. Tachado = ocupado.'}
                    </div>
                  </div>
                )
              })()}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {typeof editing === 'number' && (
                <button onClick={remove} style={{ padding: '12px 16px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: R.coralPress }}>Eliminar</button>
              )}
              <button onClick={save} disabled={!form.name.trim()} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: form.name.trim() ? R.coral : R.coralTint, cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5, color: form.name.trim() ? '#fff' : R.coralPress }}>{editing === 'new' ? 'Agregar al catálogo' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inventario ─────────────────────────────────────────────
// Seguimiento de disponibilidad de productos/servicios. La fuente es el mismo
// catálogo (setItems); un `stock` numérico = con seguimiento, undefined = ilimitado.
function InventoryView({ vert, items, setItems, onGo }: { vert: Vert; items: CatItem[]; setItems: React.Dispatch<React.SetStateAction<CatItem[]>>; onGo: (v: string) => void }) {
  const [query, setQuery] = useState('')
  useEffect(() => { setQuery('') }, [vert.id])

  const bizId = SHARED_BIZ_ID[vert.id] ?? vert.id
  // Persiste el cambio en Supabase (no-op silencioso en modo demo / sin sesión).
  function persist(idx: number, stock: number | null) {
    const id = items[idx]?.id
    if (id) void saveStock(id, stock)
  }
  function setStock(idx: number, n: number | null) {
    const val = n === null ? null : Math.max(0, n)
    setItems(prev => prev.map((c, i) => i === idx ? { ...c, stock: val === null ? undefined : val } : c))
    persist(idx, val)
  }
  function adjust(idx: number, delta: number) {
    const cur = items[idx]
    if (typeof cur?.stock !== 'number') return
    const val = Math.max(0, cur.stock + delta)
    setItems(prev => prev.map((c, i) => i === idx && typeof c.stock === 'number' ? { ...c, stock: val } : c))
    persist(idx, val)
  }

  const q = query.trim().toLowerCase()
  // Conserva el índice real dentro del catálogo para poder editar cada item.
  const rows = items.map((c, idx) => ({ c, idx })).filter(({ c }) =>
    !q || (c.name + ' ' + c.sub + ' ' + (c.category ?? '')).toLowerCase().includes(q))
  const tracked = rows.filter(({ c }) => typeof c.stock === 'number')
  const untracked = rows.filter(({ c }) => typeof c.stock !== 'number')

  const allTracked = items.filter(c => typeof c.stock === 'number')
  const totalUnits = allTracked.reduce((s, c) => s + (c.stock ?? 0), 0)
  const outCount = allTracked.filter(c => c.stock === 0).length
  const lowCount = allTracked.filter(c => (c.stock ?? 0) > 0 && (c.stock ?? 0) <= 3).length

  const kpi = (label: string, value: string | number, color: string) => (
    <BCard style={{ flex: 1, padding: '14px 16px' }}>
      <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 24, color, letterSpacing: '-.02em' }}>{value}</div>
      <div style={{ fontSize: 12, color: R.inkSoft, marginTop: 2 }}>{label}</div>
    </BCard>
  )

  const stepBtn: CSSProperties = { width: 30, height: 30, borderRadius: '50%', border: `1px solid ${R.line}`, background: R.surface, cursor: 'pointer', display: 'grid', placeItems: 'center', color: R.ink, fontWeight: 800, fontSize: 17, lineHeight: 1, flexShrink: 0 }

  function StockRow({ c, idx }: { c: CatItem; idx: number }) {
    const s = c.stock as number
    const out = s === 0
    const low = s > 0 && s <= 3
    // La etiqueta de estado se calcula sola a partir de las unidades — sólo la
    // mostramos cuando pide atención (pocas o agotado) para no saturar la fila.
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: `1px solid ${R.lineSoft}` }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: c.img ? `center/cover no-repeat url(${c.img})` : `linear-gradient(140deg, ${c.grad[0]}, ${c.grad[1]})` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: R.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
          <div style={{ fontSize: 12, color: R.inkSoft, marginTop: 1 }}>{c.category || c.sub}{!c.active && ' · Inactivo'}</div>
        </div>
        {(low || out) && (
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: out ? R.coralPress : R.amberDeep, background: out ? R.coralTint : R.amberTint, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>{out ? 'Agotado' : 'Quedan pocas'}</span>
        )}
        {/* Control de unidades: −/+ para ajustar, o escribe la cantidad exacta. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => adjust(idx, -1)} disabled={out} style={{ ...stepBtn, opacity: out ? .4 : 1, cursor: out ? 'not-allowed' : 'pointer' }} aria-label="Restar una unidad">−</button>
            <input value={s} onChange={e => setStock(idx, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} inputMode="numeric" aria-label={`Unidades de ${c.name}`}
              style={{ width: 52, textAlign: 'center', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 8, padding: '6px 4px', fontSize: 14, fontWeight: 700, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }} />
            <button onClick={() => adjust(idx, 1)} style={stepBtn} aria-label="Sumar una unidad">+</button>
          </div>
          <span style={{ fontSize: 10.5, color: R.inkFaint, fontWeight: 600 }}>unidades</span>
        </div>
        {/* Vuelve el producto a disponibilidad ilimitada (deja de contarlo). */}
        <button onClick={() => setStock(idx, null)} title="Dejar de llevar inventario: vuelve a disponibilidad ilimitada" style={{ background: 'none', border: `1px solid ${R.line}`, borderRadius: 999, padding: '6px 11px', cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 12, color: R.inkSoft, whiteSpace: 'nowrap', flexShrink: 0 }}>Dejar de controlar</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 18, color: R.ink }}>Inventario</div>
          <div style={{ fontSize: 13.5, color: R.inkSoft }}>Controla cuántas unidades quedan de cada producto o servicio</div>
        </div>
        <button onClick={() => onGo('catalog')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: R.bgAlt, color: R.inkSoft, border: 'none', borderRadius: 999, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
          <Icon n="grid" size={15} color={R.inkSoft} /> Ir al Catálogo
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        {kpi('Con seguimiento', allTracked.length, R.ink)}
        {kpi('Unidades en total', totalUnits, R.jade)}
        {kpi('Stock bajo', lowCount, lowCount ? R.amberDeep : R.ink)}
        {kpi('Agotados', outCount, outCount ? R.coralPress : R.ink)}
      </div>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}><Icon n="search" size={16} color={R.inkFaint} /></span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar en el inventario…"
          style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 999, padding: '11px 14px 11px 38px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }} />
      </div>

      {allTracked.length === 0 && !q && (
        <BCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: '32px 20px', color: R.inkSoft, marginBottom: 16 }}>
          <Icon n="box" size={28} color={R.inkFaint} />
          <div style={{ maxWidth: 340 }}>Aún no controlas inventario de ningún producto. Actívalo aquí abajo o desde el <b>Catálogo</b> al crear o editar un servicio.</div>
        </BCard>
      )}

      {tracked.length > 0 && (
        <>
          <div style={{ margin: '4px 2px 8px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: R.inkSoft, textTransform: 'uppercase', letterSpacing: '.03em' }}>Con seguimiento</div>
            <div style={{ fontSize: 12, color: R.inkFaint, marginTop: 2 }}>Ajusta las unidades con − y + o escribe la cantidad. La etiqueta de color aparece sola cuando quedan pocas (ámbar) o se agota (rojo); cada venta descuenta una unidad.</div>
          </div>
          <BCard style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            {tracked.map(({ c, idx }) => <StockRow key={idx} c={c} idx={idx} />)}
          </BCard>
        </>
      )}

      {untracked.length > 0 && (
        <>
          <div style={{ margin: '4px 2px 8px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: R.inkSoft, textTransform: 'uppercase', letterSpacing: '.03em' }}>Sin seguimiento de inventario</div>
            <div style={{ fontSize: 12, color: R.inkFaint, marginTop: 2 }}>Estos productos no llevan conteo — siempre están disponibles. Toca <b>Controlar</b> para empezar a contar unidades.</div>
          </div>
          <BCard style={{ padding: 0, overflow: 'hidden' }}>
            {untracked.map(({ c, idx }) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: `1px solid ${R.lineSoft}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: c.img ? `center/cover no-repeat url(${c.img})` : `linear-gradient(140deg, ${c.grad[0]}, ${c.grad[1]})` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: R.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: R.inkSoft, marginTop: 1 }}>{c.category || c.sub}{!c.active && ' · Inactivo'}</div>
                </div>
                <span style={{ fontSize: 12.5, color: R.inkFaint, whiteSpace: 'nowrap' }}>Disponibilidad ilimitada</span>
                <button onClick={() => setStock(idx, 10)} title="Empezar a llevar el conteo de unidades de este producto" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', background: R.ink, color: '#fff', border: 'none', borderRadius: 999, fontFamily: R.ui, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Icon n="box" size={14} color="#fff" /> Controlar
                </button>
              </div>
            ))}
          </BCard>
        </>
      )}

      {rows.length === 0 && (
        <div style={{ textAlign: 'center', color: R.inkFaint, fontSize: 13, padding: '28px 0' }}>Sin resultados para “{query}”.</div>
      )}
    </div>
  )
}

// ── Punto de venta ─────────────────────────────────────────
type TaxMode = 'included' | 'added'  // IVA incluido en el precio | IVA agregado al total
type BizInfo = { rfc: string; address: string; phone: string }
const TAX_RATE = 0.16
const money = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const priceToNumber = (price: string) => {
  const m = price.replace(/,/g, '').match(/\d+(\.\d+)?/)
  return m ? Number(m[0]) : 0
}
type PosLine = { key: string; id?: string; name: string; sub: string; unit: number; variable: boolean; qty: number }
type Sale = { method: string; items: { name: string; qty: number; unit: number }[]; base: number; iva: number; total: number; added: boolean; at: number }
const PAY_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: 'cash' },
  { id: 'tarjeta', label: 'Tarjeta', icon: 'card' },
  { id: 'transferencia', label: 'Transferencia', icon: 'bolt' },
]

function PosView({ vert, items, setItems, onGo, taxMode, bizInfo }: { vert: Vert; items: CatItem[]; setItems: React.Dispatch<React.SetStateAction<CatItem[]>>; onGo: (v: string) => void; taxMode: TaxMode; bizInfo: BizInfo }) {
  const [lines, setLines] = useState<PosLine[]>([])
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('Todos')
  const [pay, setPay] = useState<null | 'choose' | Sale>(null)
  const [receipt, setReceipt] = useState<Sale | null>(null)

  useEffect(() => { setLines([]); setQuery(''); setCat('Todos'); setPay(null); setReceipt(null) }, [vert.id])

  const active = items.filter(c => c.active)
  const cats = ['Todos', ...new Set(active.map(c => c.category?.trim()).filter(Boolean) as string[])]
  const q = query.trim().toLowerCase()
  const shown = active.filter(c =>
    (cat === 'Todos' || c.category === cat) &&
    (!q || (c.name + ' ' + c.sub).toLowerCase().includes(q)))

  function addItem(c: CatItem) {
    setLines(prev => {
      const i = prev.findIndex(l => l.key === c.name)
      // Con inventario, no dejes agregar más unidades de las que quedan.
      if (typeof c.stock === 'number') {
        const inCart = i >= 0 ? prev[i].qty : 0
        if (inCart >= c.stock) return prev
      }
      if (i >= 0) return prev.map((l, idx) => idx === i ? { ...l, qty: l.qty + 1 } : l)
      const unit = priceToNumber(c.price)
      return [...prev, { key: c.name, id: c.id, name: c.name, sub: c.sub, unit, variable: unit === 0, qty: 1 }]
    })
  }
  const bizId = SHARED_BIZ_ID[vert.id] ?? vert.id
  // Descuenta del inventario las unidades vendidas de los productos con seguimiento.
  // Actualiza el estado local de inmediato y persiste en Supabase de forma atómica
  // (no-op en modo demo / sin credenciales), para que la app del cliente vea el
  // mismo inventario.
  function decrementStock(sold: PosLine[]) {
    setItems(prev => prev.map(c => {
      if (typeof c.stock !== 'number') return c
      const line = sold.find(l => l.key === c.name)
      return line ? { ...c, stock: Math.max(0, c.stock - line.qty) } : c
    }))
    const soldItems = sold.filter(l => l.id).map(l => ({ service_id: l.id as string, qty: l.qty }))
    void decrementStockDB(bizId, soldItems)
  }
  function changeQty(key: string, delta: number) {
    setLines(prev => prev.flatMap(l => l.key !== key ? [l] : (l.qty + delta <= 0 ? [] : [{ ...l, qty: l.qty + delta }])))
  }
  function setUnit(key: string, value: string) {
    const n = priceToNumber(value)
    setLines(prev => prev.map(l => l.key === key ? { ...l, unit: n } : l))
  }

  function printTicket(sale: Sale) {
    const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))
    const when = new Date(sale.at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
    const folio = String(sale.at).slice(-6)
    const rows = sale.items.map(it =>
      `<tr><td class="q">${it.qty}×</td><td>${esc(it.name)}</td><td class="r">${money(it.unit * it.qty)}</td></tr>`).join('')
    const totals = sale.added
      ? `<div class="row"><span>Subtotal</span><span>${money(sale.base)}</span></div>
         <div class="row"><span>IVA (16%)</span><span>+${money(sale.iva)}</span></div>`
      : `<div class="row"><span>IVA incluido (16%)</span><span>${money(sale.iva)}</span></div>`
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ticket ${folio}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Courier New',monospace;color:#1a1a1a;padding:14px;width:280px}
        h1{font-size:15px;text-align:center}
        .sub{font-size:11px;text-align:center;color:#555;margin-bottom:8px}
        .hr{border-top:1px dashed #999;margin:8px 0}
        .meta{font-size:11px;color:#555;display:flex;justify-content:space-between}
        table{width:100%;border-collapse:collapse;font-size:12px;margin:6px 0}
        td{padding:2px 0;vertical-align:top}
        td.q{width:28px}
        td.r{text-align:right;white-space:nowrap;padding-left:8px}
        .row{display:flex;justify-content:space-between;font-size:12px;color:#555;margin:2px 0}
        .total{display:flex;justify-content:space-between;font-size:15px;font-weight:bold;margin-top:4px}
        .pay{font-size:12px;margin-top:8px}
        .thanks{text-align:center;font-size:12px;margin-top:12px}
        @media print{body{width:auto}}
      </style></head><body>
      <h1>${esc(vert.full || vert.name)}</h1>
      <div class="sub">${esc(bizInfo.address)}</div>
      <div class="sub">Tel. ${esc(bizInfo.phone)}</div>
      <div class="sub">RFC: ${esc(bizInfo.rfc)}</div>
      <div class="hr"></div>
      <div class="meta"><span>${when}</span><span>Folio ${folio}</span></div>
      <table>${rows}</table>
      <div class="hr"></div>
      ${totals}
      <div class="total"><span>TOTAL</span><span>${money(sale.total)}</span></div>
      <div class="hr"></div>
      <div class="pay">Pago: ${esc(sale.method)}</div>
      <div class="thanks">¡Gracias por tu compra! 🌮<br>Vía Reva</div>
      </body></html>`
    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    document.body.appendChild(frame)
    const doc = frame.contentWindow?.document
    if (!doc) return
    doc.open(); doc.write(html); doc.close()
    const w = frame.contentWindow
    setTimeout(() => { try { w?.focus(); w?.print() } catch {} setTimeout(() => frame.remove(), 800) }, 150)
  }

  const base = lines.reduce((s, l) => s + l.unit * l.qty, 0)
  const added = taxMode === 'added'
  const iva = added ? base * TAX_RATE : base - base / (1 + TAX_RATE)
  const total = added ? base + iva : base
  const count = lines.reduce((s, l) => s + l.qty, 0)

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', gap: 20, padding: '24px 28px', boxSizing: 'border-box' }}>
      {/* Productos del catálogo */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}><Icon n="search" size={16} color={R.inkFaint} /></span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar producto o servicio…"
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 999, padding: '11px 14px 11px 38px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }} />
          </div>
          <button onClick={() => onGo('catalog')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: R.bgAlt, border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 13, color: R.inkSoft, whiteSpace: 'nowrap' }}>
            <Icon n="grid" size={15} color={R.inkSoft} /> Catálogo
          </button>
        </div>

        {cats.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {cats.map(c => {
              const on = cat === c
              return (
                <button key={c} onClick={() => setCat(c)}
                  style={{ padding: '7px 14px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coral : R.surface, color: on ? '#fff' : R.inkSoft, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13 }}>
                  {c}
                </button>
              )
            })}
          </div>
        )}

        {active.length === 0 ? (
          <BCard style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, color: R.inkSoft }}>
            <Icon n="grid" size={30} color={R.inkFaint} />
            <div style={{ maxWidth: 280 }}>No hay productos activos en tu catálogo. Agrégalos para empezar a cobrar.</div>
            <button onClick={() => onGo('catalog')} style={{ padding: '10px 18px', background: R.ink, color: '#fff', border: 'none', borderRadius: 999, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Ir al Catálogo</button>
          </BCard>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {shown.map((c, i) => {
                const n = priceToNumber(c.price)
                const tracked = typeof c.stock === 'number'
                const inCart = lines.find(l => l.key === c.name)?.qty ?? 0
                const left = tracked ? (c.stock as number) - inCart : Infinity
                const sold = tracked && left <= 0
                return (
                  <button key={i} onClick={() => addItem(c)} disabled={sold} style={{ textAlign: 'left', border: `1px solid ${sold ? R.coralTint : R.line}`, background: R.surface, borderRadius: 14, padding: 0, overflow: 'hidden', cursor: sold ? 'not-allowed' : 'pointer', opacity: sold ? .55 : 1, fontFamily: R.ui, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 64, background: c.img ? `center/cover no-repeat url(${c.img})` : `linear-gradient(140deg, ${c.grad[0]}, ${c.grad[1]})`, position: 'relative' }}>
                      {!c.img && <div style={{ position: 'absolute', right: -2, bottom: -10, fontFamily: R.display, fontWeight: 800, fontSize: 46, color: 'rgba(255,255,255,.2)' }}>{vert.mono}</div>}
                      {!sold && <span style={{ position: 'absolute', top: 7, right: 7, width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center' }}><Icon n="plus" size={14} color={R.ink} /></span>}
                      {tracked && (
                        <span style={{ position: 'absolute', top: 7, left: 7, fontSize: 10.5, fontWeight: 800, letterSpacing: '.02em', color: '#fff', background: sold ? 'rgba(181,71,47,.92)' : (left <= 3 ? 'rgba(199,124,44,.92)' : 'rgba(34,28,25,.7)'), padding: '2px 8px', borderRadius: 999 }}>{sold ? 'Agotado' : `${left} disp.`}</span>
                      )}
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: R.ink, lineHeight: 1.25 }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: R.inkSoft, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sub}</div>
                      <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 14, color: n > 0 ? R.ink : R.inkFaint, marginTop: 8 }}>{n > 0 ? money(n) : 'Precio variable'}</div>
                    </div>
                  </button>
                )
              })}
              {shown.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: R.inkFaint, fontSize: 13, padding: '32px 0' }}>Sin resultados para “{query}”.</div>}
            </div>
          </div>
        )}
      </div>

      {/* Ticket */}
      <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, background: R.surface, border: `1px solid ${R.line}`, borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${R.lineSoft}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Icon n="card" size={18} color={R.coral} />
            <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 16, color: R.ink }}>Ticket</span>
            {count > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: R.coral, borderRadius: 999, padding: '1px 8px' }}>{count}</span>}
          </div>
          {lines.length > 0 && <button onClick={() => setLines([])} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 12.5, color: R.inkSoft }}><Icon n="trash" size={14} color={R.inkSoft} /> Vaciar</button>}
        </div>

        {lines.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10, color: R.inkSoft, padding: 24 }}>
            <Icon n="inbox" size={28} color={R.inkFaint} />
            <div style={{ fontSize: 13.5, maxWidth: 220 }}>Toca un producto para empezar el ticket.</div>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {lines.map(l => (
              <div key={l.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 18px', borderBottom: `1px solid ${R.lineSoft}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: R.ink }}>{l.name}</div>
                  {l.variable ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                      <span style={{ fontSize: 12, color: R.inkSoft }}>Precio</span>
                      <input inputMode="numeric" value={l.unit ? String(l.unit) : ''} onChange={e => setUnit(l.key, e.target.value)} placeholder="0"
                        style={{ width: 80, boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 8, padding: '5px 8px', fontSize: 12.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }} />
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: R.inkSoft, marginTop: 2 }}>{money(l.unit)} c/u</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 13.5, color: R.ink }}>{money(l.unit * l.qty)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: R.bgAlt, borderRadius: 999, padding: '3px 5px' }}>
                    <button onClick={() => changeQty(l.key, -1)} aria-label="Quitar uno" style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: R.surface, cursor: 'pointer', display: 'grid', placeItems: 'center', color: R.ink, fontWeight: 800, fontSize: 16, lineHeight: 1 }}>−</button>
                    <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700, fontSize: 13, color: R.ink }}>{l.qty}</span>
                    <button onClick={() => changeQty(l.key, 1)} aria-label="Agregar uno" style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: R.surface, cursor: 'pointer', display: 'grid', placeItems: 'center', color: R.ink, fontWeight: 800, fontSize: 14, lineHeight: 1 }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${R.line}`, padding: '14px 18px 16px', background: R.bg }}>
          {added ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: R.inkSoft, marginBottom: 4 }}>
                <span>Subtotal</span><span>{money(base)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: R.inkSoft, marginBottom: 4 }}>
                <span>IVA (16%)</span><span>+{money(iva)}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: R.inkSoft, marginBottom: 4 }}>
              <span>IVA incluido (16%)</span><span>{money(iva)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: R.ink }}>Total</span>
            <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 24, color: R.ink, letterSpacing: '-.02em' }}>{money(total)}</span>
          </div>
          <button onClick={() => setPay('choose')} disabled={lines.length === 0 || total <= 0}
            style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: lines.length && total > 0 ? R.coral : R.coralTint, color: lines.length && total > 0 ? '#fff' : R.coralPress, cursor: lines.length && total > 0 ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 800, fontSize: 15 }}>
            Cobrar {money(total)}
          </button>
        </div>
      </div>

      {/* Modal de cobro */}
      {pay !== null && (
        <div onClick={() => setPay(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            {pay === 'choose' ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <div style={{ fontSize: 13, color: R.inkSoft }}>Total a cobrar</div>
                  <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 32, color: R.ink, letterSpacing: '-.02em' }}>{money(total)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PAY_METHODS.map(m => (
                    <button key={m.id} onClick={() => { decrementStock(lines); setPay({ method: m.label, items: lines.map(l => ({ name: l.name, qty: l.qty, unit: l.unit })), base, iva, total, added, at: Date.now() }) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: R.surface, border: `1px solid ${R.line}`, borderRadius: 14, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left' }}>
                      <span style={{ width: 38, height: 38, borderRadius: 10, background: R.coralTint, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={m.icon} size={18} color={R.coralPress} /></span>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: R.ink }}>{m.label}</span>
                      <Icon n="chevR" size={16} color={R.inkFaint} />
                    </button>
                  ))}
                </div>
                <button onClick={() => setPay(null)} style={{ width: '100%', marginTop: 14, padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 14, color: R.inkSoft }}>Cancelar</button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: R.jadeTint, display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <Icon n="check" size={30} color={R.jade} />
                </div>
                <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 22, color: R.ink }}>Cobro registrado</div>
                <div style={{ fontSize: 14, color: R.inkSoft, marginTop: 4 }}>{money(pay.total)} · {pay.method}</div>
                <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 10 }}>¿Quieres imprimir el ticket de la venta?</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button onClick={() => setReceipt(pay as Sale)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', border: `1px solid ${R.line}`, borderRadius: 14, background: R.surface, color: R.ink, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14 }}>
                    <Icon n="printer" size={17} color={R.ink} /> Imprimir
                  </button>
                  <button onClick={() => { setLines([]); setPay(null) }} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: 14, background: R.ink, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14 }}>Nuevo ticket</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista previa del ticket */}
      {receipt && (
        <div onClick={() => setReceipt(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '22px 22px 26px', fontFamily: "'Courier New', ui-monospace, monospace", color: '#1a1a1a', boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{vert.full || vert.name}</div>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#666', marginTop: 3, lineHeight: 1.5 }}>
                {bizInfo.address}<br />
                Tel. {bizInfo.phone}<br />
                RFC: {bizInfo.rfc}
              </div>
              <div style={{ borderTop: '1px dashed #bbb', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666' }}>
                <span>{new Date(receipt.at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span>Folio {String(receipt.at).slice(-6)}</span>
              </div>
              <div style={{ borderTop: '1px dashed #bbb', margin: '12px 0' }} />
              {receipt.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ width: 30 }}>{it.qty}×</span>
                  <span style={{ flex: 1 }}>{it.name}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{money(it.unit * it.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #bbb', margin: '12px 0' }} />
              {receipt.added ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 3 }}><span>Subtotal</span><span>{money(receipt.base)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 3 }}><span>IVA (16%)</span><span>+{money(receipt.iva)}</span></div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 3 }}><span>IVA incluido (16%)</span><span>{money(receipt.iva)}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 4 }}><span>TOTAL</span><span>{money(receipt.total)}</span></div>
              <div style={{ borderTop: '1px dashed #bbb', margin: '12px 0' }} />
              <div style={{ fontSize: 12 }}>Pago: {receipt.method}</div>
              <div style={{ textAlign: 'center', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>¡Gracias por tu compra! 🌮<br />Vía Reva</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReceipt(null)} style={{ flex: 1, padding: '13px', border: 'none', borderRadius: 14, background: R.bgAlt, color: R.inkSoft, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14 }}>Cerrar</button>
              <button onClick={() => printTicket(receipt)} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', border: 'none', borderRadius: 14, background: R.coral, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 800, fontSize: 14.5 }}>
                <Icon n="printer" size={17} color="#fff" /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Informes ───────────────────────────────────────────────
const REPORT_PERIODS = [
  { id: 'hoy', label: 'Hoy', days: 1 },
  { id: '7d', label: '7 días', days: 7 },
  { id: '30d', label: '30 días', days: 30 },
  { id: '90d', label: '90 días', days: 90 },
]
// Pseudo-aleatorio determinista (para series diarias estables entre renders)
const seeded = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x) }
const dayLabel = (d: Date) => d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })

type DetailTable = { cols: string[]; rows: (string | number)[][] }

function MiniTable({ title, cols, rows, cap }: { title: string; cols: string[]; rows: (string | number)[][]; cap: number }) {
  const shown = rows.slice(0, cap)
  const grid = `1.4fr ${Array(cols.length - 1).fill('1fr').join(' ')}`
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: R.inkSoft, marginBottom: 6 }}>{title}</div>
      <div style={{ border: `1px solid ${R.line}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: grid, background: R.bgAlt, fontSize: 11, fontWeight: 700, color: R.inkSoft }}>
          {cols.map((c, i) => <div key={i} style={{ padding: '7px 10px', textAlign: i === 0 ? 'left' : 'right' }}>{c}</div>)}
        </div>
        {shown.map((r, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: grid, fontSize: 12, borderTop: `1px solid ${R.lineSoft}` }}>
            {r.map((cell, ci) => <div key={ci} style={{ padding: '7px 10px', textAlign: ci === 0 ? 'left' : 'right', color: ci === 0 ? R.ink : R.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cell}</div>)}
          </div>
        ))}
      </div>
      {rows.length > cap && <div style={{ fontSize: 11, color: R.inkFaint, marginTop: 5 }}>+{rows.length - cap} más — completo en el PDF</div>}
    </div>
  )
}

function ReportsView({ vert, items, onGo, bizInfo }: { vert: Vert; items: CatItem[]; onGo: (v: string) => void; bizInfo: BizInfo }) {
  const [period, setPeriod] = useState('30d')
  const [mods, setMods] = useState<string[]>(['requests', 'agenda', 'messages', 'pos', 'catalog', 'promos', 'destacado', 'metrics'])
  const [compare, setCompare] = useState(false)
  const [detail, setDetail] = useState<'summary' | 'detailed'>('summary')
  const days = REPORT_PERIODS.find(p => p.id === period)!.days

  const parseK = (s: string) => { const t = s.replace(/[$,\s]/g, ''); const n = parseFloat(t) || 0; return /k/i.test(t) ? n * 1000 : n }
  const num = (n: number) => Math.round(n).toLocaleString('es-MX')
  const fmt = (n: number) => n >= 1000 ? '$' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : '$' + Math.round(n)
  const pct = (n: number) => `${Math.round(n)}%`

  const m = vert.metrics
  const ingresoDia = parseK(m.ingreso)
  const reservasDia = m.reservasHoy
  const ventasDia = Math.max(1, Math.round(reservasDia * 1.4))
  const ingresoPosDia = ingresoDia * 0.42

  const negCount = vert.requests.filter(r => r.state === 'negotiating').length
  const unread = vert.messages.filter(x => x.unread).length
  const activos = items.filter(c => c.active).length
  const inactivos = items.filter(c => !c.active).length
  const cats = new Set(items.map(c => c.category?.trim()).filter(Boolean)).size
  const topItem = (items.find(c => c.active) ?? items[0])?.name ?? '—'
  const ocup = Math.round((vert.capacity.used / vert.capacity.total) * 100)

  const summary: { label: string; value: string; tint: string; color: string; icon: string; trend: number }[] = [
    { label: 'Ingreso total', value: fmt(ingresoDia * days), tint: R.coralTint, color: R.coralPress, icon: 'chart', trend: 22 },
    { label: 'Reservas', value: num(reservasDia * days), tint: R.jadeTint, color: '#16614c', icon: 'cal', trend: 14 },
    { label: 'Ventas (POS)', value: num(ventasDia * days), tint: R.amberTint, color: R.amberDeep, icon: 'card', trend: 9 },
    { label: 'Vía Reva', value: pct(m.viaReva), tint: R.bgAlt, color: R.ink, icon: 'spark', trend: 6 },
  ]

  const allCards: { id: string; icon: string; title: string; trend: number; kpis: [string, string][] }[] = [
    { id: 'requests', icon: 'inbox', title: 'Solicitudes', trend: 12, kpis: [['Recibidas', num(Math.round(reservasDia * 1.6) * days)], ['Auto-confirmadas', '58%'], ['En negociación', String(negCount)], ['Conversión', '72%']] },
    { id: 'agenda', icon: 'cal', title: 'Agenda', trend: 8, kpis: [['Reservas', num(reservasDia * days)], ['Ocupación', pct(ocup)], ['Confirmadas', '86%'], ['No-shows', '4%']] },
    { id: 'messages', icon: 'chat', title: 'Mensajes', trend: 5, kpis: [['Conversaciones', num(Math.round(reservasDia * 0.9) * days)], ['Sin leer', String(unread)], ['Resp. promedio', '2 min'], ['Satisfacción', '4.8 / 5']] },
    { id: 'pos', icon: 'card', title: 'Punto de venta', trend: 9, kpis: [['Ventas', num(ventasDia * days)], ['Ingreso', fmt(ingresoPosDia * days)], ['Ticket prom.', fmt(ingresoPosDia / ventasDia)], ['Pago tarjeta', '61%']] },
    { id: 'catalog', icon: 'grid', title: 'Catálogo', trend: 0, kpis: [['Activos', String(activos)], ['Inactivos', String(inactivos)], ['Categorías', String(cats)], ['Top producto', topItem]] },
    { id: 'promos', icon: 'gift', title: 'Promociones', trend: 18, kpis: [['Sellos', num(Math.round(reservasDia * 2.2) * days)], ['Canjes', num(Math.round(reservasDia * 0.3) * days)], ['Recurrentes', '38%'], ['Lealtad activa', '212']] },
    { id: 'destacado', icon: 'spark', title: 'Destacado', trend: 31, kpis: [['Impresiones', num(Math.round(reservasDia * 120) * days)], ['Clics', num(Math.round(reservasDia * 9) * days)], ['CTR', '7.5%'], ['Solicitudes', '+38%']] },
    { id: 'metrics', icon: 'chart', title: 'Métricas', trend: 22, kpis: [['Ingreso atribuido', fmt(ingresoDia * days)], ['Vía Reva', pct(m.viaReva)], ['ROVE', num(m.rove)], ['Crecimiento', '+22%']] },
  ]
  const cards = allCards.filter(c => mods.includes(c.id))
  const toggleMod = (id: string) => setMods(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  // Desglose diario determinista cuyo total coincide con el resumen
  function genDaily(base: number, seed: number) {
    const today = new Date()
    const raw: { date: Date; v: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today); date.setDate(today.getDate() - i)
      raw.push({ date, v: base * (0.7 + seeded(seed + i + 1) * 0.6) })
    }
    const sum = raw.reduce((s, r) => s + r.v, 0) || 1
    const factor = (base * days) / sum
    return raw.map(r => ({ date: r.date, v: Math.max(0, Math.round(r.v * factor)) }))
  }

  // Detalle por módulo: desglose por día y/o transacciones
  function buildDetail(id: string): { daily: (DetailTable & { title: string }) | null; tx: (DetailTable & { title: string }) | null } {
    if (id === 'requests') {
      const d = genDaily(Math.round(reservasDia * 1.6), 11)
      return { daily: { title: 'Desglose por día', cols: ['Fecha', 'Recibidas'], rows: d.map(r => [dayLabel(r.date), num(r.v)]) }, tx: null }
    }
    if (id === 'agenda') {
      const d = genDaily(reservasDia, 22)
      return {
        daily: { title: 'Reservas por día', cols: ['Fecha', 'Reservas'], rows: d.map(r => [dayLabel(r.date), num(r.v)]) },
        tx: { title: 'Reservas del día', cols: ['Hora', 'Cliente', 'Personas', 'Estado'], rows: vert.agenda.map(a => [a.time, a.who, `${a.party} p.`, a.tag]) },
      }
    }
    if (id === 'messages') {
      const d = genDaily(Math.round(reservasDia * 0.9), 33)
      return {
        daily: { title: 'Conversaciones por día', cols: ['Fecha', 'Conversaciones'], rows: d.map(r => [dayLabel(r.date), num(r.v)]) },
        tx: { title: 'Conversaciones recientes', cols: ['Hace', 'Cliente', 'Canal', 'Estado'], rows: vert.messages.map(mm => [mm.time, mm.who, mm.via, mm.unread ? 'Sin leer' : 'Leído']) },
      }
    }
    if (id === 'pos') {
      const ticket = ingresoPosDia / ventasDia
      const dv = genDaily(ventasDia, 44)
      const sellable = items.filter(c => c.active && priceToNumber(c.price) > 0)
      const totalSales = ventasDia * days
      const sampleN = Math.min(14, Math.max(1, totalSales))
      const tx: (string | number)[][] = []
      for (let i = 0; i < sampleN && sellable.length; i++) {
        const p = sellable[Math.floor(seeded(91 + i) * sellable.length)] ?? sellable[0]
        const h = 12 + Math.floor(seeded(7 + i) * 11), mn = Math.floor(seeded(13 + i) * 60)
        tx.push([String(884100 + i), `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`, p.name, fmt(priceToNumber(p.price))])
      }
      return {
        daily: { title: 'Ventas por día', cols: ['Fecha', 'Ventas', 'Ingreso'], rows: dv.map(r => [dayLabel(r.date), num(r.v), fmt(r.v * ticket)]) },
        tx: { title: `Ventas — muestra de ${tx.length} de ${num(totalSales)}`, cols: ['Folio', 'Hora', 'Producto', 'Total'], rows: tx },
      }
    }
    if (id === 'catalog') {
      return { daily: null, tx: { title: 'Productos del catálogo', cols: ['Producto', 'Categoría', 'Precio', 'Estado'], rows: items.map(c => [c.name, c.category || '—', c.price, c.active ? 'Activo' : 'Inactivo']) } }
    }
    return { daily: null, tx: null }
  }

  function exportCSV() {
    const rows: string[][] = [['Periodo', REPORT_PERIODS.find(p => p.id === period)!.label], ['Negocio', vert.full || vert.name], ['Detalle', detail === 'detailed' ? 'Detallado' : 'Resumen'], [], ['Módulo', 'Métrica', 'Valor']]
    cards.forEach(c => c.kpis.forEach(k => rows.push([c.title, k[0], k[1]])))
    if (detail === 'detailed') {
      cards.forEach(c => {
        const d = buildDetail(c.id)
        if (d.daily) { rows.push([], [`${c.title} — ${d.daily.title}`, ...d.daily.cols]); d.daily.rows.forEach(r => rows.push(['', ...r.map(String)])) }
        if (d.tx) { rows.push([], [`${c.title} — ${d.tx.title}`, ...d.tx.cols]); d.tx.rows.forEach(r => rows.push(['', ...r.map(String)])) }
      })
    }
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `informe-${vert.id}-${period}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
  }

  function printReport() {
    const esc = (s: string) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))
    const pLabel = REPORT_PERIODS.find(p => p.id === period)!.label
    const when = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
    const sumRows = summary.map(s => `<div class="kv"><span>${esc(s.label)}</span><span><b>${esc(s.value)}</b>${compare ? ` <i>▲ ${s.trend}%</i>` : ''}</span></div>`).join('')
    const htmlTable = (cols: string[], rows: (string | number)[][]) => `<table class="dt"><thead><tr>${cols.map((col, i) => `<th class="${i === 0 ? 'l' : 'r'}">${esc(col)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((cell, ci) => `<td class="${ci === 0 ? 'l' : 'r'}">${esc(String(cell))}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    const sections = cards.map(c => {
      let extra = ''
      if (detail === 'detailed') {
        const d = buildDetail(c.id)
        if (d.daily) extra += `<h3>${esc(d.daily.title)}</h3>${htmlTable(d.daily.cols, d.daily.rows)}`
        if (d.tx) extra += `<h3>${esc(d.tx.title)}</h3>${htmlTable(d.tx.cols, d.tx.rows)}`
      }
      return `<div class="sec"><h2>${esc(c.title)}${compare ? `<span class="t">▲ ${c.trend}%</span>` : ''}</h2><table>${c.kpis.map(k => `<tr><td>${esc(k[0])}</td><td class="r">${esc(k[1])}</td></tr>`).join('')}</table>${extra}</div>`
    }).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Informe ${esc(vert.name)} · ${esc(pLabel)}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:-apple-system,'Segoe UI',Roboto,Helvetica,sans-serif;color:#221C19;padding:36px;max-width:720px;margin:0 auto}
      header{border-bottom:2px solid #E8505B;padding-bottom:12px}
      h1{font-size:22px;letter-spacing:-.01em}
      .meta{font-size:11px;color:#6B615A;margin-top:5px}
      .title{font-size:17px;font-weight:700;margin-top:18px}
      .sub{font-size:12px;color:#6B615A;margin-bottom:14px}
      h2{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6B615A;border-bottom:1px solid #E9E0D5;padding-bottom:5px;margin:18px 0 8px;overflow:hidden}
      h2 .t{float:right;color:#1F8A6D;text-transform:none;letter-spacing:0}
      .summary{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}
      .kv{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid #F1EADF}
      .kv i{color:#1F8A6D;font-style:normal;font-size:11px}
      .sec{break-inside:avoid}
      table{width:100%;border-collapse:collapse;font-size:13px}
      td{padding:4px 0;border-bottom:1px solid #F1EADF}
      td.r{text-align:right;font-weight:700}
      h3{font-size:12px;color:#221C19;margin:12px 0 4px}
      table.dt{margin-bottom:6px}
      table.dt th{font-size:10px;text-transform:uppercase;letter-spacing:.03em;color:#A89E94;text-align:left;padding:4px 6px;border-bottom:1px solid #E9E0D5}
      table.dt th.r,table.dt td.r{text-align:right}
      table.dt td{font-size:11.5px;font-weight:400;padding:3px 6px;border-bottom:1px solid #F1EADF}
      footer{margin-top:30px;border-top:1px solid #E9E0D5;padding-top:10px;font-size:11px;color:#A89E94;text-align:center}
      @media print{body{padding:0}}
    </style></head><body>
      <header>
        <h1>${esc(vert.full || vert.name)}</h1>
        <div class="meta">${esc(bizInfo.address)} · Tel. ${esc(bizInfo.phone)} · RFC: ${esc(bizInfo.rfc)}</div>
      </header>
      <div class="title">Informe de operación</div>
      <div class="sub">Período: ${esc(pLabel)} · ${detail === 'detailed' ? 'Detallado' : 'Resumen'}${compare ? ' · comparado con período anterior' : ''} · Generado: ${esc(when)}</div>
      <h2>Resumen general</h2>
      <div class="summary">${sumRows}</div>
      ${sections}
      <footer>Generado por Reva · Vía Reva</footer>
    </body></html>`
    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    document.body.appendChild(frame)
    const doc = frame.contentWindow?.document
    if (!doc) return
    doc.open(); doc.write(html); doc.close()
    const w = frame.contentWindow
    setTimeout(() => { try { w?.focus(); w?.print() } catch {} setTimeout(() => frame.remove(), 800) }, 200)
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Panel de filtros */}
      <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: 18, marginBottom: 18 }}>
        {/* Período */}
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 8 }}>Período</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {REPORT_PERIODS.map(p => {
            const on = period === p.id
            return <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coral : R.surface, color: on ? '#fff' : R.inkSoft, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13 }}>{p.label}</button>
          })}
        </div>

        {/* Módulos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: R.inkSoft }}>Módulos en el reporte</span>
          <button onClick={() => setMods(mods.length === allCards.length ? [] : allCards.map(c => c.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 12, color: R.coral }}>
            {mods.length === allCards.length ? 'Quitar todos' : 'Seleccionar todos'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {allCards.map(c => {
            const on = mods.includes(c.id)
            return (
              <button key={c.id} onClick={() => toggleMod(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, color: on ? R.coralPress : R.inkSoft, cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 13 }}>
                <Icon n={on ? 'check' : c.icon} size={14} color={on ? R.coralPress : R.inkFaint} /> {c.title}
              </button>
            )
          })}
        </div>

        {/* Nivel de detalle */}
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 8 }}>Nivel de detalle</div>
        <div style={{ display: 'flex', gap: 4, background: R.bgAlt, borderRadius: 999, padding: 4, width: 'fit-content', marginBottom: 16 }}>
          {([['summary', 'Resumen'], ['detailed', 'Detallado']] as const).map(([id, lab]) => {
            const on = detail === id
            return <button key={id} onClick={() => setDetail(id)} style={{ padding: '7px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 12.5, background: on ? R.surface : 'transparent', color: on ? R.ink : R.inkSoft, boxShadow: on ? '0 1px 2px rgba(34,28,25,.08)' : 'none' }}>{lab}</button>
          })}
        </div>

        {/* Comparativa + acciones */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 16, borderTop: `1px solid ${R.lineSoft}` }}>
          <button onClick={() => setCompare(!compare)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: R.ui }}>
            <span style={{ width: 38, height: 22, borderRadius: 999, background: compare ? R.jade : R.line, position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 2, left: compare ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>Comparar con período anterior</span>
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: R.bgAlt, color: R.inkSoft, border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13 }}>
              <Icon n="report" size={16} color={R.inkSoft} /> CSV
            </button>
            <button onClick={printReport} disabled={cards.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: cards.length ? R.coral : R.coralTint, color: cards.length ? '#fff' : R.coralPress, border: 'none', borderRadius: 999, cursor: cards.length ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 13 }}>
              <Icon n="printer" size={16} color={cards.length ? '#fff' : R.coralPress} /> Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Resumen general */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        {summary.map(s => (
          <div key={s.label} style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: s.tint, display: 'grid', placeItems: 'center' }}><Icon n={s.icon} size={16} color={s.color} /></span>
              {compare && <span style={{ fontSize: 11.5, fontWeight: 700, color: R.jade }}>▲ {s.trend}%</span>}
            </div>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 24, color: R.ink, letterSpacing: '-.02em' }}>{s.value}</div>
            <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tarjetas por módulo */}
      {cards.length === 0 ? (
        <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: '40px 0', textAlign: 'center', color: R.inkSoft, fontSize: 13.5 }}>
          Selecciona al menos un módulo para generar el reporte.
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {cards.map(c => (
          <div key={c.id} style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: R.coralTint, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={c.icon} size={18} color={R.coralPress} /></span>
              <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>{c.title}</span>
              {compare && <span style={{ fontSize: 11.5, fontWeight: 700, color: R.jade, background: R.jadeTint, padding: '2px 8px', borderRadius: 999 }}>▲ {c.trend}%</span>}
              <button onClick={() => onGo(c.id)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 12.5, color: R.coral }}>Ver <Icon n="arrowR" size={14} color={R.coral} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {c.kpis.map(([label, value]) => (
                <div key={label} style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 18, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                  <div style={{ fontSize: 12, color: R.inkSoft, marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>
            {detail === 'detailed' && (() => {
              const d = buildDetail(c.id)
              if (!d.daily && !d.tx) return <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${R.lineSoft}`, fontSize: 12, color: R.inkFaint }}>Sin desglose adicional para este módulo.</div>
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${R.lineSoft}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {d.daily && <MiniTable title={d.daily.title} cols={d.daily.cols} rows={d.daily.rows} cap={7} />}
                  {d.tx && <MiniTable title={d.tx.title} cols={d.tx.cols} rows={d.tx.rows} cap={6} />}
                </div>
              )
            })()}
          </div>
        ))}
      </div>
      )}
    </div>
  )
}

type EmpRole = 'Dueño' | 'Admin' | 'Caja'
type Employee = { id: number; name: string; email: string; role: EmpRole; status: 'activo' | 'invitado' }

function SettingsView({ agentOn, setAgentOn, taxMode, setTaxMode, bizInfo, setBizInfo, vert, onGo }: { agentOn: boolean; setAgentOn: (v: boolean) => void; taxMode: TaxMode; setTaxMode: (v: TaxMode) => void; bizInfo: BizInfo; setBizInfo: (v: BizInfo) => void; vert: Vert; onGo: (v: string) => void }) {
  const bizFields: { key: keyof BizInfo; label: string; placeholder: string }[] = [
    { key: 'rfc', label: 'RFC', placeholder: 'Ej. LUP190423K10' },
    { key: 'address', label: 'Dirección', placeholder: 'Calle, número, colonia, ciudad' },
    { key: 'phone', label: 'Teléfono', placeholder: 'Ej. +52 624 142 0011' },
  ]
  const taxOpts: { id: TaxMode; label: string; sub: string }[] = [
    { id: 'added', label: 'Agregar al total (16%)', sub: 'El precio es sin IVA y se suma al cobrar' },
    { id: 'included', label: 'Incluido en el precio', sub: 'El precio ya trae el IVA' },
  ]
  const rows = [
    { id: 'perfil', label: 'Perfil del negocio', sub: 'Nombre, fotos, descripción' },
    { id: 'horarios', label: 'Horarios y capacidad', sub: 'Horarios por día, mesas' },
    { id: 'agente', label: 'Agente de IA', sub: 'Tono, instrucciones, límites' },
    { id: 'alertas', label: 'Alertas proactivas', sub: 'Avisos que Reva muestra a clientes cercanos' },
    { id: 'pagos', label: 'Pagos y comisiones', sub: 'Método de cobro, depósitos' },
    { id: 'destacados', label: 'Destacados (Stripe)', sub: 'Comprar visibilidad en la plataforma' },
    { id: 'plan', label: 'Plan Reva', sub: '$300/mes · 15 días gratis · + 2% por procesamiento' },
  ]

  const [open, setOpen] = useState<string | null>(null)
  const [hrs] = (vert.hours || '13:00 – 23:00').split('–').map(s => s.trim())
  const [profile, setProfile] = useState({ name: vert.full, desc: `${vert.kind} en ${vert.hood}. Reserva y paga con Reva.`, img: '' })
  const [horario, setHorario] = useState({ open: hrs || '13:00', close: (vert.hours || '').split('–')[1]?.trim() || '23:00', capacity: String(vert.capacity.total) })
  const [agente, setAgente] = useState({ tone: 'Cálido', instructions: 'Sé amable, confirma rápido y ofrece la terraza si hay disponibilidad. No prometas descuentos arriba del límite.', maxDiscount: '10' })
  const [pagos, setPagos] = useState({ deposit: false, depositAmount: '200', methods: ['Efectivo', 'Tarjeta', 'Transferencia'] })

  // Stripe Connect — estado de la cuenta del negocio para recibir pagos.
  const bizConnectId = SHARED_BIZ_ID[vert.id] ?? vert.id
  const [stripeConn, setStripeConn] = useState<{ connected: boolean; charges_enabled: boolean; payouts_enabled: boolean } | null>(null)
  const [stripeBusy, setStripeBusy] = useState(false)
  const [stripeErr, setStripeErr] = useState<string | null>(null)
  useEffect(() => {
    // Al volver del onboarding (return_url) este fetch refresca y persiste el estado.
    fetch(`/api/stripe/connect/status?biz_id=${bizConnectId}`)
      .then(r => r.json()).then(setStripeConn).catch(() => {})
  }, [bizConnectId])
  async function startStripeOnboard() {
    setStripeBusy(true)
    setStripeErr(null)
    try {
      const r = await fetch('/api/stripe/connect/onboard', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biz_id: bizConnectId }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.url) { window.location.href = d.url; return }
      setStripeErr(d.error || `No se pudo iniciar la conexión (HTTP ${r.status}).`)
    } catch (e) {
      setStripeErr(e instanceof Error ? e.message : 'Error de red al conectar con Stripe.')
    } finally {
      setStripeBusy(false)
    }
  }
  const stripeReady = !!stripeConn?.charges_enabled

  // Alertas proactivas — seeded from the biz data; editable in the panel
  const [bizAlerts, setBizAlerts] = useState<ProactiveAlert[]>(
    vert.id === 'resto'
      ? [{ id: 'mirador-hh-1', bizId: vert.id, type: 'happy_hour', title: 'Es happy hour a 2 min de ti — Mirador Mezcalería', body: 'Terraza de azotea, 6–8pm. ¿Te aparto antes de que se llene?', cta: 'Échale un ojo', startTime: '18:00', endTime: '20:00', days: [], active: true }]
      : []
  )
  const [alertForm, setAlertForm] = useState<{ type: AlertType; title: string; body: string; cta: string; startTime: string; endTime: string; days: number[] }>({ type: 'happy_hour', title: '', body: '', cta: '', startTime: '18:00', endTime: '20:00', days: [] })
  const [alertFormOpen, setAlertFormOpen] = useState(false)
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null)

  const ALERT_TYPES: { id: AlertType; label: string; emoji: string }[] = [
    { id: 'happy_hour', label: 'Happy hour', emoji: '🍹' },
    { id: 'evento', label: 'Evento especial', emoji: '🎉' },
    { id: 'promo', label: 'Promoción', emoji: '🏷️' },
    { id: 'ultimos_lugares', label: 'Últimos lugares', emoji: '⚡' },
  ]
  const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const BLANK_FORM = { type: 'happy_hour' as AlertType, title: '', body: '', cta: 'Échale un ojo', startTime: '18:00', endTime: '20:00', days: [] }

  function startEditAlert(a: ProactiveAlert) {
    setAlertForm({ type: a.type, title: a.title, body: a.body, cta: a.cta, startTime: a.startTime, endTime: a.endTime, days: [...a.days] })
    setEditingAlertId(a.id)
    setAlertFormOpen(true)
  }

  function cancelAlertForm() {
    setAlertFormOpen(false)
    setEditingAlertId(null)
    setAlertForm(BLANK_FORM)
  }

  function saveAlert() {
    if (!alertForm.title.trim() || !alertForm.body.trim()) return
    if (editingAlertId) {
      setBizAlerts(prev => prev.map(a => a.id === editingAlertId ? { ...a, ...alertForm } : a))
    } else {
      setBizAlerts(prev => [...prev, { ...alertForm, id: `alert-${Date.now()}`, bizId: vert.id, active: true }])
    }
    cancelAlertForm()
  }
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: vert.full.split(' ')[0] + ' (tú)', email: '', role: 'Dueño', status: 'activo' },
  ])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Caja'>('Admin')
  const [inviteError, setInviteError] = useState('')
  const [resentEmpIds, setResentEmpIds] = useState<number[]>([])

  function flashResent(id: number) {
    setResentEmpIds(prev => [...prev, id])
    setTimeout(() => setResentEmpIds(prev => prev.filter(x => x !== id)), 2500)
  }

  function sendInvite() {
    const email = inviteEmail.trim()
    if (!email || !email.includes('@')) { setInviteError('Ingresa un correo válido.'); return }
    const existing = employees.find(e => e.email === email)
    if (existing?.status === 'activo') { setInviteError('Este correo ya tiene acceso activo.'); return }
    if (existing?.status === 'invitado') { flashResent(existing.id); setInviteEmail(''); setInviteError(''); return }
    setEmployees(prev => [...prev, { id: Date.now(), name: '', email, role: inviteRole, status: 'invitado' }])
    setInviteEmail('')
    setInviteError('')
  }

  const fieldStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }
  const lblStyle: CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 5 }
  const titles: Record<string, string> = { perfil: 'Perfil del negocio', horarios: 'Horarios y capacidad', agente: 'Agente de IA', alertas: 'Alertas proactivas', pagos: 'Pagos y comisiones', destacados: 'Destacados', plan: 'Plan Reva' }
  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: agentOn ? R.jadeTint : R.bgAlt, borderRadius: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15, color: R.ink }}>Agente IA — {agentOn ? 'Activo' : 'Pausado'}</div>
          <div style={{ fontSize: 13, color: R.inkSoft, marginTop: 2 }}>{agentOn ? 'Reva está negociando solicitudes en tiempo real.' : 'Las solicitudes quedan en cola sin responder.'}</div>
        </div>
        <button onClick={() => setAgentOn(!agentOn)} style={{ width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer', background: agentOn ? R.jade : R.line, position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 3, left: agentOn ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
        </button>
      </div>

      {/* Datos del negocio para el ticket */}
      <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Icon n="info" size={17} color={R.coral} />
          <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15, color: R.ink }}>Datos del negocio</span>
        </div>
        <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 12 }}>Aparecen en el ticket de venta.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bizFields.map(f => (
            <label key={f.key} style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 5 }}>{f.label}</span>
              <input value={bizInfo[f.key]} onChange={e => setBizInfo({ ...bizInfo, [f.key]: e.target.value })} placeholder={f.placeholder}
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }} />
            </label>
          ))}
        </div>
      </div>

      {/* Manejo de IVA en el Punto de venta */}
      <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Icon n="card" size={17} color={R.coral} />
          <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15, color: R.ink }}>Manejo de IVA</span>
        </div>
        <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 12 }}>Cómo se calcula el impuesto en el Punto de venta.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {taxOpts.map(o => {
            const on = taxMode === o.id
            return (
              <button key={o.id} onClick={() => setTaxMode(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: on ? R.coralTint : R.bg, border: `1px solid ${on ? R.coral : R.line}`, borderRadius: 12, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left', width: '100%' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${on ? R.coral : R.inkFaint}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {on && <span style={{ width: 10, height: 10, borderRadius: '50%', background: R.coral }} />}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 14, color: on ? R.coralPress : R.ink }}>{o.label}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: R.inkSoft, marginTop: 1 }}>{o.sub}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Empleados ─────────────────────────────────── */}
      <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Icon n="users" size={17} color={R.coral} />
          <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15, color: R.ink }}>Empleados</span>
        </div>
        <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 14 }}>Acceso a la plataforma para tu equipo.</div>

        {/* member list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {employees.map(emp => (
            <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: R.bg, border: `1px solid ${R.line}`, borderRadius: 12 }}>
              {/* avatar */}
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: emp.role === 'Dueño' ? R.coralTint : R.bgAlt, display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: R.display, fontWeight: 800, fontSize: 15, color: emp.role === 'Dueño' ? R.coralPress : R.inkSoft }}>
                {(emp.name || emp.email).slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {emp.name || emp.email}
                </div>
                {emp.name && <div style={{ fontSize: 12, color: R.inkFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.email || '—'}</div>}
              </div>
              {/* role chip */}
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: emp.role === 'Dueño' ? R.coralTint : emp.role === 'Admin' ? R.jadeTint : R.bgAlt, color: emp.role === 'Dueño' ? R.coralPress : emp.role === 'Admin' ? R.jade : R.inkSoft, whiteSpace: 'nowrap' }}>
                {emp.role}
              </span>
              {/* status chip */}
              {emp.status === 'invitado' && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', background: resentEmpIds.includes(emp.id) ? R.jadeTint : R.amberTint, color: resentEmpIds.includes(emp.id) ? R.jade : R.amberDeep }}>
                  {resentEmpIds.includes(emp.id) ? 'Reenviado ✓' : 'Pendiente'}
                </span>
              )}
              {emp.status === 'invitado' && (
                <button onClick={() => flashResent(emp.id)} title="Reenviar invitación" aria-label="Reenviar" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: R.inkFaint, display: 'grid', placeItems: 'center' }}>
                  <Icon n="send" size={13} color={R.inkFaint} />
                </button>
              )}
              {/* remove (not for owner) */}
              {emp.role !== 'Dueño' && (
                <button onClick={() => setEmployees(prev => prev.filter(e => e.id !== emp.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: R.inkFaint, display: 'grid', placeItems: 'center' }} aria-label="Eliminar">
                  <Icon n="x" size={15} color={R.inkFaint} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* invite form */}
        <div style={{ borderTop: `1px solid ${R.line}`, paddingTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 9 }}>Invitar empleado</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Icon n="mail" size={15} color={R.inkFaint} stroke={1.8} />
              </div>
              <input
                value={inviteEmail}
                onChange={e => { setInviteEmail(e.target.value); setInviteError('') }}
                onKeyDown={e => e.key === 'Enter' && sendInvite()}
                placeholder="correo@ejemplo.com"
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${inviteError ? R.coral : R.line}`, borderRadius: 10, padding: '10px 12px 10px 34px', fontSize: 13.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }}
              />
            </div>
            {/* role selector */}
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'Admin' | 'Caja')} style={{ border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 10px', fontSize: 13.5, color: R.ink, background: R.bg, fontFamily: R.ui, cursor: 'pointer', outline: 'none' }}>
              <option value="Admin">Admin</option>
              <option value="Caja">Caja</option>
            </select>
          </div>
          {inviteError && <div style={{ fontSize: 12, color: R.coral, marginBottom: 6 }}>{inviteError}</div>}
          <button onClick={sendInvite} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', border: 'none', borderRadius: 10, background: R.ink, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>
            <Icon n="send" size={14} color="#fff" />
            Enviar invitación
          </button>
          <div style={{ fontSize: 11.5, color: R.inkFaint, marginTop: 8 }}>
            Admin: gestiona reservas y mensajes. Caja: solo Punto de venta.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(row => (
          <button key={row.id} onClick={() => setOpen(row.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14.5, color: R.ink }}>{row.label}</p>
              <p style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 2 }}>{row.sub}</p>
            </div>
            <Icon n="chevR" size={18} color={R.inkFaint} />
          </button>
        ))}
      </div>

      {/* Panel de detalle por sección */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto', background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink }}>{titles[open]}</span>
              <button onClick={() => setOpen(null)} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {open === 'perfil' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ position: 'relative', height: 110, borderRadius: 12, border: `1px dashed ${R.line}`, background: profile.img ? `center/cover no-repeat url(${profile.img})` : R.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {!profile.img && <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: R.inkSoft }}><Icon n="plus" size={20} color={R.inkSoft} /><span style={{ fontSize: 13, fontWeight: 600 }}>Subir foto / logo</span></span>}
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setProfile(p => ({ ...p, img: r.result as string })); r.readAsDataURL(f) }} style={{ display: 'none' }} />
                </label>
                <label><span style={lblStyle}>Nombre del negocio</span><input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} style={fieldStyle} /></label>
                <label><span style={lblStyle}>Descripción</span><textarea value={profile.desc} onChange={e => setProfile({ ...profile, desc: e.target.value })} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} /></label>
              </div>
            )}

            {open === 'horarios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <label style={{ flex: 1 }}><span style={lblStyle}>Abre</span><input type="time" value={horario.open} onChange={e => setHorario({ ...horario, open: e.target.value })} style={fieldStyle} /></label>
                  <label style={{ flex: 1 }}><span style={lblStyle}>Cierra</span><input type="time" value={horario.close} onChange={e => setHorario({ ...horario, close: e.target.value })} style={fieldStyle} /></label>
                </div>
                <label><span style={lblStyle}>Capacidad ({vert.capacity.label})</span><input inputMode="numeric" value={horario.capacity} onChange={e => setHorario({ ...horario, capacity: e.target.value.replace(/\D/g, '') })} style={fieldStyle} /></label>
                <div style={{ fontSize: 12.5, color: R.inkSoft }}>Reva no aceptará reservas fuera de este horario ni por encima de la capacidad.</div>
              </div>
            )}

            {open === 'agente' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <span style={lblStyle}>Tono</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Cálido', 'Neutral', 'Formal'].map(t => {
                      const on = agente.tone === t
                      return <button key={t} onClick={() => setAgente({ ...agente, tone: t })} style={{ padding: '8px 16px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, color: on ? R.coralPress : R.inkSoft, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13 }}>{t}</button>
                    })}
                  </div>
                </div>
                <label><span style={lblStyle}>Instrucciones</span><textarea value={agente.instructions} onChange={e => setAgente({ ...agente, instructions: e.target.value })} rows={4} style={{ ...fieldStyle, resize: 'vertical' }} /></label>
                <label><span style={lblStyle}>Límite de descuento que puede ofrecer</span>
                  <div style={{ position: 'relative' }}>
                    <input inputMode="numeric" value={agente.maxDiscount} onChange={e => setAgente({ ...agente, maxDiscount: e.target.value.replace(/\D/g, '') })} style={{ ...fieldStyle, paddingRight: 34 }} />
                    <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: R.inkSoft, fontSize: 14 }}>%</span>
                  </div>
                </label>
              </div>
            )}

            {open === 'alertas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 2 }}>Reva muestra estas alertas a clientes cercanos en tiempo real cuando están activas.</div>

                {/* existing alerts */}
                {bizAlerts.length === 0 && !alertFormOpen && (
                  <div style={{ padding: '18px', textAlign: 'center', border: `1px dashed ${R.line}`, borderRadius: 12, color: R.inkFaint, fontSize: 13 }}>
                    Sin alertas configuradas todavía.
                  </div>
                )}
                {bizAlerts.map(a => (
                  <div key={a.id} style={{ padding: '12px 14px', border: `1px solid ${editingAlertId === a.id ? R.coral : a.active ? R.coral : R.line}`, borderRadius: 12, background: editingAlertId === a.id ? '#FFF3E0' : a.active ? R.coralTint : R.surface }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{ALERT_TYPES.find(t => t.id === a.type)?.emoji ?? '🔔'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13.5, color: R.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                        <p style={{ fontSize: 12, color: R.inkSoft, margin: '2px 0 0' }}>{a.startTime} – {a.endTime} · {a.days.length === 0 ? 'Todos los días' : a.days.map(d => DAY_LABELS[d]).join(', ')}</p>
                      </div>
                      {/* edit */}
                      <button onClick={() => startEditAlert(a)} title="Editar alerta"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: R.inkFaint, display: 'grid', placeItems: 'center' }}>
                        <Icon n="edit" size={15} color={editingAlertId === a.id ? R.coral : R.inkFaint} />
                      </button>
                      {/* toggle active */}
                      <button onClick={() => setBizAlerts(prev => prev.map(x => x.id === a.id ? { ...x, active: !x.active } : x))}
                        style={{ width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', background: a.active ? R.jade : R.line, position: 'relative', flexShrink: 0 }}>
                        <span style={{ position: 'absolute', top: 3, left: a.active ? 18 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
                      </button>
                      {/* delete */}
                      <button onClick={() => { if (editingAlertId === a.id) cancelAlertForm(); setBizAlerts(prev => prev.filter(x => x.id !== a.id)) }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: R.inkFaint, display: 'grid', placeItems: 'center' }}>
                        <Icon n="trash" size={15} color={R.inkFaint} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* new alert form */}
                {alertFormOpen ? (
                  <div style={{ border: `1px solid ${R.line}`, borderRadius: 14, padding: '14px', background: R.surface, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: R.inkSoft }}>{editingAlertId ? 'Editar alerta' : 'Nueva alerta'}</div>
                    {/* type */}
                    <div>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 7 }}>Tipo</span>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {ALERT_TYPES.map(t => {
                          const on = alertForm.type === t.id
                          return (
                            <button key={t.id} onClick={() => setAlertForm(f => ({ ...f, type: t.id }))}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.bg, cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 13, color: on ? R.coralPress : R.inkSoft }}>
                              {t.emoji} {t.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {/* title */}
                    <label>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 5 }}>Título del aviso</span>
                      <input value={alertForm.title} onChange={e => setAlertForm(f => ({ ...f, title: e.target.value }))} placeholder="Es happy hour a 2 min de ti — Mi negocio" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }} />
                    </label>
                    {/* body */}
                    <label>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 5 }}>Descripción</span>
                      <textarea value={alertForm.body} onChange={e => setAlertForm(f => ({ ...f, body: e.target.value }))} rows={2} placeholder="Terraza de azotea, 6–8pm. ¿Te aparto antes de que se llene?" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg, resize: 'vertical' }} />
                    </label>
                    {/* cta */}
                    <label>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 5 }}>Texto del botón</span>
                      <input value={alertForm.cta} onChange={e => setAlertForm(f => ({ ...f, cta: e.target.value }))} placeholder="Échale un ojo" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }} />
                    </label>
                    {/* time window */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <label style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 5 }}>Desde</span>
                        <input type="time" value={alertForm.startTime} onChange={e => setAlertForm(f => ({ ...f, startTime: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }} />
                      </label>
                      <label style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 5 }}>Hasta</span>
                        <input type="time" value={alertForm.endTime} onChange={e => setAlertForm(f => ({ ...f, endTime: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.bg }} />
                      </label>
                    </div>
                    {/* days */}
                    <div>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: R.inkSoft, marginBottom: 7 }}>Días <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(vacío = todos)</span></span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {DAY_LABELS.map((d, i) => {
                          const on = alertForm.days.includes(i)
                          return (
                            <button key={i} onClick={() => setAlertForm(f => ({ ...f, days: on ? f.days.filter(x => x !== i) : [...f.days, i] }))}
                              style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.bg, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13, color: on ? R.coralPress : R.inkSoft }}>
                              {d}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {/* actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveAlert} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 10, background: R.ink, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14 }}>{editingAlertId ? 'Actualizar alerta' : 'Guardar alerta'}</button>
                      <button onClick={cancelAlertForm} style={{ padding: '11px 16px', border: `1px solid ${R.line}`, borderRadius: 10, background: R.bg, cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 14, color: R.inkSoft }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAlertFormOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', border: `1px dashed ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 13.5, color: R.inkSoft }}>
                    <Icon n="plus" size={16} color={R.inkSoft} /> Añadir nueva alerta
                  </button>
                )}
              </div>
            )}

            {open === 'pagos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ border: `1px solid ${stripeReady ? R.jade : R.line}`, borderRadius: 12, padding: 14, background: stripeReady ? R.jadeTint ?? R.surface : R.surface, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: R.ink }}>Cobros con Stripe</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: stripeReady ? R.jade : R.inkFaint, background: stripeReady ? (R.jadeTint ?? R.bgAlt) : R.bgAlt, padding: '3px 10px', borderRadius: 999 }}>
                      {stripeReady ? 'Conectado' : stripeConn?.connected ? 'Incompleto' : 'Sin conectar'}
                    </span>
                  </div>
                  <span style={{ fontSize: 12.5, color: R.inkSoft }}>
                    Conecta tu cuenta para recibir los depósitos de tus reservas directo a tu banco. Reva retiene una comisión del 2% por cada cobro; el resto es tuyo.
                  </span>
                  {!stripeReady && (
                    <button onClick={startStripeOnboard} disabled={stripeBusy} style={{ alignSelf: 'flex-start', padding: '9px 16px', borderRadius: 999, border: 'none', background: R.coral, color: '#fff', cursor: stripeBusy ? 'wait' : 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13, opacity: stripeBusy ? 0.7 : 1 }}>
                      {stripeBusy ? 'Abriendo Stripe…' : stripeConn?.connected ? 'Continuar conexión' : 'Conectar con Stripe'}
                    </button>
                  )}
                  {stripeReady && !stripeConn?.payouts_enabled && (
                    <span style={{ fontSize: 12, color: R.amber ?? R.inkSoft }}>Cobros activos. Falta habilitar los depósitos a tu banco — completa tus datos en Stripe.</span>
                  )}
                  {stripeErr && (
                    <span style={{ fontSize: 12, color: R.coralPress ?? R.coral, background: R.coralTint ?? R.bgAlt, borderRadius: 8, padding: '8px 10px' }}>{stripeErr}</span>
                  )}
                </div>
                <button onClick={() => setPagos({ ...pagos, deposit: !pagos.deposit })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${R.line}`, borderRadius: 10, background: R.surface, cursor: 'pointer', fontFamily: R.ui }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: R.ink }}>Pedir depósito al reservar</span>
                  <span style={{ width: 34, height: 20, borderRadius: 999, background: pagos.deposit ? R.jade : R.inkFaint, position: 'relative', flexShrink: 0 }}><span style={{ position: 'absolute', top: 2, left: pagos.deposit ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} /></span>
                </button>
                {pagos.deposit && <label><span style={lblStyle}>Monto del depósito</span><input inputMode="numeric" value={pagos.depositAmount} onChange={e => setPagos({ ...pagos, depositAmount: e.target.value.replace(/\D/g, '') })} style={fieldStyle} /></label>}
                <div>
                  <span style={lblStyle}>Métodos de cobro aceptados</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Efectivo', 'Tarjeta', 'Transferencia'].map(mth => {
                      const on = pagos.methods.includes(mth)
                      return <button key={mth} onClick={() => setPagos({ ...pagos, methods: on ? pagos.methods.filter(x => x !== mth) : [...pagos.methods, mth] })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, color: on ? R.coralPress : R.inkSoft, cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 13 }}><Icon n={on ? 'check' : 'plus'} size={13} color={on ? R.coralPress : R.inkFaint} /> {mth}</button>
                    })}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: R.inkSoft, background: R.bgAlt, borderRadius: 10, padding: '10px 12px' }}>El manejo de IVA ({taxMode === 'added' ? 'agregado al total' : 'incluido en el precio'}) se configura arriba, en “Manejo de IVA”. Comisión Reva: 2% por procesamiento de pagos.</div>
              </div>
            )}

            {open === 'destacados' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13.5, color: R.inkSoft }}>Compra visibilidad para aparecer arriba en la plataforma. Reva siempre lo marca como “Destacado”.</div>
                {(Object.keys(DEST_TIERS) as TierId[]).map(t => {
                  const T = DEST_TIERS[t]
                  return (
                    <div key={t} style={{ border: `1px solid ${R.line}`, borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: T.accent.press, background: T.accent.tint, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{T.badge}</span>
                      <span style={{ flex: 1, fontSize: 12.5, color: R.inkSoft }}>Desde <b style={{ color: R.ink }}>{T.from}</b> · {T.cupos} cupos</span>
                    </div>
                  )
                })}
                <button onClick={() => { setOpen(null); onGo('destacado') }} style={{ marginTop: 4, padding: '13px', border: 'none', borderRadius: 14, background: R.coral, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5 }}>Ir a Destacado</button>
              </div>
            )}

            {open === 'plan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13.5, color: R.inkSoft, marginBottom: 4 }}>Tu negocio usa Reva con un solo plan simple.</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', border: `1px solid ${R.coral}`, background: R.coralTint, borderRadius: 14, fontFamily: R.ui }}>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14.5, color: R.coralPress }}>Plan Reva</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: R.jade, color: '#fff', padding: '2px 8px', borderRadius: 999 }}>15 días gratis</span>
                      <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 14, color: R.ink, marginLeft: 'auto' }}>$300/mes</span>
                    </span>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: R.coralPress, marginTop: 2 }}>+ 2% por procesamiento de pagos</span>
                    <span style={{ display: 'block', fontSize: 12, color: R.inkFaint, marginTop: 2 }}>Agente de IA · agenda en tiempo real · panel · mensajes · reportes completos · soporte prioritario.</span>
                  </span>
                </div>
                {/* Destacado add-on */}
                <div style={{ border: `1px solid ${R.amberTint}`, borderRadius: 14, padding: '13px 14px', background: R.amberTint, marginTop: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: R.amberDeep, margin: 0 }}>✦ Destacado — add-on</p>
                      <p style={{ fontSize: 12, color: R.amberDeep, margin: '3px 0 6px', opacity: .85 }}>Sin comisión adicional · compatible con cualquier plan</p>
                    </div>
                    <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 14, color: R.amberDeep, whiteSpace: 'nowrap' }}>Desde $2,500/sem</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {['Aparición al tope de búsquedas', 'Banner en Discovery', 'Estadísticas de visibilidad'].map(f => (
                      <span key={f} style={{ fontSize: 11, fontWeight: 600, background: 'rgba(154,108,28,.12)', color: R.amberDeep, padding: '3px 8px', borderRadius: 999 }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {open !== 'destacados' && (
              <button onClick={() => setOpen(null)} style={{ width: '100%', marginTop: 18, padding: '13px', border: 'none', borderRadius: 14, background: R.ink, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5 }}>Guardar cambios</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

type TierId = 'premium' | 'destacado'
const DEST_TIERS: Record<TierId, {
  label: string; badge: string; from: string; cupos: number; otros: number; blurb: string
  accent: { main: string; press: string; tint: string }
  plans: { id: string; label: string; days: number; price: string; perDay: string; sub: string; best?: boolean }[]
}> = {
  premium: {
    label: 'Premium', badge: '★ Premium', from: '$890', cupos: 2, otros: 1,
    blurb: 'El lugar #1 del top y prioridad en las recomendaciones de Reva. Muy pocos cupos.',
    accent: { main: R.amber, press: R.amberDeep, tint: R.amberTint },
    plans: [
      { id: 'semana', label: 'Semana', days: 7, price: '$890', perDay: '$127/día', sub: 'Pruébalo unos días' },
      { id: 'quincena', label: 'Quincena', days: 15, price: '$1,590', perDay: '$106/día', sub: 'Lo más elegido', best: true },
      { id: 'mes', label: 'Mes', days: 30, price: '$2,790', perDay: '$93/día', sub: 'Mejor precio por día' },
    ],
  },
  destacado: {
    label: 'Destacado', badge: '✦ Destacado', from: '$390', cupos: 8, otros: 5,
    blurb: 'Aparece en la franja de Destacados, arriba de los resultados. Más cupos y más accesible.',
    accent: { main: R.coral, press: R.coralPress, tint: R.coralTint },
    plans: [
      { id: 'semana', label: 'Semana', days: 7, price: '$390', perDay: '$56/día', sub: 'Pruébalo unos días' },
      { id: 'quincena', label: 'Quincena', days: 15, price: '$690', perDay: '$46/día', sub: 'Lo más elegido', best: true },
      { id: 'mes', label: 'Mes', days: 30, price: '$1,190', perDay: '$40/día', sub: 'Mejor precio por día' },
    ],
  },
}

function DestacadoView({ vert }: { vert: Vert }) {
  const [tier, setTier] = useState<TierId>('destacado')
  const [plan, setPlan] = useState('quincena')
  const [content, setContent] = useState<'negocio' | number>('negocio')
  const [featured, setFeatured] = useState<{ tier: TierId; label: string; days: number; what: string } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [waitlisted, setWaitlisted] = useState(false)

  const T = DEST_TIERS[tier]
  const A = T.accent
  const sel = T.plans.find(p => p.id === plan) ?? T.plans[1]
  const selContent = content === 'negocio' ? null : vert.catalog[content]
  const whatLabel = selContent ? selContent.name : 'Todo el negocio'
  const heldHere = featured?.tier === tier
  const ocupados = T.otros + (heldHere ? 1 : 0)
  const disponibles = Math.max(0, T.cupos - ocupados)
  const lleno = disponibles === 0 && !heldHere

  function pay() {
    setFeatured({ tier, label: sel.label, days: sel.days, what: whatLabel })
    setWaitlisted(false)
    setConfirming(false)
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 940 }}>
      {/* Estado actual */}
      {featured ? (
        <div style={{ borderRadius: 18, background: `linear-gradient(120deg, ${R.jade}, #16614c)`, color: '#fff', padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon n="spark" size={26} color="#fff" fill="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20 }}>Estás en {DEST_TIERS[featured.tier].label} ✦</div>
            <div style={{ fontSize: 13.5, opacity: .85, marginTop: 4 }}>Destacando <strong style={{ fontWeight: 700 }}>{featured.what}</strong> · {featured.days} días restantes ({featured.label}) · rotación equitativa</div>
          </div>
          <button onClick={() => setFeatured(null)} style={{ background: 'rgba(255,255,255,.16)', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 18px', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', flexShrink: 0 }}>Pausar</button>
        </div>
      ) : (
        <div style={{ borderRadius: 18, background: `linear-gradient(120deg, ${R.dusk}, ${R.duskSoft})`, color: '#fff', padding: '24px', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,.14)', padding: '4px 10px', borderRadius: 999 }}>
            <Icon n="spark" size={12} color="#fff" fill="#fff" /> Destacado
          </div>
          <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 23, marginTop: 12 }}>Aparece primero en Los Cabos</div>
          <div style={{ fontSize: 14, opacity: .82, marginTop: 6, maxWidth: 560 }}>Reva pone a {vert.name} arriba en Discover cuando alguien busca lo que ofreces. Siempre marcado como “Destacado” — honesto y claro para el huésped.</div>
        </div>
      )}

      {/* Impacto */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
        <BMetric label="Más solicitudes" value="+38%" tint={R.coralTint} icon={<Icon n="bolt" size={20} color={R.coral} />} />
        <BMetric label="Vistas en Discover" value="3.2×" tint={R.jadeTint} icon={<Icon n="chart" size={20} color={R.jade} />} />
        <BMetric label={heldHere ? `Tu cupo · ${T.label}` : `Cupos · ${T.label}`} value={heldHere ? `1 de ${T.cupos}` : `${disponibles} de ${T.cupos}`} tint={A.tint} icon={<Icon n="spark" size={20} color={A.main} />} />
      </div>

      {/* Nivel */}
      <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, marginBottom: 12 }}>Elige tu espacio</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {(['premium', 'destacado'] as TierId[]).map(id => {
          const D = DEST_TIERS[id]; const on = tier === id; const ac = D.accent
          return (
            <button key={id} onClick={() => setTier(id)} style={{ textAlign: 'left', cursor: 'pointer', borderRadius: 16, padding: 18, border: `1.5px solid ${on ? ac.main : R.line}`, background: on ? ac.tint : R.surface, fontFamily: R.ui }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 16, color: on ? ac.press : R.ink }}>{D.badge}</span>
                {id === 'premium' && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: ac.press, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.03em' }}>Máx. visibilidad</span>}
              </div>
              <div style={{ fontSize: 12.5, color: R.inkSoft, marginBottom: 12, lineHeight: 1.45 }}>{D.blurb}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 12, color: R.inkSoft }}>desde</span>
                <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 22, color: R.ink }}>{D.from}</span>
                <span style={{ fontSize: 12, color: R.inkSoft }}>· {D.cupos} cupos</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Qué destacar */}
      <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, marginBottom: 4 }}>¿Qué quieres destacar?</div>
      <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 12 }}>Esto es lo que el huésped verá arriba en Discover.</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => setContent('negocio')} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${content === 'negocio' ? A.main : R.line}`, background: content === 'negocio' ? A.tint : R.surface, fontFamily: R.ui }}>
          <Icon n="home" size={16} color={content === 'negocio' ? A.press : R.inkSoft} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: content === 'negocio' ? A.press : R.ink }}>Todo el negocio</span>
        </button>
        {vert.catalog.map((c, i) => {
          const on = content === i
          return (
            <button key={i} onClick={() => setContent(i)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${on ? A.main : R.line}`, background: on ? A.tint : R.surface, fontFamily: R.ui }}>
              <span style={{ width: 16, height: 16, borderRadius: 5, background: `linear-gradient(140deg, ${c.grad[0]}, ${c.grad[1]})`, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: on ? A.press : R.ink }}>{c.name} <span style={{ color: R.inkSoft, fontWeight: 500 }}>· {c.price}</span></span>
            </button>
          )
        })}
      </div>

      {/* Disponibilidad + duración */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: lleno ? R.coralPress : R.inkSoft, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: lleno ? R.coral : R.jade, flexShrink: 0 }} />
        {heldHere ? `Tienes 1 de ${T.cupos} cupos de ${T.label} en ${vert.kind} · ${vert.hood}` : lleno ? `Sin cupos de ${T.label} en ${vert.kind} · ${vert.hood} ahora mismo` : `Quedan ${disponibles} de ${T.cupos} cupos de ${T.label} en ${vert.kind} · ${vert.hood}`}
        <span style={{ color: R.inkFaint }}>· rotación equitativa del top</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        {T.plans.map(p => {
          const on = plan === p.id
          return (
            <button key={p.id} onClick={() => setPlan(p.id)} style={{ position: 'relative', textAlign: 'left', cursor: 'pointer', borderRadius: 16, padding: '18px 18px 16px', border: `1.5px solid ${on ? A.main : R.line}`, background: on ? A.tint : R.surface, fontFamily: R.ui }}>
              {p.best && <span style={{ position: 'absolute', top: -10, right: 14, background: A.main, color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.04em' }}>Popular</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${on ? A.main : R.line}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {on && <div style={{ width: 9, height: 9, borderRadius: '50%', background: A.main }} />}
                </div>
                <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15.5, color: on ? A.press : R.ink }}>{p.label}</span>
              </div>
              <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 26, color: R.ink }}>{p.price}</div>
              <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 2 }}>{p.perDay} · {p.sub}</div>
            </button>
          )
        })}
      </div>
      {lleno ? (
        waitlisted ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 18px', background: R.amberTint, color: R.amberDeep, borderRadius: 14, fontFamily: R.ui, fontWeight: 700, fontSize: 14 }}>
            <Icon n="clock" size={16} color={R.amberDeep} /> En lista de espera de {T.label} · te avisamos al liberarse un cupo
          </div>
        ) : (
          <button onClick={() => setWaitlisted(true)} style={{ width: '100%', maxWidth: 320, padding: '13px', background: R.dusk, color: '#fff', border: 'none', borderRadius: 14, fontFamily: R.ui, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon n="clock" size={16} color="#fff" /> Unirme a la lista de espera
          </button>
        )
      ) : (
        <button onClick={() => setConfirming(true)} style={{ width: '100%', maxWidth: 320, padding: '13px', background: A.main, color: '#fff', border: 'none', borderRadius: 14, fontFamily: R.ui, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon n="spark" size={16} color="#fff" fill="#fff" /> {heldHere ? 'Renovar' : 'Comprar'} {T.label} · {sel.price}
        </button>
      )}

      {/* Vista previa */}
      <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, margin: '26px 0 12px' }}>Así te verán en Discover</div>
      <BCard style={{ maxWidth: 360, padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 110, background: `linear-gradient(140deg, ${(selContent ?? vert).grad[0]}, ${(selContent ?? vert).grad[1]})`, position: 'relative' }}>
          <span style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: A.press, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999 }}>
            {T.badge}
          </span>
          <div style={{ position: 'absolute', right: -4, bottom: -8, fontFamily: R.display, fontWeight: 800, fontSize: 64, color: 'rgba(255,255,255,.18)' }}>{vert.mono}</div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          {selContent ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>{selContent.name}</div>
                <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 14, color: A.press, flexShrink: 0 }}>{selContent.price}</div>
              </div>
              <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 2 }}>{selContent.sub} · {vert.name}</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>{vert.name}</div>
              <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 2 }}>{vert.kind} · {vert.hood}</div>
            </>
          )}
        </div>
      </BCard>
      <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 10 }}>El huésped siempre ve la etiqueta del nivel. Nunca ocultamos que es un espacio pagado.</div>

      {/* Confirmación de pago */}
      {confirming && (
        <div onClick={() => setConfirming(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink, marginBottom: 14 }}>Confirmar {T.label}</div>
            <div style={{ background: R.surface, border: `1px solid ${R.line}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px' }}><span style={{ fontSize: 13, color: R.inkSoft }}>Nivel</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{T.label}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Se destaca</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink, textAlign: 'right' }}>{whatLabel}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Plan</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{sel.label} · {sel.days} días</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Negocio</span><span style={{ fontSize: 13.5, fontWeight: 600, color: R.ink }}>{vert.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: `1px solid ${R.lineSoft}` }}><span style={{ fontSize: 13, color: R.inkSoft }}>Total</span><span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 16, color: R.ink }}>{sel.price}</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: R.inkSoft, marginBottom: 16 }}>
              <Icon n="shield" size={15} color={R.jade} /> Pago seguro con Stripe · cancela cuando quieras
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirming(false)} style={{ padding: '12px 16px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: R.inkSoft }}>Cancelar</button>
              <button onClick={pay} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: R.jade, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5, color: '#fff' }}>Pagar y activar · {sel.price}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type PromoType = 'Descuento' | '2x1' | 'Regalo' | 'Precio especial'
const PROMO_TYPES: PromoType[] = ['Descuento', '2x1', 'Regalo', 'Precio especial']
const PROMO_ICON: Record<PromoType, string> = { 'Descuento': 'bolt', '2x1': 'ticket', 'Regalo': 'gift', 'Precio especial': 'spark' }
const promoSeed = () => ([
  { title: '15% en tu primera visita', type: 'Descuento' as PromoType, detail: 'Clientes nuevos que llegan vía Reva', vig: 'Permanente', active: true, canjes: 24 },
  { title: '2x1 entre semana', type: '2x1' as PromoType, detail: 'Lunes a miércoles', vig: 'Hasta 30 jun', active: true, canjes: 38 },
  { title: 'Cortesía de bienvenida', type: 'Regalo' as PromoType, detail: 'En tu cumpleaños', vig: 'Permanente', active: false, canjes: 9 },
])

const LOYALTY_ICON: Record<string, string> = { stamps: 'spark', cashback: 'bolt', coupons: 'ticket', discount: 'bolt', membership: 'shield', multipass: 'grid', referral: 'user', giftcard: 'gift' }
const OPT_CONFIG: Record<string, { label: string; placeholder: string }> = {
  cashback: { label: '% de devolución', placeholder: 'Ej. 5%' },
  coupons: { label: 'Cupón', placeholder: 'Ej. 20% en tu próxima visita' },
  discount: { label: 'Descuento', placeholder: 'Ej. 15% para clientes frecuentes' },
  membership: { label: 'Beneficio principal', placeholder: 'Ej. 10% siempre + reserva prioritaria' },
  multipass: { label: 'Paquete', placeholder: 'Ej. 10 clases por $1,500' },
  referral: { label: 'Recompensa por referido', placeholder: 'Ej. $100 para ambos' },
  giftcard: { label: 'Montos sugeridos', placeholder: 'Ej. $200 / $500 / $1,000' },
}

function PromosView({ vert }: { vert: Vert }) {
  const [tab, setTab] = useState<'ofertas' | 'lealtad'>('ofertas')
  const [promos, setPromos] = useState(promoSeed)
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState({ title: '', type: 'Descuento' as PromoType, detail: '', vig: 'Permanente', active: true })
  const [loyalty, setLoyalty] = useState({ stamps: 6, reward: 'Postre o bebida de cortesía' })
  const [editLoyal, setEditLoyal] = useState(false)
  const [lform, setLform] = useState(loyalty)
  const [bm, setBm] = useState<BMConfig>({ connected: false, options: BM_OPTIONS_DEFAULT })
  const [active, setActive] = useState<Record<string, string>>({})
  const [actOpt, setActOpt] = useState<BMOption | null>(null)
  const [cfgVal, setCfgVal] = useState('')
  function openActivate(o: BMOption) { setActOpt(o); setCfgVal(active[o.id] ?? '') }
  function confirmActivate() { if (!actOpt) return; setActive(a => ({ ...a, [actOpt.id]: cfgVal.trim() })); setActOpt(null) }
  function deactivate(id: string) { setActive(a => { const n = { ...a }; delete n[id]; return n }) }

  useEffect(() => { setPromos(promoSeed()); setEditing(null); setEditLoyal(false) }, [vert.id])
  useEffect(() => { const sync = () => setBm(loadBMConfig()); sync(); window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync) }, [])

  const fieldStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }

  function openNew() { setForm({ title: '', type: 'Descuento', detail: '', vig: 'Permanente', active: true }); setEditing('new') }
  function openEdit(i: number) { const p = promos[i]; setForm({ title: p.title, type: p.type, detail: p.detail, vig: p.vig, active: p.active }); setEditing(i) }
  function savePromo() {
    if (!form.title.trim()) return
    if (editing === 'new') setPromos(prev => [...prev, { ...form, title: form.title.trim(), detail: form.detail.trim(), vig: form.vig.trim() || 'Permanente', canjes: 0 }])
    else if (typeof editing === 'number') setPromos(prev => prev.map((p, idx) => idx === editing ? { ...p, ...form, title: form.title.trim(), detail: form.detail.trim(), vig: form.vig.trim() || 'Permanente' } : p))
    setEditing(null)
  }
  function removePromo() { if (typeof editing === 'number') setPromos(prev => prev.filter((_, idx) => idx !== editing)); setEditing(null) }
  function toggleActive(i: number) { setPromos(prev => prev.map((p, idx) => idx === i ? { ...p, active: !p.active } : p)) }

  const activas = promos.filter(p => p.active).length
  const canjes = promos.reduce((a, p) => a + p.canjes, 0)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 960 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <BMetric label="Promos activas" value={activas} tint={R.coralTint} icon={<Icon n="gift" size={20} color={R.coral} />} />
        <BMetric label="Canjes (mes)" value={canjes} tint={R.jadeTint} icon={<Icon n="ticket" size={20} color={R.jade} />} />
        <BMetric label="Tarjetas Reva+ activas" value={vert.metrics.rove} tint={R.amberTint} icon={<Icon n="spark" size={20} color={R.amber} />} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', gap: 4, background: R.bgAlt, borderRadius: 999, padding: 4, marginBottom: 18 }}>
        {([['ofertas', 'Ofertas'], ['lealtad', 'Lealtad · Reva+']] as [typeof tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, background: tab === id ? R.surface : 'transparent', color: tab === id ? R.ink : R.inkSoft, boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{label}</button>
        ))}
      </div>

      {tab === 'ofertas' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Tus ofertas</div>
            <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: R.ink, color: '#fff', border: 'none', borderRadius: 999, fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
              <Icon n="plus" size={16} color="#fff" /> Crear promoción
            </button>
          </div>
          {promos.length === 0 ? (
            <BCard style={{ textAlign: 'center', padding: '40px 0', color: R.inkSoft }}>Aún no tienes promociones. Crea la primera.</BCard>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {promos.map((p, i) => (
                <BCard key={i} style={{ padding: 16, opacity: p.active ? 1 : .6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: R.coralTint, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon n={PROMO_ICON[p.type]} size={18} color={R.coral} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '3px 9px', borderRadius: 999 }}>{p.type}</span>
                    <button onClick={() => toggleActive(i)} aria-label="Activar" style={{ marginLeft: 'auto', width: 34, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', background: p.active ? R.jade : R.inkFaint, position: 'relative', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: 2, left: p.active ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
                    </button>
                  </div>
                  <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: R.inkSoft, marginTop: 3 }}>{p.detail}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${R.lineSoft}` }}>
                    <Icon n="clock" size={14} color={R.inkFaint} />
                    <span style={{ fontSize: 12.5, color: R.inkSoft }}>{p.vig}</span>
                    <span style={{ fontSize: 12.5, color: R.inkFaint }}>· {p.canjes} canjes</span>
                    <button onClick={() => openEdit(i)} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 4 }} aria-label="Editar"><Icon n="edit" size={16} color={R.inkSoft} /></button>
                  </div>
                </BCard>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'lealtad' && (() => {
        const enabled = bm.options.filter(o => o.on)
        const stampsOn = enabled.some(o => o.id === 'stamps')
        const extras = enabled.filter(o => o.id !== 'stamps')
        return (
          <>
            {bm.connected ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#16614c', background: R.jadeTint, padding: '6px 12px', borderRadius: 999, marginBottom: 16 }}>
                <Icon n="spark" size={13} color={R.jade} fill={R.jade} /> Lealtad activa · powered by BoomerangMe
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: R.amberDeep, background: R.amberTint, padding: '10px 14px', borderRadius: 12, marginBottom: 16 }}>
                <Icon n="clock" size={15} color={R.amberDeep} /> La plataforma está conectando BoomerangMe. Tus opciones se activarán muy pronto.
              </div>
            )}

            {stampsOn ? (
              <>
                <BCard style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ background: `linear-gradient(120deg, ${R.dusk}, ${R.duskSoft})`, color: '#fff', padding: '22px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,.14)', padding: '4px 10px', borderRadius: 999 }}>
                        <Icon n="spark" size={12} color="#fff" fill="#fff" /> Reva+ · Tarjeta de sellos
                      </div>
                      <button onClick={() => { setLform(loyalty); setEditLoyal(true) }} style={{ background: 'rgba(255,255,255,.16)', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontFamily: R.ui, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Editar programa</button>
                    </div>
                    <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 21, marginTop: 14 }}>Sella {loyalty.stamps} visitas → recompensa</div>
                    <div style={{ fontSize: 13.5, opacity: .85, marginTop: 4 }}>Recompensa: {loyalty.reward}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                      {Array.from({ length: loyalty.stamps }).map((_, i) => (
                        <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid rgba(255,255,255,.4)`, display: 'grid', placeItems: 'center', background: i < 3 ? 'rgba(255,255,255,.9)' : 'transparent' }}>
                          {i < 3 && <Icon n="check" size={14} color={R.dusk} stroke={3} />}
                          {i === loyalty.stamps - 1 && <Icon n="gift" size={14} color="#fff" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </BCard>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <BMetric label="Tarjetas activas" value={vert.metrics.rove} tint={R.coralTint} icon={<Icon n="user" size={20} color={R.coral} />} />
                  <BMetric label="Sellos esta semana" value={64} tint={R.jadeTint} icon={<Icon n="check" size={20} color={R.jade} />} />
                  <BMetric label="Recompensas canjeadas" value={12} tint={R.amberTint} icon={<Icon n="gift" size={20} color={R.amber} />} />
                </div>
              </>
            ) : (
              <BCard style={{ textAlign: 'center', padding: '32px 0', color: R.inkSoft }}>La tarjeta de sellos no está habilitada por la plataforma.</BCard>
            )}

            {extras.length > 0 && (
              <>
                <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, margin: '26px 0 4px' }}>Más opciones de lealtad</div>
                <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 14 }}>Habilitadas por Reva para tu negocio. Actívalas cuando quieras.</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {extras.map(o => {
                    const isActive = o.id in active
                    const cfg = active[o.id]
                    const ci = OPT_CONFIG[o.id]
                    return (
                      <BCard key={o.id} style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 8 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: R.coralTint, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={LOYALTY_ICON[o.id] ?? 'gift'} size={18} color={R.coral} /></div>
                          <span style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15.5, color: R.ink }}>{o.label}</span>
                          {isActive && <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: '#16614c', background: R.jadeTint, padding: '3px 8px', borderRadius: 999 }}>Activa</span>}
                        </div>
                        <div style={{ fontSize: 13, color: R.inkSoft }}>{o.desc}</div>
                        {isActive && cfg && <div style={{ fontSize: 12.5, color: R.ink, fontWeight: 600, marginTop: 6 }}>{ci?.label}: <span style={{ color: R.coralPress }}>{cfg}</span></div>}
                        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                          {!bm.connected ? (
                            <button disabled style={{ width: '100%', padding: '10px', border: `1px solid ${R.line}`, borderRadius: 10, background: R.bgAlt, color: R.inkFaint, cursor: 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>Disponible al conectar</button>
                          ) : isActive ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => openActivate(o)} style={{ flex: 1, padding: '10px', border: `1px solid ${R.line}`, borderRadius: 10, background: R.surface, color: R.ink, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>Editar</button>
                              <button onClick={() => deactivate(o.id)} style={{ padding: '10px 14px', border: `1px solid ${R.line}`, borderRadius: 10, background: 'transparent', color: R.coralPress, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>Desactivar</button>
                            </div>
                          ) : (
                            <button onClick={() => openActivate(o)} style={{ width: '100%', padding: '10px', border: 'none', borderRadius: 10, background: R.coral, color: '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>Activar</button>
                          )}
                        </div>
                      </BCard>
                    )
                  })}
                </div>
              </>
            )}
            <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 14 }}>Las opciones disponibles las define Reva (plataforma) vía BoomerangMe. Reva sella automáticamente al confirmar cada visita.</div>

          {/* ── Recompensas Rove Marketplace ── */}
          <RoveRewardsSection bizId={vert.id} bizName={vert.name} bizColor={R.coral} />
          </>
        )
      })()}

      {/* Modal activar opción de lealtad */}
      {actOpt && (() => {
        const ci = OPT_CONFIG[actOpt.id]
        return (
          <div onClick={() => setActOpt(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 6 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: R.coralTint, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={LOYALTY_ICON[actOpt.id] ?? 'gift'} size={19} color={R.coral} /></div>
                <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink }}>Activar {actOpt.label}</span>
              </div>
              <p style={{ fontSize: 13.5, color: R.inkSoft, marginBottom: 16 }}>{actOpt.desc}</p>
              <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{ci?.label ?? 'Configuración'}</div>
              <input value={cfgVal} onChange={e => setCfgVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmActivate() }} placeholder={ci?.placeholder ?? ''} style={fieldStyle} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: R.inkSoft, margin: '14px 0 16px' }}>
                <Icon n="spark" size={14} color={R.jade} /> Reva la ofrecerá a tus clientes vía BoomerangMe.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setActOpt(null)} style={{ padding: '12px 16px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: R.inkSoft }}>Cancelar</button>
                <button onClick={confirmActivate} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: R.jade, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5, color: '#fff' }}>Activar para clientes</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal crear/editar promo */}
      {editing !== null && (
        <div onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink }}>{editing === 'new' ? 'Nueva promoción' : 'Editar promoción'}</span>
              <button onClick={() => setEditing(null)} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título (ej. 2x1 en mezcal)" style={fieldStyle} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Tipo</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PROMO_TYPES.map(t => {
                    const on = form.type === t
                    return <button key={t} onClick={() => setForm({ ...form, type: t })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, color: on ? R.coralPress : R.inkSoft, fontFamily: R.ui, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}><Icon n={PROMO_ICON[t]} size={14} color={on ? R.coralPress : R.inkSoft} /> {t}</button>
                  })}
                </div>
              </div>
              <input value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} placeholder="Condición (ej. lunes a miércoles)" style={fieldStyle} />
              <input value={form.vig} onChange={e => setForm({ ...form, vig: e.target.value })} placeholder="Vigencia (ej. Permanente o Hasta 30 jun)" style={fieldStyle} />
              <button onClick={() => setForm({ ...form, active: !form.active })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${R.line}`, borderRadius: 10, background: R.surface, cursor: 'pointer', fontFamily: R.ui }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: R.ink }}>Activa</span>
                <span style={{ width: 34, height: 20, borderRadius: 999, background: form.active ? R.jade : R.inkFaint, position: 'relative', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: form.active ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff' }} />
                </span>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {typeof editing === 'number' && <button onClick={removePromo} style={{ padding: '12px 16px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: R.coralPress }}>Eliminar</button>}
              <button onClick={savePromo} disabled={!form.title.trim()} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: form.title.trim() ? R.coral : R.coralTint, cursor: form.title.trim() ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5, color: form.title.trim() ? '#fff' : R.coralPress }}>{editing === 'new' ? 'Crear promoción' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar lealtad */}
      {editLoyal && (
        <div onClick={() => setEditLoyal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink, marginBottom: 16 }}>Editar programa Reva+</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Sellos para la recompensa</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setLform(f => ({ ...f, stamps: Math.max(3, f.stamps - 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${R.line}`, background: R.surface, cursor: 'pointer', fontSize: 20, color: R.ink }}>−</button>
                  <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 24, color: R.ink, width: 36, textAlign: 'center' }}>{lform.stamps}</span>
                  <button onClick={() => setLform(f => ({ ...f, stamps: Math.min(12, f.stamps + 1) }))} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${R.line}`, background: R.surface, cursor: 'pointer', fontSize: 20, color: R.ink }}>+</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Recompensa</div>
                <input value={lform.reward} onChange={e => { const v = e.target.value; setLform(f => ({ ...f, reward: v })) }} placeholder="Ej. Postre de cortesía" style={fieldStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setEditLoyal(false)} style={{ padding: '12px 16px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: R.inkSoft }}>Cancelar</button>
              <button onClick={() => { setLoyalty(lform); setEditLoyal(false) }} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: R.coral, cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5, color: '#fff' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Rove Marketplace: proponer recompensas ─────────────────

const REWARD_CATEGORIES: { id: RewardCategory; label: string; emoji: string }[] = [
  { id: 'food',       label: 'Comida & bebida', emoji: '🍽️' },
  { id: 'experience', label: 'Experiencia',     emoji: '🌅' },
  { id: 'discount',   label: 'Descuento',       emoji: '🏷️' },
  { id: 'upgrade',    label: 'Upgrade',         emoji: '⭐' },
]

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'En revisión', color: '#9A6C1C', bg: '#FBEFD7' },
  active:   { label: 'Activa',      color: '#16614c', bg: '#DDF0E8' },
  paused:   { label: 'Pausada',     color: '#6B615A', bg: '#F1EADF' },
  rejected: { label: 'Rechazada',   color: '#D23B47', bg: '#FCE9E7' },
}

function RoveRewardsSection({ bizId, bizName, bizColor }: { bizId: string; bizName: string; bizColor: string }) {
  const [rewards, setRewards] = useState<RoveReward[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const emptyForm = { title: '', description: '', ticketCost: 5, category: 'food' as RewardCategory, stock: '', validDays: 30 }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetch('/api/rove/rewards')
      .then(r => r.json())
      .then(d => setRewards((d.rewards ?? []).filter((r: RoveReward) => r.bizId === bizId)))
      .catch(() => {})
  }, [bizId])

  async function submit() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/rove/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bizId, bizName,
          bizLetter: bizName[0].toUpperCase(),
          bizColor,
          title: form.title.trim(),
          description: form.description.trim(),
          ticketCost: Number(form.ticketCost),
          category: form.category,
          stock: form.stock !== '' ? Number(form.stock) : null,
          validDays: Number(form.validDays),
        }),
      })
      const data = await res.json()
      if (res.ok) { setRewards(prev => [...prev, data.reward]); setShowForm(false); setForm(emptyForm) }
    } finally { setSaving(false) }
  }

  const fieldStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface }

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink }}>Recompensas Reva+</div>
          <div style={{ fontSize: 13, color: R.inkSoft, marginTop: 2 }}>Propón recompensas que los clientes canjean con boletos Reva+. Reva las aprueba antes de publicar.</div>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: R.ink, color: '#fff', border: 'none', borderRadius: 999, fontFamily: R.ui, fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, marginLeft: 16 }}>
          <Icon n="plus" size={15} color="#fff" /> Proponer
        </button>
      </div>

      {rewards.length === 0 ? (
        <BCard style={{ padding: '28px 20px', textAlign: 'center', color: R.inkSoft }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎁</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Sin recompensas todavía</div>
          <div style={{ fontSize: 13 }}>Propón una recompensa para aparecer en el marketplace de Reva+.</div>
        </BCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {rewards.map(r => {
            const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending
            const cat = REWARD_CATEGORIES.find(c => c.id === r.category)
            return (
              <BCard key={r.id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: R.coralTint, display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{cat?.emoji ?? '🎁'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 15, color: R.ink }}>{r.title}</div>
                    <div style={{ fontSize: 12.5, color: R.inkSoft, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 9px', borderRadius: 999 }}>{st.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: R.amberDeep, background: R.amberTint, padding: '3px 9px', borderRadius: 999 }}>{r.ticketCost} boletos</span>
                  {r.stock !== null && <span style={{ fontSize: 12, color: R.inkFaint }}>Stock: {r.stock}</span>}
                </div>
                {r.status === 'rejected' && r.rejectionReason && (
                  <div style={{ marginTop: 8, fontSize: 12.5, color: R.coralPress, background: R.coralTint, borderRadius: 8, padding: '7px 10px' }}>
                    Motivo: {r.rejectionReason}
                  </div>
                )}
              </BCard>
            )
          })}
        </div>
      )}

      {/* Modal proponer recompensa */}
      {showForm && (
        <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(34,28,25,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', background: R.bg, borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19, color: R.ink }}>Proponer recompensa</span>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: R.inkFaint, fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 16 }}>Reva revisará tu propuesta antes de publicarla en el marketplace de boletos.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Título *</div>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej. Bebida de cortesía" style={fieldStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Descripción</div>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Cuéntale al cliente qué incluye y cuándo aplica." rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Categoría</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {REWARD_CATEGORIES.map(c => {
                    const on = form.category === c.id
                    return (
                      <button key={c.id} onClick={() => setForm({ ...form, category: c.id })} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 999, border: `1px solid ${on ? R.coral : R.line}`, background: on ? R.coralTint : R.surface, color: on ? R.coralPress : R.inkSoft, fontFamily: R.ui, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {c.emoji} {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Boletos sugeridos *</div>
                  <input type="number" min={1} max={50} value={form.ticketCost} onChange={e => setForm({ ...form, ticketCost: Number(e.target.value) })} style={fieldStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Días de validez</div>
                  <input type="number" min={1} max={365} value={form.validDays} onChange={e => setForm({ ...form, validDays: Number(e.target.value) })} style={fieldStyle} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Stock disponible <span style={{ fontWeight: 500, textTransform: 'none' }}>(dejar vacío = ilimitado)</span></div>
                <input type="number" min={1} value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="Ilimitado" style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '12px 16px', border: `1px solid ${R.line}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, color: R.inkSoft }}>Cancelar</button>
              <button onClick={submit} disabled={saving || !form.title.trim()} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: form.title.trim() ? R.coral : R.coralTint, color: form.title.trim() ? '#fff' : R.coralPress, cursor: form.title.trim() ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5, opacity: saving ? .7 : 1 }}>
                {saving ? 'Enviando…' : 'Enviar a revisión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Escáner ────────────────────────────────────────────────
type RoveMember = {
  serial: string; name: string; program: RoveProgram; card: string
  stamps?: number; total?: number; reward?: string; pts?: number; last: string
}

// Demo members per business — the serials match the cards a customer carries in /app · Rove,
// so a real camera scan resolves to the same person. In production this lookup is the
// BoomerangMe API (getCustomerStamps / customer search by Card Serial Number).
const ROVE_MEMBERS: Record<string, RoveMember[]> = {
  resto: [
    { serial: ROVE_SERIALS.tacoClub, name: 'Noa Ríos', program: 'stamps', card: 'Taco Club', stamps: 7, total: 10, reward: 'Pastor gratis', last: 'Hace 6 días' },
    { serial: 'RV-LUP-4C1B8', name: 'Diego Marín', program: 'stamps', card: 'Taco Club', stamps: 9, total: 10, reward: 'Pastor gratis', last: 'Ayer' },
    { serial: 'RV-LUP-9T2X5', name: 'Sofía Cano', program: 'stamps', card: 'Taco Club', stamps: 2, total: 10, reward: 'Pastor gratis', last: 'Hace 2 semanas' },
  ],
  spa: [
    { serial: 'RV-SER-3K7P1', name: 'Emily White', program: 'points', card: 'Círculo Sereno', pts: 120, reward: 'Masaje exprés', last: 'Hoy' },
    { serial: 'RV-SER-8M4Q2', name: 'Carla Mota', program: 'points', card: 'Círculo Sereno', pts: 45, reward: 'Masaje exprés', last: 'Hace 3 días' },
  ],
}

// Valida códigos de canje del marketplace Rove (independiente de BoomerangMe).
function RoveCodeValidator({ bizId, onToast }: { bizId: string; onToast: (t: { msg: string; tone: 'ok' | 'warn' }) => void }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [validated, setValidated] = useState<{ title: string; bizName: string; code: string } | null>(null)

  async function validate() {
    const c = code.trim().toUpperCase()
    if (c.length < 4) return
    setBusy(true)
    try {
      const res = await fetch('/api/rove/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c, bizId }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msgs: Record<string, string> = {
          not_found: 'Código no encontrado. Verifica que esté bien escrito.',
          already_used: 'Este código ya fue canjeado anteriormente.',
          expired: 'El código expiró. El cliente deberá solicitar uno nuevo.',
        }
        onToast({ msg: msgs[data.error] ?? 'No se pudo validar el código', tone: 'warn' })
        return
      }
      setValidated({ title: data.redemption.reward.title, bizName: data.redemption.reward.bizName, code: c })
      setCode('')
      onToast({ msg: `✓ Código válido · ${data.redemption.reward.title}`, tone: 'ok' })
    } finally { setBusy(false) }
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${R.lineSoft}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Validar código de recompensa Reva+</div>
      <div style={{ fontSize: 12.5, color: R.inkSoft, marginBottom: 10 }}>El cliente muestra un código de 6 caracteres desde su app.</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setValidated(null) }}
          onKeyDown={e => { if (e.key === 'Enter') validate() }}
          placeholder="Ej. AB3X7K"
          maxLength={6}
          style={{ flex: 1, boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 16, fontWeight: 700, color: R.ink, outline: 'none', fontFamily: 'monospace', background: R.surface, letterSpacing: '.12em', textTransform: 'uppercase' }}
        />
        <button onClick={validate} disabled={busy || code.trim().length < 4} style={{ padding: '0 16px', border: 'none', borderRadius: 10, background: code.trim().length >= 4 ? R.jade : R.bgAlt, color: code.trim().length >= 4 ? '#fff' : R.inkFaint, cursor: code.trim().length >= 4 ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5, opacity: busy ? .7 : 1 }}>
          {busy ? '…' : 'Validar'}
        </button>
      </div>
      {validated && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, background: R.jadeTint, borderRadius: 12, padding: '11px 14px' }}>
          <Icon n="check" size={18} color={R.jade} stroke={3} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: R.ink }}>{validated.title}</div>
            <div style={{ fontSize: 12.5, color: R.inkSoft }}>Código <strong>{validated.code}</strong> marcado como usado</div>
          </div>
        </div>
      )}
    </div>
  )
}

type Detector = { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> }

function ScannerView({ vert }: { vert: Vert }) {
  const [members, setMembers] = useState<RoveMember[]>(ROVE_MEMBERS[vert.id] ?? ROVE_MEMBERS.resto)
  const [result, setResult] = useState<RoveMember | null>(null)
  const [scanning, setScanning] = useState(false)
  const [camErr, setCamErr] = useState<'denied' | 'unsupported' | null>(null)
  const [serial, setSerial] = useState('')
  const [pts, setPts] = useState(10)
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'warn' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [bm, setBm] = useState<BMConfig>({ connected: false, options: BM_OPTIONS_DEFAULT })
  const videoRef = useRef<HTMLVideoElement>(null)
  const membersRef = useRef(members); membersRef.current = members

  useEffect(() => { const sync = () => setBm(loadBMConfig()); sync(); window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync) }, [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t) }, [toast])

  function resolve(raw: string) {
    const tok = parseRoveToken(raw)
    if (!tok) { setToast({ msg: 'Código no reconocido. Intenta de nuevo.', tone: 'warn' }); return false }
    const m = membersRef.current.find(x => x.serial.toUpperCase() === tok.serial.toUpperCase())
    if (!m) { setToast({ msg: `Folio ${tok.serial} sin tarjeta en ${vert.name}.`, tone: 'warn' }); return false }
    setScanning(false); setResult(m); setSerial(''); setToast(null)
    return true
  }

  // Live camera scan via the native BarcodeDetector (Chromium). Falls back to manual entry.
  useEffect(() => {
    if (!scanning) return
    let stream: MediaStream | null = null
    let raf = 0
    let cancelled = false
    const Ctor = (window as unknown as { BarcodeDetector?: new (o?: { formats?: string[] }) => Detector }).BarcodeDetector
    if (!Ctor) { setCamErr('unsupported'); return }
    const detector = new Ctor({ formats: ['qr_code'] })
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        const v = videoRef.current
        if (v) { v.srcObject = stream; await v.play().catch(() => {}) }
        const tick = async () => {
          if (cancelled) return
          const v2 = videoRef.current
          if (v2 && v2.readyState >= 2) {
            try {
              const codes = await detector.detect(v2)
              if (codes[0]?.rawValue && resolve(codes[0].rawValue)) return
            } catch { /* keep scanning */ }
          }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch { setCamErr('denied') }
    })()
    return () => { cancelled = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning])

  function startScan() { setCamErr(null); setResult(null); setScanning(true) }
  function patch(serialId: string, next: Partial<RoveMember>) {
    setMembers(ms => ms.map(m => m.serial === serialId ? { ...m, ...next } : m))
    setResult(r => r && r.serial === serialId ? { ...r, ...next } : r)
  }
  // Run the transaction through /api/scan, which calls BoomerangMe with the platform
  // keys (or acknowledges as simulated while the integration is still being connected).
  async function runScan(action: 'stamp' | 'points' | 'redeem', extra: Record<string, unknown> = {}) {
    if (!result) return null
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, serial: result.serial, businessId: vert.id, ...extra }),
      })
      const data = await res.json() as { ok: boolean; simulated?: boolean; error?: string }
      if (!data.ok) { setToast({ msg: data.error || 'No se pudo procesar', tone: 'warn' }); return null }
      return data
    } catch {
      setToast({ msg: 'Sin conexión con el servidor', tone: 'warn' }); return null
    }
  }
  async function addStamp() {
    if (!result || busy) return
    setBusy(true)
    const data = await runScan('stamp', { count: 1 })
    setBusy(false)
    if (!data) return
    const sfx = data.simulated ? ' (simulado)' : ''
    const next = Math.min(result.total ?? 10, (result.stamps ?? 0) + 1)
    patch(result.serial, { stamps: next })
    const done = next >= (result.total ?? 10)
    setToast({ msg: done ? `¡Sello ${next}/${result.total}! Recompensa lista para canjear 🎁${sfx}` : `Sello agregado · ${next}/${result.total} · pase actualizado${sfx}`, tone: 'ok' })
  }
  async function addPoints() {
    if (!result || busy) return
    setBusy(true)
    const data = await runScan('points', { count: pts })
    setBusy(false)
    if (!data) return
    const sfx = data.simulated ? ' (simulado)' : ''
    patch(result.serial, { pts: (result.pts ?? 0) + pts })
    setToast({ msg: `+${pts} puntos · pase actualizado${sfx}`, tone: 'ok' })
  }
  async function redeem() {
    if (!result || busy) return
    setBusy(true)
    const data = await runScan('redeem', { rewardId: result.reward })
    setBusy(false)
    if (!data) return
    const sfx = data.simulated ? ' (simulado)' : ''
    if (result.program === 'stamps') { patch(result.serial, { stamps: 0 }); setToast({ msg: `Recompensa canjeada: ${result.reward}. Tarjeta reiniciada${sfx}`, tone: 'ok' }) }
    else { patch(result.serial, { pts: Math.max(0, (result.pts ?? 0) - 50) }); setToast({ msg: `Recompensa canjeada · −50 pts${sfx}`, tone: 'ok' }) }
  }
  const stampReady = result?.program === 'stamps' && (result.stamps ?? 0) >= (result.total ?? 10)
  const pointsReady = result?.program === 'points' && (result.pts ?? 0) >= 50

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1000 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <BMetric label="Sellos hoy" value={28} tint={R.jadeTint} icon={<Icon n="check" size={20} color={R.jade} />} />
        <BMetric label="Puntos otorgados (sem.)" value="1.4k" tint={R.amberTint} icon={<Icon n="spark" size={20} color={R.amber} />} />
        <BMetric label="Recompensas canjeadas" value={6} tint={R.coralTint} icon={<Icon n="gift" size={20} color={R.coral} />} />
      </div>

      {/* Connection banner */}
      {bm.connected ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#16614c', background: R.jadeTint, padding: '6px 12px', borderRadius: 999, marginBottom: 16 }}>
          <Icon n="spark" size={13} color={R.jade} fill={R.jade} /> Escáner en vivo · powered by BoomerangMe
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: R.amberDeep, background: R.amberTint, padding: '10px 14px', borderRadius: 12, marginBottom: 16 }}>
          <Icon n="clock" size={15} color={R.amberDeep} /> La plataforma está conectando BoomerangMe. El escáner funciona en modo demostración mientras tanto.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.1fr)', gap: 18, alignItems: 'start' }}>
        {/* ── Scanner panel ── */}
        <BCard style={{ padding: 18 }}>
          <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16, color: R.ink, marginBottom: 4 }}>Escanea la tarjeta del cliente</div>
          <div style={{ fontSize: 13, color: R.inkSoft, marginBottom: 14 }}>Apunta la cámara al código QR que el cliente muestra en su app Reva (pestaña Reva+).</div>

          {/* Viewport */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: 16, overflow: 'hidden', background: R.dusk, display: 'grid', placeItems: 'center' }}>
            {scanning && !camErr ? (
              <>
                <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.25)' }} />
                <div style={{ position: 'relative', width: '62%', aspectRatio: '1', borderRadius: 18 }}>
                  <span style={{ position: 'absolute', top: -2, left: -2, width: 28, height: 28, borderTop: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '14px 0 0 0' }} />
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 28, height: 28, borderTop: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 14px 0 0' }} />
                  <span style={{ position: 'absolute', bottom: -2, left: -2, width: 28, height: 28, borderBottom: '3px solid #fff', borderLeft: '3px solid #fff', borderRadius: '0 0 0 14px' }} />
                  <span style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderBottom: '3px solid #fff', borderRight: '3px solid #fff', borderRadius: '0 0 14px 0' }} />
                  <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#E8505B,transparent)', boxShadow: '0 0 12px #E8505B', animation: 'scanline 2s ease-in-out infinite' }} />
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.85)', padding: 24 }}>
                {camErr ? (
                  <>
                    <Icon n="camera" size={34} color="rgba(255,255,255,.7)" />
                    <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 10 }}>{camErr === 'unsupported' ? 'Cámara no disponible aquí' : 'Sin acceso a la cámara'}</div>
                    <div style={{ fontSize: 12.5, opacity: .8, marginTop: 4, maxWidth: 220, marginInline: 'auto' }}>{camErr === 'unsupported' ? 'Este navegador no soporta escaneo. Usa el folio o la lista de abajo.' : 'Permite la cámara o usa el folio manual.'}</div>
                  </>
                ) : (
                  <>
                    <Icon n="qr" size={40} color="rgba(255,255,255,.7)" />
                    <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 10 }}>Listo para escanear</div>
                  </>
                )}
              </div>
            )}
          </div>

          <button onClick={() => scanning ? setScanning(false) : startScan()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 14, padding: '13px', border: 'none', borderRadius: 13, background: scanning ? R.bgAlt : R.coral, color: scanning ? R.ink : '#fff', cursor: 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5 }}>
            <Icon n={scanning ? 'x' : 'camera'} size={18} color={scanning ? R.ink : '#fff'} /> {scanning ? 'Detener' : 'Escanear código'}
          </button>

          {/* Manual entry */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${R.lineSoft}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>O busca por folio de tarjeta</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={serial} onChange={e => setSerial(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && serial.trim()) resolve(serial.trim()) }} placeholder="Ej. RV-LUP-7F3K9" style={{ flex: 1, boxSizing: 'border-box', border: `1px solid ${R.line}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, color: R.ink, outline: 'none', fontFamily: R.ui, background: R.surface, textTransform: 'uppercase' }} />
              <button onClick={() => serial.trim() && resolve(serial.trim())} disabled={!serial.trim()} style={{ padding: '0 16px', border: 'none', borderRadius: 10, background: serial.trim() ? R.ink : R.bgAlt, color: serial.trim() ? '#fff' : R.inkFaint, cursor: serial.trim() ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 13.5 }}>Buscar</button>
            </div>
          </div>

          {/* Validar código de canje Rove Marketplace */}
          <RoveCodeValidator bizId={vert.id} onToast={setToast} />

          {/* Demo quick-pick */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Demostración · simula un escaneo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map(m => (
                <button key={m.serial} onClick={() => resolve(m.serial)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', border: `1px solid ${R.line}`, borderRadius: 11, background: result?.serial === m.serial ? R.coralTint : R.surface, cursor: 'pointer', fontFamily: R.ui, textAlign: 'left' }}>
                  <GuestAvatar name={m.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: R.ink }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: R.inkFaint }}>{m.serial} · {m.program === 'stamps' ? `${m.stamps}/${m.total} sellos` : `${m.pts} pts`}</div>
                  </div>
                  <Icon n="qr" size={16} color={R.inkFaint} />
                </button>
              ))}
            </div>
          </div>
        </BCard>

        {/* ── Customer / action panel ── */}
        <div>
          {result ? (
            <BCard style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: `linear-gradient(120deg, ${R.dusk}, ${R.duskSoft})`, color: '#fff', padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{result.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 19 }}>{result.name}</div>
                    <div style={{ fontSize: 12.5, opacity: .82 }}>{result.card} · {result.serial}</div>
                  </div>
                  <button onClick={() => setResult(null)} aria-label="Cerrar" style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.16)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n="x" size={15} color="#fff" /></button>
                </div>
              </div>

              <div style={{ padding: '20px 22px' }}>
                {result.program === 'stamps' ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: R.inkSoft }}>Sellos</span>
                      <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 20, color: R.ink }}>{result.stamps}<span style={{ fontSize: 14, color: R.inkFaint }}> / {result.total}</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                      {Array.from({ length: result.total ?? 10 }).map((_, i) => (
                        <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', background: i < (result.stamps ?? 0) ? R.jade : R.bgAlt, color: '#fff' }}>
                          {i < (result.stamps ?? 0) && <Icon n="check" size={13} color="#fff" stroke={3} />}
                          {i === (result.total ?? 10) - 1 && i >= (result.stamps ?? 0) && <Icon n="gift" size={13} color={R.inkFaint} />}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12.5, color: R.inkSoft, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon n="gift" size={14} color={R.amber} /> Recompensa: <strong style={{ color: R.ink }}>{result.reward}</strong>
                    </div>
                    <button onClick={addStamp} disabled={stampReady || busy} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 13, background: (stampReady || busy) ? R.bgAlt : R.jade, color: (stampReady || busy) ? R.inkFaint : '#fff', cursor: (stampReady || busy) ? 'not-allowed' : 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Icon n="check" size={18} color={(stampReady || busy) ? R.inkFaint : '#fff'} stroke={3} /> {busy ? 'Procesando…' : 'Sellar visita'}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, color: R.inkSoft }}>Saldo de puntos</span>
                      <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 26, color: R.ink }}>{result.pts} <span style={{ fontSize: 14, color: R.inkFaint }}>pts</span></span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: R.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Sumar puntos</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <button onClick={() => setPts(p => Math.max(1, p - 5))} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${R.line}`, background: R.surface, cursor: 'pointer', fontSize: 20, color: R.ink }}>−</button>
                      <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 22, color: R.ink, width: 48, textAlign: 'center' }}>{pts}</span>
                      <button onClick={() => setPts(p => p + 5)} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${R.line}`, background: R.surface, cursor: 'pointer', fontSize: 20, color: R.ink }}>+</button>
                      <button onClick={addPoints} disabled={busy} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 11, background: busy ? R.bgAlt : R.amber, color: busy ? R.inkFaint : '#fff', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: R.ui, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Icon n="plus" size={16} color={busy ? R.inkFaint : '#fff'} /> {busy ? '…' : `Sumar ${pts}`}</button>
                    </div>
                  </>
                )}

                {(() => { const canRedeem = (result.program === 'stamps' ? stampReady : pointsReady) && !busy; return (
                <button onClick={redeem} disabled={!canRedeem} style={{ width: '100%', marginTop: 10, padding: '12px', border: `1.5px solid ${canRedeem ? R.coral : R.line}`, borderRadius: 13, background: canRedeem ? R.coralTint : 'transparent', color: canRedeem ? R.coralPress : R.inkFaint, cursor: canRedeem ? 'pointer' : 'not-allowed', fontFamily: R.ui, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon n="gift" size={17} color={canRedeem ? R.coralPress : R.inkFaint} /> Canjear recompensa
                </button>
                ) })()}
                <div style={{ fontSize: 11.5, color: R.inkFaint, textAlign: 'center', marginTop: 10 }}>Última actividad: {result.last}</div>
              </div>
            </BCard>
          ) : (
            <BCard style={{ padding: '48px 28px', textAlign: 'center', color: R.inkSoft, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: R.bgAlt, display: 'grid', placeItems: 'center' }}><Icon n="scan" size={28} color={R.inkFaint} /></div>
              <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 16.5, color: R.ink }}>Sin cliente todavía</div>
              <div style={{ fontSize: 13, color: R.inkSoft, maxWidth: 260, lineHeight: 1.5 }}>Escanea un código Reva+, busca por folio o elige uno de la lista de demostración para sellar, sumar puntos o canjear.</div>
            </BCard>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10, background: toast.tone === 'ok' ? R.ink : R.amberDeep, color: '#fff', padding: '12px 18px', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,.25)', zIndex: 60, fontSize: 14, fontWeight: 600, maxWidth: 440 }}>
          <Icon n={toast.tone === 'ok' ? 'check' : 'info'} size={17} color="#fff" stroke={2.6} /> {toast.msg}
        </div>
      )}

      <style>{`@keyframes scanline{0%{top:6%}50%{top:90%}100%{top:6%}}`}</style>
    </div>
  )
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: R.inkSoft, padding: 40 }}>
      <Icon n="spark" size={36} color={R.inkFaint} />
      <div style={{ fontFamily: R.display, fontWeight: 700, fontSize: 18, color: R.ink }}>{title}</div>
      <div style={{ fontSize: 13.5, color: R.inkSoft }}>Próximamente en esta versión.</div>
    </div>
  )
}

// ── Shell ──────────────────────────────────────────────────
export default function BizPage() {
  const [ready, setReady] = useState(false)
  const [vertIdx, setVertIdx] = useState(0)
  const [view, setView] = useState('requests')
  const [agentOn, setAgentOn] = useState(true)
  const [switcher, setSwitcher] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  // Catálogo compartido: lo edita CatalogView y lo consume el Punto de venta
  const [catalog, setCatalog] = useState<CatItem[]>(() => VERTICALS[0].catalog.map(c => ({ ...c, active: true })))
  // Datos fiscales/de contacto del negocio para el ticket
  const [bizInfo, setBizInfo] = useState<BizInfo>(() => ({ rfc: VERTICALS[0].rfc, address: VERTICALS[0].address, phone: VERTICALS[0].phone }))
  useEffect(() => {
    const v = VERTICALS[vertIdx]
    setCatalog(v.catalog.map(c => ({ ...c, active: true })))
    setBizInfo({ rfc: v.rfc, address: v.address, phone: v.phone })
  }, [vertIdx])
  // Hidrata las existencias reales desde Supabase (si está configurado), para que
  // el panel refleje lo que la app del cliente ya vendió/descontó. Se emparejan
  // por id de servicio; en modo demo `fetchStock` devuelve null y no toca nada.
  useEffect(() => {
    let cancelled = false
    const bizId = SHARED_BIZ_ID[VERTICALS[vertIdx].id] ?? VERTICALS[vertIdx].id
    fetchStock(bizId).then(rows => {
      if (cancelled || !rows || rows.length === 0) return
      setCatalog(prev => prev.map(c => {
        const row = rows.find(r => r.id === c.id)
        return row ? { ...c, stock: row.stock ?? undefined } : c
      }))
    })
    return () => { cancelled = true }
  }, [vertIdx])
  // Manejo de IVA en el Punto de venta: agregado al total o incluido en el precio
  const [taxMode, setTaxMode] = useState<TaxMode>('added')

  if (!ready) return <BizOnboarding onDone={() => setReady(true)} />

  const vert = VERTICALS[vertIdx]
  const [mainTitle, mainSub] = VIEW_TITLES[view] ?? ['', '']
  const unreadMsgs = vert.messages.filter(m => m.unread).length

  // Notificaciones de la operación, derivadas de la actividad en vivo
  const notifs = [
    ...vert.requests
      .filter(r => r.state === 'action')
      .map(r => ({ id: `act-${r.id}`, icon: 'bolt', tint: R.coralTint, color: R.coralPress, title: 'Acción requerida', sub: `${r.who} · ${r.party} personas · ${r.when} ${r.time}`, time: r.when === 'Hoy' ? r.time : r.when, view: 'requests' })),
    ...vert.requests
      .filter(r => r.state === 'negotiating')
      .map(r => ({ id: `neg-${r.id}`, icon: 'spark', tint: R.amberTint, color: R.amberDeep, title: 'Reva negociando', sub: `${r.who} · ${r.note}`, time: r.when === 'Hoy' ? r.time : r.when, view: 'requests' })),
    ...vert.messages
      .filter(m => m.unread)
      .map(m => ({ id: `msg-${m.who}`, icon: 'chat', tint: R.jadeTint, color: '#16614c', title: `Nuevo mensaje · ${m.who}`, sub: m.last, time: m.time, view: 'messages' })),
  ]

  function openNotif(v: string) {
    setNotifOpen(false)
    setView(v)
  }

  function renderView() {
    if (view === 'requests') return <RequestsView vert={vert} onGo={setView} />
    if (view === 'agenda') return <AgendaView vert={vert} />
    if (view === 'messages') return <MessagesView key={vert.id} vert={vert} />
    if (view === 'metrics') return <MetricsView vert={vert} />
    if (view === 'reports') return <ReportsView vert={vert} items={catalog} onGo={setView} bizInfo={bizInfo} />
    if (view === 'catalog') return <CatalogView vert={vert} items={catalog} setItems={setCatalog} />
    if (view === 'inventory') return <InventoryView vert={vert} items={catalog} setItems={setCatalog} onGo={setView} />
    if (view === 'pos') return <PosView vert={vert} items={catalog} setItems={setCatalog} onGo={setView} taxMode={taxMode} bizInfo={bizInfo} />
    if (view === 'destacado') return <DestacadoView vert={vert} />
    if (view === 'promos') return <PromosView vert={vert} />
    if (view === 'scanner') return <ScannerView key={vert.id} vert={vert} />
    if (view === 'settings') return <SettingsView agentOn={agentOn} setAgentOn={setAgentOn} taxMode={taxMode} setTaxMode={setTaxMode} bizInfo={bizInfo} setBizInfo={setBizInfo} vert={vert} onGo={setView} />
    return <PlaceholderView title={VIEW_TITLES[view]?.[0] ?? view} />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: R.ui, background: R.bg, color: R.ink, position: 'relative', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <div style={{ width: 236, flexShrink: 0, background: R.surface, borderRight: `1px solid ${R.line}`, display: 'flex', flexDirection: 'column', padding: '22px 16px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 22px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: R.coral, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 17c0-4.4 3.2-8 7-8s7 3.6 7 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/><circle cx="12" cy="17" r="2.2" fill="#fff"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 17, color: R.ink, lineHeight: 1 }}>Reva</div>
            <div style={{ fontSize: 10.5, color: R.inkFaint, fontWeight: 700, letterSpacing: '.05em' }}>NEGOCIOS</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map(it => {
            const on = view === it.id
            const badge = it.id === 'requests' ? vert.requests.length : it.id === 'messages' ? unreadMsgs : 0
            return (
              <button key={it.id} onClick={() => setView(it.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', background: on ? R.coralTint : 'transparent', color: on ? R.coralPress : R.inkSoft, fontWeight: on ? 700 : 500, fontSize: 14.5, fontFamily: R.ui }}>
                <Icon n={it.icon} size={20} color={on ? R.coral : R.inkFaint} stroke={on ? 2.3 : 2} />
                <span style={{ flex: 1 }}>{it.label}</span>
                {badge > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: R.coral, borderRadius: 999, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>{badge}</span>}
              </button>
            )
          })}
        </div>

        {/* Business switcher */}
        <div style={{ marginTop: 'auto', position: 'relative' }}>
          {switcher && (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0, background: R.surface, borderRadius: 14, border: `1px solid ${R.line}`, boxShadow: '0 8px 32px rgba(34,28,25,.14)', overflow: 'hidden', zIndex: 20 }}>
              {VERTICALS.map((v, i) => (
                <button key={v.id} onClick={() => { setVertIdx(i); setSwitcher(false); setView('requests') }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', background: i === vertIdx ? R.bg : 'transparent', fontFamily: R.ui }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(140deg, ${v.grad[0]}, ${v.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', fontSize: 14, flexShrink: 0 }}>{v.mono}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: R.inkSoft }}>{v.kind}</div>
                  </div>
                  {i === vertIdx && <Icon n="check" size={15} color={R.coral} stroke={3} />}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setSwitcher(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: R.bg, borderRadius: 14, padding: 12, width: '100%', border: 'none', cursor: 'pointer', fontFamily: R.ui }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(140deg, ${vert.grad[0]}, ${vert.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: R.display, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{vert.mono}</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: R.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vert.name}</div>
              <div style={{ fontSize: 11.5, color: R.inkSoft }}>{vert.hood}</div>
            </div>
            <Icon n="chevD" size={16} color={R.inkFaint} />
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, overflow: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Sticky header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 28px', borderBottom: `1px solid ${R.line}`, background: R.surface, position: 'sticky', top: 0, zIndex: 5, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: R.display, fontWeight: 800, fontSize: 22, color: R.ink, letterSpacing: '-.02em' }}>{mainTitle}</div>
            <div style={{ fontSize: 13, color: R.inkSoft }}>{mainSub} · {vert.name}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notificaciones de la operación */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                aria-label="Notificaciones"
                style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 40, height: 40, background: notifOpen ? R.coralTint : R.bgAlt, border: 'none', borderRadius: 999, cursor: 'pointer' }}
              >
                <Icon n="bell" size={18} color={notifOpen ? R.coralPress : R.inkSoft} />
                {notifs.length > 0 && (
                  <span style={{ position: 'absolute', top: 5, right: 5, minWidth: 17, height: 17, padding: '0 4px', boxSizing: 'border-box', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700, color: '#fff', background: R.coral, border: `2px solid ${R.surface}`, borderRadius: 999 }}>{notifs.length}</span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 340, maxHeight: 420, overflowY: 'auto', background: R.surface, border: `1px solid ${R.line}`, borderRadius: 16, boxShadow: '0 18px 48px rgba(34,28,25,.16)', zIndex: 41 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: `1px solid ${R.lineSoft}`, position: 'sticky', top: 0, background: R.surface }}>
                      <span style={{ fontFamily: R.display, fontWeight: 800, fontSize: 15, color: R.ink }}>Notificaciones</span>
                      {notifs.length > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: R.coralPress, background: R.coralTint, padding: '2px 9px', borderRadius: 999 }}>{notifs.length} nuevas</span>}
                    </div>
                    {notifs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 20px', color: R.inkSoft, fontSize: 13 }}>
                        <Icon n="check" size={26} color={R.jade} />
                        <div style={{ marginTop: 8 }}>Todo al día — sin pendientes.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {notifs.map(n => (
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
            <button onClick={() => setView('settings')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: view === 'settings' ? R.coralTint : R.bgAlt, border: 'none', borderRadius: 999, padding: '9px 14px', cursor: 'pointer', fontFamily: R.ui, fontWeight: 600, fontSize: 13, color: view === 'settings' ? R.coralPress : R.inkSoft }}>
              <Icon n="settings" size={16} color={view === 'settings' ? R.coralPress : R.inkSoft} /> Ajustes
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: agentOn ? R.jadeTint : R.bgAlt, borderRadius: 999 }}>
              <span style={{ position: 'relative', display: 'inline-block', width: 9, height: 9 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: agentOn ? R.jade : R.inkFaint }} />
                {agentOn && <span style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${R.jade}`, opacity: .4, animation: 'ping 1.6s infinite' }} />}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: agentOn ? '#16614c' : R.inkSoft, whiteSpace: 'nowrap' }}>Agente {agentOn ? 'activo' : 'pausado'}</span>
              <button onClick={() => setAgentOn(a => !a)} style={{ width: 34, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', background: agentOn ? R.jade : R.inkFaint, position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 2, left: agentOn ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .18s' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, display: view === 'messages' || view === 'requests' || view === 'agenda' || view === 'pos' ? 'flex' : 'block', overflow: view === 'messages' || view === 'requests' || view === 'agenda' || view === 'pos' ? 'hidden' : 'auto' }}>
          {renderView()}
        </div>
      </div>

      <style>{`@keyframes ping{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.2);opacity:0}}`}</style>
    </div>
  )
}
