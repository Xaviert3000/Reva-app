'use client'
import Link from 'next/link'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { RevaMark } from '@/components/ui/RevaMark'
import { Btn } from '@/components/ui/Btn'

const PLAN = {
  name: 'Reva',
  price: '$300',
  period: '/mes',
  trial: '15 días gratis',
  commission: '+ 2% por procesamiento de pagos',
  features: ['Agente de IA', 'Agenda en tiempo real', 'Panel del negocio', 'Mensajes vía Reva', 'Reportes completos', 'Soporte prioritario'],
  cta: 'Empezar gratis',
}

const TYPES = [
  { icon: '🍽️', label: 'Restaurantes' },
  { icon: '🍸', label: 'Bares' },
  { icon: '💆', label: 'Spas' },
  { icon: '🏥', label: 'Clínicas' },
  { icon: '✂️', label: 'Salones' },
  { icon: '🚣', label: 'Tours' },
  { icon: '⚖️', label: 'Despachos' },
  { icon: '🏠', label: 'Inmobiliarias' },
]

export default function ParaNegociosPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <RevaMark size={34} />
            <span className="font-extrabold text-[18px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>Reva</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-[14px] font-semibold text-ink-soft hover:text-ink">Inicio</Link>
            <Link href="/como-funciona" className="text-[14px] font-semibold text-ink-soft hover:text-ink">Cómo funciona</Link>
            <Link href="/para-negocios" className="text-[14px] font-semibold text-coral">Para negocios</Link>
          </nav>
          <Link href="/biz/login"><Btn size="sm">Ingresa →</Btn></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-14 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-[12px] font-bold tracking-widest uppercase text-jade mb-4 block">Para negocios</span>
          <h1 className="font-extrabold text-[52px] leading-[1.02] tracking-[-0.03em] text-ink mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            Tu agente de IA recibe reservas{' '}
            <em className="not-italic text-jade">mientras duermes.</em>
          </h1>
          <p className="text-[17px] text-ink-soft leading-relaxed mb-8">
            Cada negocio en Reva tiene su propio agente que negocia con los clientes en tiempo real — sin que tengas que contestar el teléfono ni el WhatsApp.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/biz/register"><Btn size="lg">Registrar mi negocio</Btn></Link>
          </div>
        </div>

        {/* Live panel mockup */}
        <div className="bg-surface border border-line rounded-[24px] shadow-[0_8px_40px_rgba(34,28,25,.10)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-bg-alt">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-coral/60 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber/60 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-jade/60 inline-block" />
            </div>
            <span className="text-[12px] text-ink-faint font-semibold">Solicitudes en vivo</span>
            <span className="text-[11px] bg-jade/15 text-jade font-bold px-2.5 py-1 rounded-full">● Agente activo</span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
            {[
              { label: 'Reservas hoy', value: '18' },
              { label: 'Ingresos atribuidos', value: '$14.2k' },
              { label: 'Vía Reva', value: '64%' },
            ].map(s => (
              <div key={s.label} className="px-5 py-4">
                <div className="font-extrabold text-[22px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div className="text-[11.5px] text-ink-faint mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Requests */}
          <div className="divide-y divide-line">
            {[
              { name: 'Jordan A.', detail: 'Hoy · 20:00 · 2 personas · Mesa tranquila', tag: 'Reva negociando', tagColor: 'bg-amber/15 text-amber-700' },
              { name: 'Daniela R.', detail: 'Hoy · 21:00 · 4 personas · Lo de siempre 🌮', tag: 'Auto-confirmable', tagColor: 'bg-jade/15 text-jade' },
              { name: 'Marcus T.', detail: 'Vie 12 · 19:00 · 6 personas · Cumpleaños', tag: 'Acción requerida', tagColor: 'bg-coral/15 text-coral' },
            ].map(r => (
              <div key={r.name} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center flex-none">
                  <span className="text-[13px] font-bold text-ink-soft">{r.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13.5px] text-ink">{r.name}</div>
                  <div className="text-[12px] text-ink-faint truncate">{r.detail}</div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${r.tagColor}`}>{r.tag}</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-line bg-bg-alt text-center">
            <span className="text-[12px] text-ink-faint">3 entrantes · última actualización hace 12 s</span>
          </div>
        </div>
      </section>

      {/* Business types */}
      <section className="bg-surface border-y border-line py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[12.5px] font-bold text-ink-faint uppercase tracking-wide mb-6 text-center">Funciona para cualquier giro</p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {TYPES.map(t => (
              <div key={t.label} className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-[18px] bg-bg-alt grid place-items-center text-2xl">{t.icon}</div>
                <span className="text-[11.5px] font-semibold text-ink-soft">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-extrabold text-[36px] text-ink tracking-tight mb-10 text-center" style={{ fontFamily: 'var(--font-display)' }}>Qué incluye Reva para tu negocio</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'Agente de IA tuyo', desc: 'Responde, negocia y confirma reservas las 24 horas. Tú lo configuras en 5 minutos.' },
              { icon: '📅', title: 'Agenda en tiempo real', desc: 'Ve todas tus reservas en un panel limpio. Vista de día y semana, detalle de cada cliente.' },
              { icon: '💬', title: 'Mensajes centralizados', desc: 'Todos los chats con clientes en un solo lugar. Responde desde el panel sin saltar a WhatsApp.' },
              { icon: '📊', title: 'Métricas reales', desc: 'Reservas, ingresos atribuidos, % via Reva, satisfacción. Datos que sí importan.' },
              { icon: '⭐', title: 'Destacados', desc: 'Compra visibilidad cuando quieras — al tope de búsquedas, en Discovery, sin disimulo.' },
              { icon: '🎟️', title: 'Integración Reva+', desc: 'Tus clientes acumulan boletos al reservar contigo. Los fidelizas sin hacer nada extra.' },
            ].map(p => (
              <div key={p.title} className="bg-surface border border-line rounded-[20px] p-5">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-[17px] text-ink mb-2" style={{ fontFamily: 'var(--font-display)' }}>{p.title}</h3>
                <p className="text-[13.5px] text-ink-soft leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="bg-surface border-y border-line py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-extrabold text-[36px] text-ink tracking-tight mb-2 text-center" style={{ fontFamily: 'var(--font-display)' }}>Un solo plan</h2>
          <p className="text-center text-[15px] text-ink-soft mb-10">Empieza gratis 15 días. Solo pagas cuando funciona.</p>
          <div className="max-w-md mx-auto">
            <div className="rounded-[22px] p-8 border bg-dusk text-white border-transparent shadow-[0_20px_50px_rgba(27,36,54,.3)]">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[12px] font-bold tracking-widest uppercase text-white/60">{PLAN.name}</p>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-jade/20 text-jade">{PLAN.trial}</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-extrabold text-[44px] leading-none" style={{ fontFamily: 'var(--font-display)' }}>{PLAN.price}</span>
                <span className="text-[15px] pb-1.5 text-white/70">{PLAN.period}</span>
              </div>
              <p className="text-[12.5px] mb-6 text-white/60">{PLAN.commission}</p>
              <ul className="flex flex-col gap-2.5 mb-7">
                {PLAN.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 shrink-0 text-jade" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4 10-11" /></svg>
                    <span className="text-[13.5px] text-white/85">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/biz/register">
                <button className="w-full py-3 rounded-full font-semibold text-[14px] transition-colors bg-coral text-white hover:bg-[#D23B47]">
                  {PLAN.cta}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      <SiteFooter />
    </div>
  )
}
