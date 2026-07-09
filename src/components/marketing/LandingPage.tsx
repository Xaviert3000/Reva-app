'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { getLandingDict, route, type Lang } from '@/i18n/landing'

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

export default function LandingPage({ lang }: { lang: Lang }) {
  const t = getLandingDict(lang)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Home route depends on the active language; the other marketing pages stay in Spanish for now.
  const homeHref = lang === 'en' ? '/en' : '/'

  return (
    <>
      {/* NAV */}
      <header className="nav">
        <div className="nav-in">
          <Link className="brand" href={homeHref} aria-label="Reva">
            <RevaLogo />
            <span className="word">Reva</span>
          </Link>
          <nav className="nav-links">
            <Link href={homeHref} className="active">{t.nav.home}</Link>
            <Link href={route('howItWorks', lang)}>{t.nav.howItWorks}</Link>
            <Link href={route('forBusiness', lang)}>{t.nav.forBusiness}</Link>
          </nav>
          <div className="nav-right">
            <div className="lang" role="group" aria-label="Idioma">
              <Link href="/" className={lang === 'es' ? 'on' : undefined} aria-current={lang === 'es' ? 'true' : undefined}>ES</Link>
              <Link href="/en" className={lang === 'en' ? 'on' : undefined} aria-current={lang === 'en' ? 'true' : undefined}>EN</Link>
            </div>
            <Link className="btn btn-primary" href="#descargar">{t.nav.download}</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pad" style={{ paddingTop: 64, paddingBottom: 84, overflow: 'hidden' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 40, alignItems: 'center' }}>
          <div>
            <span className="eyebrow">{t.hero.eyebrow}</span>
            <h1 className="h-xl" style={{ margin: '20px 0 22px', maxWidth: '14ch' }}>
              {t.hero.titleBefore}<em className="ac">{t.hero.titleAccent}</em>{t.hero.titleAfter}
            </h1>
            <p className="lede">{t.hero.lede}</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 30 }} id="descargar">
              <a className="store" href="#">
                <AppleIcon />
                <span><span className="sub">{t.hero.storeSubApple}</span><span className="big">{t.hero.storeBigApple}</span></span>
              </a>
              <a className="store" href="#">
                <GooglePlayIcon />
                <span><span className="sub">{t.hero.storeSubGoogle}</span><span className="big">{t.hero.storeBigGoogle}</span></span>
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 26, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ display: 'flex', color: 'var(--amber)' }}>
                  {[0,1,2,3,4].map(i => <StarIcon key={i} />)}
                </span>
                <b style={{ fontSize: 15 }}>4.9</b>
              </div>
              <span className="muted" style={{ fontSize: 14.5 }}>{t.hero.ratingNote}</span>
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
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>{t.hero.chipNegotiatingLabel}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.hero.chipNegotiatingValue}</div>
              </div>
            </div>
            {/* chip: confirmed */}
            <div className="card" style={{ position: 'absolute', right: -22, bottom: 74, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11, boxShadow: 'var(--shadow)' }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--jade)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                <CheckIcon />
              </span>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>{t.hero.chipConfirmedLabel}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.hero.chipConfirmedValue}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO / TRUST STRIP */}
      <section style={{ padding: '6px 0 50px' }}>
        <div className="wrap">
          <p className="center muted" style={{ fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 22 }}>
            {t.trust.label}
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
            <span className="eyebrow no-rule" style={{ justifyContent: 'center' }}>{t.paths.eyebrow}</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>{t.paths.title}</h2>
          </div>
          <div className="paths">
            <Link className="path visit" href="#descargar">
              <span className="tag">{t.paths.explorerTag}</span>
              <h3 className="display">{t.paths.explorerTitle}</h3>
              <p>{t.paths.explorerBody}</p>
              <span className="go">{t.paths.cta} <ArrowIcon /></span>
            </Link>
            <Link className="path local" href="#descargar">
              <span className="tag">{t.paths.localTag}</span>
              <h3 className="display">{t.paths.localTitle}</h3>
              <p>{t.paths.localBody}</p>
              <span className="go">{t.paths.cta} <ArrowIcon /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="pad">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">{t.how.eyebrow}</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>{t.how.title}</h2>
            <p className="lede">{t.how.lede}</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num"><span>{t.how.step1Label}</span></div>
              <h3 className="display">{t.how.step1Title}</h3>
              <p>{t.how.step1Body}</p>
            </div>
            <div className="step">
              <div className="num"><span>{t.how.step2Label}</span></div>
              <h3 className="display">{t.how.step2Title}</h3>
              <p>{t.how.step2Body}</p>
            </div>
            <div className="step">
              <div className="num"><span>{t.how.step3Label}</span></div>
              <h3 className="display">{t.how.step3Title}</h3>
              <p>{t.how.step3Body}</p>
            </div>
          </div>
          <div style={{ marginTop: 40 }}>
            <Link className="btn btn-ghost btn-lg" href={route('howItWorks', lang)}>
              {t.how.cta} <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* MAGIC MOMENT */}
      <section className="pad dusk-band">
        <div className="wrap">
          <div className="sec-head" style={{ maxWidth: 720 }}>
            <span className="eyebrow no-rule" style={{ color: '#F4B5A0' }}>{t.magic.eyebrow}</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>{t.magic.title}</h2>
            <p className="lede">{t.magic.lede}</p>
          </div>
          <div className="states">
            <div className="state consult">
              <span className="lab">{t.magic.s1Label}</span>
              <div>
                <div className="msg">{t.magic.s1Msg}</div>
                <div className="sub">{t.magic.s1Sub}</div>
              </div>
              <div className="pulse"><i></i><i></i><i></i></div>
            </div>
            <div className="state live">
              <span className="lab">{t.magic.s2Label}</span>
              <div>
                <div className="msg">{t.magic.s2Msg}</div>
                <div className="sub">{t.magic.s2Sub}</div>
              </div>
              <div className="pulse"><i></i><i></i><i></i></div>
            </div>
            <div className="state done">
              <span className="lab">{t.magic.s3Label}</span>
              <div>
                <div className="msg">{t.magic.s3Msg}</div>
                <div className="sub">{t.magic.s3Sub}</div>
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
            <span className="eyebrow no-rule" style={{ justifyContent: 'center' }}>{t.modes.eyebrow}</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>{t.modes.title}</h2>
          </div>
          <div className="grid g2" style={{ alignItems: 'center', gap: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="device" style={{ width: 270 }}>
                <Image src="/img/app-modes.png" alt="Reva — Explorer Mode" width={270} height={584} />
              </div>
              <div className="mode-badge explorer" style={{ marginTop: 26 }}><span className="ic">✦</span> {t.modes.explorerBadge}</div>
              <h3 className="h-sm" style={{ margin: '16px 0 8px' }}>{t.modes.explorerTitle}</h3>
              <p className="muted" style={{ fontSize: 15.5, maxWidth: '38ch' }}>{t.modes.explorerBody}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="device" style={{ width: 270 }}>
                <Image src="/img/app-vecino.png" alt="Reva — Neighbor Mode" width={270} height={584} />
              </div>
              <div className="mode-badge vecino" style={{ marginTop: 26 }}><span className="ic">⌂</span> {t.modes.vecinoBadge}</div>
              <h3 className="h-sm" style={{ margin: '16px 0 8px' }}>{t.modes.vecinoTitle}</h3>
              <p className="muted" style={{ fontSize: 15.5, maxWidth: '38ch' }}>{t.modes.vecinoBody}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROVE */}
      <section className="pad-sm">
        <div className="wrap">
          <div style={{ background: 'radial-gradient(120% 130% at 90% 0%,rgba(231,163,60,.22),transparent 55%),var(--amber-tint)', border: '1px solid rgba(231,163,60,.28)', borderRadius: 'var(--radius-lg)', padding: 54, display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 40, alignItems: 'center', overflow: 'hidden' }}>
            <div>
              <span className="eyebrow amber no-rule">{t.rove.eyebrow}</span>
              <h2 className="h-md" style={{ margin: '14px 0' }}>{t.rove.title}</h2>
              <p className="kicker" style={{ maxWidth: '48ch' }}>{t.rove.body}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
                <span className="pill local">{t.rove.pill1}</span>
                <span className="pill local">{t.rove.pill2}</span>
                <span className="pill local">{t.rove.pill3}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 300, borderRadius: 22, background: 'var(--surface)', boxShadow: 'var(--shadow)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                <div style={{ background: 'linear-gradient(100deg,#E8505B,#E7A33C)', padding: '20px 22px', color: '#fff' }}>
                  <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .85, fontWeight: 700 }}>Reva+</div>
                  <div className="display" style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-.03em', marginTop: 6 }}>2,450 <span style={{ fontSize: 16, fontWeight: 600, opacity: .9 }}>{t.rove.points}</span></div>
                </div>
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.rove.reward1Title}</div>
                      <div className="muted" style={{ fontSize: 13 }}>{t.rove.reward1Sub}</div>
                    </div>
                    <span style={{ background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '6px 12px', borderRadius: 999 }}>800</span>
                  </div>
                  <div style={{ height: 1, background: 'var(--line)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.rove.reward2Title}</div>
                      <div className="muted" style={{ fontSize: 13 }}>{t.rove.reward2Sub}</div>
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
            <span className="eyebrow no-rule" style={{ justifyContent: 'center' }}>{t.testimonials.eyebrow}</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>{t.testimonials.title}</h2>
          </div>
          <div className="grid g3">
            <div className="card quote">
              <div className="stars">{[0,1,2,3,4].map(i => <StarIcon key={i} />)}</div>
              <p>{t.testimonials.q1}</p>
              <div className="who"><span className="av" style={{ background: '#E27A52' }}>J</span><div><div className="nm">Jordan A.</div><div className="mt">{t.testimonials.q1Role}</div></div></div>
            </div>
            <div className="card quote">
              <div className="stars">{[0,1,2,3,4].map(i => <StarIcon key={i} />)}</div>
              <p>{t.testimonials.q2}</p>
              <div className="who"><span className="av" style={{ background: '#1F8A6D' }}>D</span><div><div className="nm">Daniela R.</div><div className="mt">{t.testimonials.q2Role}</div></div></div>
            </div>
            <div className="card quote">
              <div className="stars">{[0,1,2,3,4].map(i => <StarIcon key={i} />)}</div>
              <p>{t.testimonials.q3}</p>
              <div className="who"><span className="av" style={{ background: '#8B6CB0' }}>E</span><div><div className="nm">Emily W.</div><div className="mt">{t.testimonials.q3Role}</div></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR BUSINESS */}
      <section className="pad dusk-band">
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <span className="eyebrow no-rule" style={{ color: '#F4B5A0' }}>{t.business.eyebrow}</span>
            <h2 className="h-lg" style={{ margin: '14px 0 16px' }}>{t.business.title}</h2>
            <p className="lede">{t.business.lede}</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 28 }}>
              <Link className="btn btn-primary btn-lg" href={route('forBusiness', lang)}>{t.business.cta}</Link>
            </div>
          </div>
          <div>
            <div className="window">
              <Image src="/img/biz-requests.png" alt="Reva Business — requests panel" width={600} height={400} />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pad">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow no-rule" style={{ justifyContent: 'center' }}>{t.faq.eyebrow}</span>
            <h2 className="h-lg" style={{ marginTop: 14 }}>{t.faq.title}</h2>
          </div>
          <div className="faq">
            {t.faq.items.map((faq, i) => (
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
            <h2 className="h-lg" style={{ maxWidth: '18ch', margin: '0 auto 16px' }}>{t.finalCta.title}</h2>
            <p className="lede" style={{ margin: '0 auto 30px' }}>{t.finalCta.lede}</p>
            <div className="stores" style={{ justifyContent: 'center' }}>
              <a className="store" href="#">
                <AppleIcon />
                <span><span className="sub">{t.hero.storeSubApple}</span><span className="big">{t.hero.storeBigApple}</span></span>
              </a>
              <a className="store" href="#">
                <GooglePlayIcon />
                <span><span className="sub">{t.hero.storeSubGoogle}</span><span className="big">{t.hero.storeBigGoogle}</span></span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <SiteFooter lang={lang} />
    </>
  )
}
