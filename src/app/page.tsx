'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SiteFooter } from '@/components/ui/SiteFooter'

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.5l1-5.8-4.3-4.1 5.9-.8z"/></svg>
)

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
)

const RevaLogo = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 46 46" aria-hidden="true">
    <rect width="46" height="46" rx="14" fill="#E8505B"/>
    <path d="M11 30c0-7.2 5.6-13 12-13s12 5.8 12 13" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"/>
    <circle cx="23" cy="30" r="3.3" fill="#fff"/>
    <path d="M23 30 L23 37.5" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"/>
  </svg>
)

const AppleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
    <path d="M16.4 12.9c0-2 1.6-2.9 1.7-3-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 6 1 8 .6 1 1.4 2 2.4 2 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-.9 2.3-1.9c.7-1 1-2 1-2.1-.1 0-2-.8-2-2.9zM14.6 6.3c.5-.7.9-1.6.8-2.5-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.4.9 0 1.8-.4 2.3-1.1z"/>
  </svg>
)

const GooglePlayIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <path d="M3.6 2.3c-.2.2-.3.5-.3.9v17.6c0 .4.1.7.3.9l.1.1L13 12.5v-.2L3.7 2.2z" fill="#34A853"/>
    <path d="M16.5 15.6 13 12.5v-.2l3.5-3.1.1.1 4.2 2.4c1.2.7 1.2 1.8 0 2.5l-4.2 2.4z" fill="#FBBC05"/>
    <path d="M16.6 15.5 13 12.4 3.6 21.8c.4.4 1 .5 1.8.1l11.2-6.4" fill="#EA4335"/>
    <path d="M16.6 9.3 5.4 2.9c-.8-.4-1.4-.4-1.8.1l9.4 9.4 3.6-3.1z" fill="#4285F4"/>
  </svg>
)

