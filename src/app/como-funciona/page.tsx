import Link from 'next/link'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { RevaMark } from '@/components/ui/RevaMark'
import { Btn } from '@/components/ui/Btn'

const STEPS = [
  {
    n: '01',
    title: 'Le hablas a Reva',
    body: 'Di lo que quieres en tus palabras — no hay formularios, no hay filtros. "Mesa para 2 esta noche, algo tranquilo" es suficiente. Reva entiende contexto, estado de ánimo e intención.',
    chips: ['"Resérvame lo de siempre"', '"Planes para el atardecer"', '"Necesito cita con el dentista"'],
  },
  {
    n: '02',
    title: 'Reva busca y propone',
    body: 'En segundos Reva consulta los negocios disponibles con agente activo. Te muestra opciones curadas con foto, rating de locales, distancia y precio aproximado — sin publicidad disfrazada.',
    chips: ['★ 4.8 · Favorito local', '📍 2.4 km', '$$ · Precio justo'],
  },
  {
    n: '03',
    title: 'El agente negocia en vivo',
    body: 'Aquí está la magia: el agente de Reva conecta en tiempo real con el agente del negocio. Consigue tu lugar, horario y condiciones — sin que nadie tenga que contestar el teléfono.',
    chips: ['Reva consultando…', '→ Agente de La Lupita', '← Terraza disponible ✓'],
  },
  {
    n: '04',
    title: 'Confirmación instantánea',
    body: 'Recibes confirmación en el chat en segundos. Si aplica depósito, lo pagas ahí mismo con tarjeta o SPEI. Sin llamadas, sin WhatsApp, sin esperar.',
    chips: ['🎉 ¡Reservado!', 'Mesa para 2 · 20:30', 'Terraza · Aniversario'],
  },
  {
    n: '05',
    title: 'Ganas boletos Reva+',
    body: 'Cada reserva completada suma boletos al sorteo semanal. Precios reales — vuelos, cenas, experiencias. Cuanto más usas Reva, más chances tienes.',
    chips: ['+2 boletos ganados', '🎟️ 7 boletos esta semana', '🎁 Sorteo dominical'],
  },
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <RevaMark size={34} />
            <span className="font-extrabold text-[18px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>Reva</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-[14px] font-semibold text-ink-soft hover:text-ink">Inicio</Link>
            <Link href="/como-funciona" className="text-[14px] font-semibold text-coral">Cómo funciona</Link>
            <Link href="/para-negocios" className="text-[14px] font-semibold text-ink-soft hover:text-ink">Para negocios</Link>
          </nav>
          <Link href="/app"><Btn size="sm">Probar Reva</Btn></Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-8 text-center">
        <span className="text-[12px] font-bold tracking-widest uppercase text-coral mb-4 block">Cómo funciona</span>
        <h1 className="font-extrabold text-[48px] leading-[1.04] tracking-[-0.03em] text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Del deseo a la reserva<br />en segundos
        </h1>
        <p className="text-[16px] text-ink-soft leading-relaxed max-w-[40ch] mx-auto">
          Reva no es un directorio con chat encima. Es una conversación que termina en una transacción resuelta.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="flex flex-col gap-6">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full grid place-items-center shrink-0 font-extrabold text-[13px]"
                  style={{ background: '#E8505B', color: '#fff', fontFamily: 'var(--font-display)' }}>
                  {step.n}
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 w-px bg-line mt-2" />}
              </div>
              <div className="flex-1 pb-8">
                <h2 className="font-extrabold text-[22px] text-ink mb-2 mt-1.5" style={{ fontFamily: 'var(--font-display)' }}>{step.title}</h2>
                <p className="text-[14.5px] text-ink-soft leading-relaxed mb-4">{step.body}</p>
                <div className="flex flex-wrap gap-2">
                  {step.chips.map(c => (
                    <span key={c} className="text-[12.5px] font-semibold bg-surface border border-line text-ink px-3.5 py-1.5 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink text-white py-14 px-6 text-center">
        <h2 className="font-extrabold text-[32px] tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>¿Lista para probarlo?</h2>
        <p className="text-[15px] opacity-70 mb-6">Gratis para usuarios. Sin descargas por ahora — prueba la versión web.</p>
        <Link href="/app"><Btn size="lg">Abrir Reva →</Btn></Link>
      </section>

      <SiteFooter />
    </div>
  )
}