const CheckIcon = ({ color = '#fff', size = 22 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5 13l4 4 10-11" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const faqs = [
  { q: '¿Reva es gratis?', a: 'Sí. Descargar y usar Reva no cuesta nada para ti. Solo pagas lo que reservas — y muchas veces sin depósito.' },
  { q: '¿Tengo que hablar español?', a: 'No. En modo Explorer todo funciona en inglés y Reva negocia en español por ti. En modo Vecino todo está en español.' },
  { q: '¿Cómo reserva Reva por mí?', a: 'Reva se comunica con el sistema del negocio agente a agente: checa disponibilidad real, acuerda hora y detalles, y te devuelve la confirmación. Nada de listas de espera falsas.' },
  { q: '¿Qué es Reva+?', a: 'Reva+ es el programa de recompensas. Cada reserva suma puntos que canjeas por experiencias y perks de negocios locales.' },
  { q: '¿Lo destacado es publicidad disfrazada?', a: 'No. Cuando un negocio paga por aparecer, lo verás marcado claramente como "Destacado". Nunca disfrazamos lo pagado de recomendación orgánica.' },
]

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* NAV */}
      <header className="nav">
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="Reva">
            <RevaLogo />
            <span className="word">Reva</span>
          </Link>
          <nav className="nav-links">
            <Link href="/" className="active">Inicio</Link>
            <Link href="/como-funciona">Cómo funciona</Link>
            <Link href="/para-negocios">Para negocios</Link>
          </nav>
          <div className="nav-right">
            <div className="lang" role="group" aria-label="Idioma">
              <button className="on">ES</button>
              <button>EN</button>
            </div>
            <Link className="btn btn-primary" href="#descargar">Descargar</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pad" style={{ paddingTop: 64, paddingBottom: 84, overflow: 'hidden' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 40, alignItems: 'center' }}>
          <div>
            <span className="eyebrow">Concierge local de IA · Los Cabos</span>
            <h1 className="h-xl" style={{ margin: '20px 0 22px', maxWidth: '14ch' }}>
              Un amigo local muy <em className="ac">bien conectado</em>, en tu bolsillo.
            </h1>
            <p className="lede">Dile a Reva qué se te antoja y ella lo resuelve — encuentra el lugar, negocia con el negocio y deja la reserva lista. Sin llamadas, sin filas, sin hablar español si no quieres.</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 30 }} id="descargar">
              <a className="store" href="#">
                <AppleIcon />
                <span><span className="sub">Descarga en el</span><span className="big">App Store</span></span>
              </a>
              <a className="store" href="#">
                <GooglePlayIcon />
                <span><span className="sub">Consíguelo en</span><span className="big">Google Play</span></span>
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 26, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ display: 'flex', color: 'var(--amber)' }}>
                  {[0,1,2,3,4].map(i => <StarIcon key={i} />)}
                </span>
                <b style={{ fontSize: 15 }}>4.9</b>
              </div>
              <span className="muted" style={{ fontSize: 14.5 }}>Curado por locales de Los Cabos</span>
            </div>
          </div>

          {/* hero device */}
          <div style={{ position: 'relative', justifySelf: 'center', display: 'flex', justifyContent: 'center' }}>
            <div className="device float lg">
              <Image src="/img/app-discover.png" alt="Reva app — Discover" width={330} height={714} priority />
            </div>
            {/* chip: negotiating */}
            <div className="card" style={{ position: 'absolute', left: -26, top: 60, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11, boxShadow: 'var(--shadow)' }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--coral)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                <svg width="15" height="15" viewBox="0 0 24 24"><path d="M4 18c0-5 4-9 8-9s8 4 8 9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></svg>
              </span>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>Reva negociando</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Mesa para 2 · 20:30</div>
              </div>
            </div>
            {/* chip: confirmed */}
            <div className="card" style={{ position: 'absolute', right: -22, bottom: 74, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11, boxShadow: 'var(--shadow)' }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--jade)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                <CheckIcon />
              </span>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>Confirmado</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Te esperan a las 20:30</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO / TRUST STRIP */}
      <section style={{ padding: '6px 0 50px' }}>
        <div className="wrap">
          <p className="center muted" style={{ fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 22 }}>
            Reserva en los lugares favoritos de los locales
          </p>
          <div className="logos">
            <span className="lg">La Lupita</span>
            <span className="lg">Huerta del Mar</span>
            <span className="lg">Sereno Spa</span>
            <span className="lg">Cabo Azul</span>
            <span className="lg">Comal Costero</span>
            <span className="lg">Mirador</span>
          </div>
        </div>
      </section>

      {/* TWO PATHS */}
      <section className="pad-sm">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow no-rule" style={{ justifyContent: 'center' }}>Una app, dos formas de vivirla</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>¿Cómo quieres que aparezca Reva?</h2>
          </div>
          <div className="paths">
            <Link className="path visit" href="#descargar">
              <span className="tag">Modo Explorer · Visitas</span>
              <h3 className="display">Vive Los Cabos como local</h3>
              <p>Recomendaciones curadas, en inglés, sin clichés de playa. Reva reserva por ti aunque no hables español.</p>
              <span className="go">Descargar la app <ArrowIcon /></span>
            </Link>
            <Link className="path local" href="#descargar">
              <span className="tag">Modo Vecino · Locales</span>
              <h3 className="display">Resuélvelo en dos toques</h3>
              <p>Rápido y al grano, en español. &ldquo;Resérvame lo de siempre&rdquo;, boletos Reva+ y tus lugares de cabecera, siempre a la mano.</p>
              <span className="go">Descargar la app <ArrowIcon /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="pad">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Cómo funciona</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>De un antojo a una reserva confirmada.</h2>
            <p className="lede">Tú hablas en lenguaje normal. Reva hace el trabajo pesado por detrás.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num"><span>Paso 01</span></div>
              <h3 className="display">Dile qué se te antoja</h3>
              <p>&ldquo;Tacos donde van los locales&rdquo;, &ldquo;masaje en pareja mañana&rdquo;, &ldquo;algo para la noche&rdquo;. Escribe o habla, en inglés o español.</p>
            </div>
            <div className="step">
              <div className="num"><span>Paso 02</span></div>
              <h3 className="display">Reva negocia por ti</h3>
              <p>Contacta al negocio agente a agente, checa disponibilidad y acuerda la hora, la mesa y los extras — en vivo.</p>
            </div>
            <div className="step">
              <div className="num"><span>Paso 03</span></div>
              <h3 className="display">Listo, sin que muevas un dedo</h3>
              <p>Recibes la confirmación con todos los detalles. Pago seguro y cancelación clara, siempre a la vista.</p>
            </div>
          </div>
          <div style={{ marginTop: 40 }}>
            <Link className="btn btn-ghost btn-lg" href="/como-funciona">
              Ver el momento mágico <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* MAGIC MOMENT */}
      <section className="pad dusk-band">
        <div className="wrap">
          <div className="sec-head" style={{ maxWidth: 720 }}>
            <span className="eyebrow no-rule" style={{ color: '#F4B5A0' }}>El momento mágico</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>Reva habla con el negocio. Tú solo ves &ldquo;listo&rdquo;.</h2>
            <p className="lede">Hacemos visible la negociación agente a agente, para que la espera nunca se sienta muerta.</p>
          </div>
          <div className="states">
            <div className="state consult">
              <span className="lab">Paso 1 · consultando</span>
              <div>
                <div className="msg">Reva está hablando con La Lupita…</div>
                <div className="sub">Checando terraza para 2, hoy</div>
              </div>
              <div className="pulse"><i></i><i></i><i></i></div>
            </div>
            <div className="state live">
              <span className="lab">Paso 2 · en vivo</span>
              <div>
                <div className="msg">Confirmando mesa para 2 a las 20:30</div>
                <div className="sub">Mesa tranquila en la terraza ✓</div>
              </div>
              <div className="pulse"><i></i><i></i><i></i></div>
            </div>
            <div className="state done">
              <span className="lab">Paso 3 · éxito</span>
              <div>
                <div className="msg">¡Reservado! Te esperan a las 20:30</div>
                <div className="sub">Cancelación gratis hasta 2 h antes</div>
              </div>
              <div className="check"><CheckIcon /></div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO MODES */}
      <section className="pad">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow no-rule" style={{ justifyContent: 'center' }}>Dos modos, un solo Reva</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>El mismo motor. Tu idioma, tu ritmo.</h2>
          </div>
          <div className="grid g2" style={{ alignItems: 'center', gap: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="device" style={{ width: 270 }}>
                <Image src="/img/app-modes.png" alt="Reva — elegir modo" width={270} height={584} />
              </div>
              <div className="mode-badge explorer" style={{ marginTop: 26 }}><span className="ic">✦</span> Modo Explorer</div>
              <h3 className="h-sm" style={{ margin: '16px 0 8px' }}>Para quien está de visita</h3>
              <p className="muted" style={{ fontSize: 15.5, maxWidth: '38ch' }}>Inglés, curaduría y confianza: reseñas de locales, cancelación clara y pago seguro, siempre a la vista.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="device" style={{ width: 270 }}>
                <Image src="/img/app-vecino.png" alt="Reva — Modo Vecino" width={270} height={584} />
              </div>
              <div className="mode-badge vecino" style={{ marginTop: 26 }}><span className="ic">⌂</span> Modo Vecino</div>
              <h3 className="h-sm" style={{ margin: '16px 0 8px' }}>Para quien ya es de aquí</h3>
              <p className="muted" style={{ fontSize: 15.5, maxWidth: '38ch' }}>Español, velocidad y lo de siempre: tus lugares de cabecera, boletos Reva+ y &ldquo;resérvame lo de siempre&rdquo;.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROVE */}
      <section className="pad-sm">
        <div className="wrap">
          <div style={{ background: 'radial-gradient(120% 130% at 90% 0%,rgba(231,163,60,.22),transparent 55%),var(--amber-tint)', border: '1px solid rgba(231,163,60,.28)', borderRadius: 'var(--radius-lg)', padding: 54, display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 40, alignItems: 'center', overflow: 'hidden' }}>
            <div>
              <span className="eyebrow amber no-rule">Reva+ · recompensas locales</span>
              <h2 className="h-md" style={{ margin: '14px 0' }}>Cada reserva suma. Canjéala por lo bueno.</h2>
              <p className="kicker" style={{ maxWidth: '48ch' }}>Reva+ convierte tus salidas en boletos: cenas, mezcal, sunsets y experiencias que solo conocen los de aquí. Más usas Reva, mejor te trata Los Cabos.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
                <span className="pill local">🎟 Boletos canjeables</span>
                <span className="pill local">★ Perks de locales</span>
                <span className="pill local">∞ Sin caducidad sorpresa</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 300, borderRadius: 22, background: 'var(--surface)', boxShadow: 'var(--shadow)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                <div style={{ background: 'linear-gradient(100deg,#E8505B,#E7A33C)', padding: '20px 22px', color: '#fff' }}>
                  <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .85, fontWeight: 700 }}>Reva+</div>
                  <div className="display" style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-.03em', marginTop: 6 }}>2,450 <span style={{ fontSize: 16, fontWeight: 600, opacity: .9 }}>puntos</span></div>
                </div>
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>Mezcal flight · La Lupita</div>
                      <div className="muted" style={{ fontSize: 13 }}>Cata de 5 mezcales</div>
                    </div>
                    <span style={{ background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '6px 12px', borderRadius: 999 }}>800</span>
                  </div>
                  <div style={{ height: 1, background: 'var(--line)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>Sunset Sail · Cabo Azul</div>
                      <div className="muted" style={{ fontSize: 13 }}>Champaña a bordo</div>
                    </div>
                    <span style={{ background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '6px 12px', borderRadius: 999 }}>1,600</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="pad">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow no-rule" style={{ justifyContent: 'center' }}>Lo que dicen</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>Turistas y locales, de acuerdo en algo.</h2>
          </div>
          <div className="grid g3">
            <div className="card quote">
              <div className="stars">{[0,1,2,3,4].map(i => <StarIcon key={i} />)}</div>
              <p>&ldquo;Llegué sin plan y sin hablar español. Le pedí &lsquo;cena romántica esta noche&rsquo; y a los dos minutos tenía mesa en un lugar que jamás habría encontrado.&rdquo;</p>
              <div className="who"><span className="av" style={{ background: '#E27A52' }}>J</span><div><div className="nm">Jordan A.</div><div className="mt">Explorer · San Diego</div></div></div>
            </div>
            <div className="card quote">
              <div className="stars">{[0,1,2,3,4].map(i => <StarIcon key={i} />)}</div>
              <p>&ldquo;Como local, lo uso para lo de siempre: &lsquo;resérvame los tacos del jueves&rsquo;. Dos toques y ya. Y los boletos Reva+ son un golazo.&rdquo;</p>
              <div className="who"><span className="av" style={{ background: '#1F8A6D' }}>D</span><div><div className="nm">Daniela R.</div><div className="mt">Vecino · San José del Cabo</div></div></div>
            </div>
            <div className="card quote">
              <div className="stars">{[0,1,2,3,4].map(i => <StarIcon key={i} />)}</div>
              <p>&ldquo;Le dije &lsquo;masaje en pareja con vista al mar&rsquo; y negoció hasta la cabaña. Sentí que tenía un concierge de hotel cinco estrellas en el bolsillo.&rdquo;</p>
              <div className="who"><span className="av" style={{ background: '#8B6CB0' }}>E</span><div><div className="nm">Emily W.</div><div className="mt">Explorer · Seattle</div></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR BUSINESS */}
      <section className="pad dusk-band">
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <span className="eyebrow no-rule" style={{ color: '#F4B5A0' }}>Para negocios</span>
            <h2 className="h-lg" style={{ margin: '14px 0 16px' }}>¿Tienes un negocio local?</h2>
            <p className="lede">Reva te trae clientes que ya quieren reservar — turistas y locales — y negocia con tu agente, no con tu recepción. Tú solo apruebas y llenas.</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 28 }}>
              <Link className="btn btn-primary btn-lg" href="/para-negocios">Más información</Link>
            </div>
          </div>
          <div>
            <div className="window">
              <Image src="/img/biz-requests.png" alt="Reva Negocios — panel de solicitudes" width={600} height={400} />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pad">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow no-rule" style={{ justifyContent: 'center' }}>Preguntas frecuentes</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>Lo que todos preguntan</h2>
          </div>
          <div className="faq">
            {faqs.map((faq, i) => (
              <div key={i} className={`qa${openFaq === i ? ' open' : ''}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="q">{faq.q}</span>
                  <span className="pm"></span>
                </button>
                <div className="a"><p>{faq.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="pad-sm">
        <div className="wrap">
          <div style={{ background: 'radial-gradient(120% 140% at 85% -20%,rgba(232,80,91,.18),transparent 50%),radial-gradient(120% 140% at 5% 120%,rgba(231,163,60,.16),transparent 50%),var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 64, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <h2 className="h-lg" style={{ maxWidth: '18ch', margin: '0 auto 16px' }}>Tu próxima salida empieza con una frase.</h2>
            <p className="lede" style={{ margin: '0 auto 30px' }}>Descarga Reva y deja que Los Cabos te trate como local.</p>
            <div className="stores" style={{ justifyContent: 'center' }}>
              <a className="store" href="#">
                <AppleIcon />
                <span><span className="sub">Descarga en el</span><span className="big">App Store</span></span>
              </a>
              <a className="store" href="#">
                <GooglePlayIcon />
                <span><span className="sub">Consíguelo en</span><span className="big">Google Play</span></span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <SiteFooter />
    </>
  )
}
