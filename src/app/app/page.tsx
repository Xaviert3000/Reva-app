'use client'
import { useState, useRef, useEffect, useContext, useCallback, createContext } from 'react'

const LangContext = createContext<'es'|'en'>('en')

// Time-of-day greeting (no fake name — the guest hasn't registered yet).
function timeGreeting(en: boolean): string {
  const h = new Date().getHours()
  if (en) return h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening'
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}
import QRCode from 'qrcode'
import { type Mode, type Business, type Service, BIZ, CATALOG, CITIES, STATES_DATA, COPY, slotsFromHours, upcomingDays, slotAvailability, isScheduled, inStock, tracksStock, dayOffered, findService, localSearch, servicesForSearch, activeAlert, findMunicipio, featuredBadge } from '@/lib/data'
import { fetchCityData, type CityData } from '@/lib/business-data'
import { createClient } from '@/lib/supabase/client'
import { promoWindowLabel } from '@/lib/promotions'
import { roveToken, ROVE_SERIALS, type RoveProgram } from '@/lib/rove'
import { type RoveReward, type RoveRedemption as RoveRedemptionResult } from '@/lib/rove-rewards'
import { clsx } from 'clsx'

// Live businesses + catalog for the guest's current city (Supabase-backed for
// any municipio besides Los Cabos, which keeps the curated demo set).
const BizDataContext = createContext<CityData & { city: string }>({ businesses: BIZ, catalog: CATALOG, city: 'Los Cabos' })

// ── Tracking del espacio "Destacado" (alimenta Informes → Destacado) ──
// impression: el negocio destacado se mostró; click: se abrió su ficha.
// Las impresiones se cuentan una vez por sesión (dedupe) para no inflar; los
// clics siempre. La escritura es best-effort (no bloquea la UI).
const _seenFeatured = new Set<string>()
function trackFeatured(bizId: string | undefined, kind: 'impression' | 'click', surface: string) {
  if (!bizId) return
  if (kind === 'impression') {
    const key = `${bizId}:${surface}`
    if (_seenFeatured.has(key)) return
    _seenFeatured.add(key)
  }
  fetch('/api/featured/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ biz_id: bizId, kind, surface }),
    keepalive: true,
  }).catch(() => {})
}

// ── Icons ──────────────────────────────────────────────────
const I = {
  send: <path d="M5 12l14-7-5 16-3-6-6-3z" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" /></>,
  cal: <><rect x="4" y="5.5" width="16" height="15" rx="3" /><path d="M4 10h16M8 3.5v4M16 3.5v4" /></>,
  ticket: <><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2 2 2 0 000 4 2 2 0 00-2 2H6a2 2 0 01-2-2 2 2 0 000-4z" /><path d="M14 6v12" strokeDasharray="2 2.5" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5.5 20a6.5 6.5 0 0113 0" /></>,
  chat: <path d="M5 18l-1.5 3.5L7 20.5A8.5 8 0 1020 13c0 4.4-3.6 7-8 7a9 9 0 01-7-2z" />,
  chevR: <path d="M9 5l7 7-7 7" />,
  chevL: <path d="M15 5l-7 7 7 7" />,
  check: <path d="M5 13l4 4 10-11" />,
  bell: <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM9.5 19a2.5 2.5 0 005 0" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.5l1-5.8-4.3-4.1 5.9-.8z" />,
  pin: <><path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  shield: <path d="M12 3l7 2.5v5.5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V5.5L12 3z" />,
  spark: <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" /></>,
  home: <><path d="M4 11l8-6.5 8 6.5" /><path d="M6 10v9.5h12V10" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  gift: <><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M4 13h16M12 9v11M12 9c-1-3-5-3-5-.5S10 9 12 9zM12 9c1-3 5-3 5-.5S14 9 12 9z" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  heart: <path d="M12 20s-7-4.6-7-9.5A4.2 4.2 0 0112 8a4.2 4.2 0 017-2.5C20.8 7 19 11 12 20z" />,
  switch: <path d="M7 16H3m0 0l3-3m-3 3l3 3M17 8h4m0 0l-3-3m3 3l-3 3" />,
  chevDown: <path d="M6 9l6 6 6-6" />,
  chevUp: <path d="M6 15l6-6 6 6" />,
  qr: <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" /><path d="M14 14h3M20.5 14v6.5M14 17.5v3M17.5 20.5h3" /></>,
}

// ── QR code (BoomerangMe pass barcode) ─────────────────────
function QRImage({ value, size = 208 }: { value: string; size?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let alive = true
    QRCode.toDataURL(value, { margin: 1, width: size * 2, color: { dark: '#221C19', light: '#FFFFFF' } })
      .then(url => { if (alive) setSrc(url) })
      .catch(() => { if (alive) setSrc('') })
    return () => { alive = false }
  }, [value, size])
  return (
    <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', background: '#fff', borderRadius: 14 }}>
      {src && <img src={src} width={size} height={size} alt="" style={{ display: 'block' }} />}
    </div>
  )
}

function Icon({ n, size = 22, color = 'currentColor', stroke = 2.2, fill = 'none' }: {
  n: keyof typeof I; size?: number; color?: string; stroke?: number; fill?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
      {I[n]}
    </svg>
  )
}

// ── Reva avatar mark ───────────────────────────────────────
function Avatar({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46">
      <rect width="46" height="46" rx="14" fill="#E8505B" />
      <path d="M11 30c0-7.2 5.6-13 12-13s12 5.8 12 13" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="23" cy="30" r="3.3" fill="#fff" />
      <path d="M23 30 L23 37.5" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  )
}

// ── Shared App Header ──────────────────────────────────────
function AppHeader({
  mode, label, title, hasNotif = true, hasMsg = true, extraIcon, showModeBadge = true, onModeToggle, onBell, onMsg,
}: {
  mode: Mode; label?: string; title: string; hasNotif?: boolean; hasMsg?: boolean; extraIcon?: keyof typeof I; showModeBadge?: boolean
  onModeToggle?: () => void; onBell?: () => void; onMsg?: () => void
}) {
  const en = useContext(LangContext) === 'en'
  return (
    <div style={{ padding: 'max(52px, calc(env(safe-area-inset-top) + 16px)) 18px 14px', background: '#FAF5EE' }}>
      {label && <div style={{ fontSize: 12, color: '#A89E94', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#221C19', letterSpacing: '-.03em', lineHeight: 1 }}>
          {title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Messages icon */}
          {hasMsg && (
            <button onClick={onMsg} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #E9E0D5', display: 'grid', placeItems: 'center', cursor: 'pointer', position: 'relative' }}>
              <Icon n="chat" size={17} color="#221C19" />
            </button>
          )}
          {/* Bell */}
          <button onClick={onBell} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #E9E0D5', display: 'grid', placeItems: 'center', cursor: 'pointer', position: 'relative' }}>
            <Icon n="bell" size={18} color="#221C19" />
            {hasNotif && <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#E8505B', border: '2px solid #FAF5EE' }} />}
          </button>
          {/* Optional extra icon (e.g. switch on Rove) */}
          {extraIcon && (
            <button style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #E9E0D5', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <Icon n={extraIcon} size={18} color="#221C19" />
            </button>
          )}
          {/* Mode badge — always reflects actual mode (location), not language. Only shown on Profile/You. */}
          {showModeBadge && (
            <button onClick={onModeToggle}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: mode === 'explorer' ? '#FCE9E7' : '#DDF0E8', color: mode === 'explorer' ? '#D23B47' : '#16614c', borderRadius: 999, padding: '6px 10px 6px 7px', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: mode === 'explorer' ? '#E8505B' : '#1F8A6D', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {mode === 'explorer' ? <Icon n="globe" size={13} color="#fff" /> : <Icon n="home" size={13} color="#fff" />}
              </span>
              {mode === 'explorer' ? 'Explorer' : 'Vecino'}
              <Icon n="chevDown" size={14} color={mode === 'explorer' ? '#D23B47' : '#16614c'} stroke={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, color: '#E7A33C' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Icon key={n} n="star" size={12} color="#E7A33C" fill={n <= Math.round(rating) ? '#E7A33C' : 'none'} stroke={1.5} />
      ))}
    </span>
  )
}

// ── Onboarding ─────────────────────────────────────────────
function Onboarding({ onDone }: { onDone: (homeState: string | null, homeCity: string | null, currentCity: string | null) => void }) {
  const [step, setStep] = useState(0)
  const [homeState, setHomeState] = useState<string | null>(null)
  const [homeCity, setHomeCity] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<'estado' | 'municipio' | null>(null)
  const [justVisiting, setJustVisiting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [located, setLocated] = useState<{ state: string; municipio: string } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [referralInput, setReferralInput] = useState('')
  const [referralStatus, setReferralStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')

  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta ubicación.')
      return
    }
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=es`)
          const data = await res.json()
          const addr = data.address ?? {}
          const candidates: string[] = [addr.city, addr.town, addr.municipality, addr.village, addr.county, addr.state_district].filter(Boolean)
          const hit = candidates.map(findMunicipio).find(Boolean) ?? null
          if (hit) setLocated(hit)
          else setLocationError('No pudimos identificar tu municipio exacto.')
        } catch {
          setLocationError('No pudimos obtener tu ubicación.')
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        setLocationError('Permiso de ubicación denegado.')
      },
      { timeout: 10000 },
    )
  }

  const selectedStateData = STATES_DATA.find(s => s.name === homeState)
  const canContinue = justVisiting || (homeState !== null && homeCity !== null)

  const handleStateSelect = (name: string) => {
    setHomeState(name)
    setHomeCity(null)
    setJustVisiting(false)
    setOpenDropdown(null)
  }
  const handleJustVisiting = () => {
    setJustVisiting(true)
    setHomeState(null)
    setHomeCity(null)
    setOpenDropdown(null)
  }

  // Estado más destacado primero, luego el resto alfabético — para que BC/BCS
  // queden arriba del dropdown sin perder el resto de los estados.
  const orderedStates = [...STATES_DATA].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.name.localeCompare(b.name))

  const Chevron = ({ open }: { open: boolean }) => (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )

  return (
    <div className="absolute inset-0 z-50 flex flex-col text-white"
      style={{ background: 'linear-gradient(165deg,#E8505B 0%,#E7873E 42%,#6B3F5C 78%,#2B2438 100%)' }}>
      <div className="absolute top-[-10%] right-[-20%] w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(255,255,255,.22),transparent 65%)' }} />

      {/* Step dots */}
      <div className="flex gap-2 justify-center flex-shrink-0" style={{ paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 14px))' }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="h-[7px] rounded-full transition-all duration-300"
            style={{ width: i === step ? 22 : 7, background: i === step ? '#fff' : 'rgba(255,255,255,.4)' }} />
        ))}
      </div>

      {/* Content — step 1 scrolls, others center */}
      <div className={`flex-1 px-7 relative ${step === 1 ? 'overflow-y-auto py-6' : 'flex flex-col justify-center'}`}>

        {step === 0 && (
          <>
            <div className="rounded-[22px] bg-white/16 grid place-items-center mb-7" style={{ width: 72, height: 72 }}>
              <Avatar size={48} />
            </div>
            <h1 className="font-extrabold text-[40px] leading-[1.04] tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              A very well-connected local, in your pocket.
            </h1>
            <p className="italic text-[20px] opacity-90 mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
              Un amigo local muy bien conectado.
            </p>
            <p className="text-[15px] opacity-85 leading-relaxed">
              Tell Reva what you want — a table, a massage, the plan for tonight — and she resolves it. Live, with the business.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-extrabold leading-tight tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}>
              ¿Dónde eres local?
            </h2>
            <p className="font-extrabold leading-tight mb-3" style={{ fontSize: 20, opacity: .75 }}>Where do you live?</p>
            <p className="text-[13px] opacity-70 mb-5 leading-relaxed">
              Reva te trata como Vecino en tu municipio y como Explorer cuando visitas otro lugar.
            </p>

            {/* ── Estado (dropdown) ── */}
            <p style={{ fontSize: 10.5, fontWeight: 700, opacity: .55, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 9 }}>
              Estado
            </p>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <button onClick={() => setOpenDropdown(d => d === 'estado' ? null : 'estado')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.28)', background: 'rgba(255,255,255,.13)', color: homeState ? '#fff' : 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, textAlign: 'left' }}>
                <span>{homeState ?? 'Selecciona un estado'}</span>
                <Chevron open={openDropdown === 'estado'} />
              </button>
              {openDropdown === 'estado' && (
                <div style={{ marginTop: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,.22)', background: 'rgba(43,36,56,.96)', backdropFilter: 'blur(8px)', maxHeight: 240, overflowY: 'auto' }}>
                  {orderedStates.map(s => {
                    const sel = s.name === homeState
                    return (
                      <button key={s.abbr} onClick={() => handleStateSelect(s.name)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid rgba(255,255,255,.08)', background: sel ? 'rgba(255,255,255,.12)' : 'transparent', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, textAlign: 'left' }}>
                        <span>{s.name} {s.featured && <span style={{ opacity: .6, fontSize: 11 }}>★</span>}</span>
                        {sel && (
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8505B" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4 10-11" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Municipio (dropdown, aparece al seleccionar estado) ── */}
            {selectedStateData && (
              <>
                <p style={{ fontSize: 10.5, fontWeight: 700, opacity: .55, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 9 }}>
                  Municipio · <span style={{ opacity: 1, color: '#fff' }}>{homeState}</span>
                </p>
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <button onClick={() => setOpenDropdown(d => d === 'municipio' ? null : 'municipio')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.28)', background: 'rgba(255,255,255,.13)', color: homeCity ? '#fff' : 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, textAlign: 'left' }}>
                    <span>{homeCity ?? 'Selecciona un municipio'}</span>
                    <Chevron open={openDropdown === 'municipio'} />
                  </button>
                  {openDropdown === 'municipio' && (
                    <div style={{ marginTop: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,.22)', background: 'rgba(43,36,56,.96)', backdropFilter: 'blur(8px)', maxHeight: 240, overflowY: 'auto' }}>
                      {selectedStateData.municipalities.map(mun => {
                        const sel = mun === homeCity
                        return (
                          <button key={mun} onClick={() => { setHomeCity(mun); setJustVisiting(false); setOpenDropdown(null) }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid rgba(255,255,255,.08)', background: sel ? 'rgba(255,255,255,.12)' : 'transparent', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, textAlign: 'left' }}>
                            <span>{mun}</span>
                            {sel && (
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8505B" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 13l4 4 10-11" />
                              </svg>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 12px', opacity: .35 }}>
              <div style={{ flex: 1, height: 1, background: '#fff' }} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>o</span>
              <div style={{ flex: 1, height: 1, background: '#fff' }} />
            </div>

            {/* ── Solo de visita ── */}
            <button onClick={handleJustVisiting}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', borderRadius: 16, border: justVisiting ? 'none' : '1px solid rgba(255,255,255,.25)', background: justVisiting ? '#fff' : 'rgba(255,255,255,.1)', color: justVisiting ? '#221C19' : '#fff', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, width: '100%', textAlign: 'left' }}>
              <span style={{ fontSize: 19 }}>🌍</span>
              <span style={{ flex: 1 }}>Solo de visita · Just visiting</span>
              {justVisiting && (
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#E8505B" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4 10-11" />
                </svg>
              )}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-5xl mb-6">📍</div>
            <h2 className="font-extrabold text-[34px] leading-tight tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              {homeCity ? '¿Dónde estás ahora?' : 'Where are you exploring?'}
            </h2>
            <p className="text-[15px] opacity-80 mb-6">
              {homeCity
                ? `Reva te muestra lo de ${homeCity}, ${homeState} — y cuando estés en otro municipio, cambia a Explorer automáticamente.`
                : "Reva uses your location to show what's near you."}
            </p>
            <button onClick={handleAllowLocation} disabled={locating}
              className="flex items-center gap-3 p-4 rounded-[18px] border border-white/25 w-full text-left"
              style={{ background: located ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.14)', cursor: locating ? 'default' : 'pointer' }}>
              <span className="text-xl">{located ? '✅' : '📡'}</span>
              <span className="text-[15px] font-semibold">
                {locating
                  ? (homeCity ? 'Ubicando…' : 'Locating…')
                  : located
                    ? `${located.municipio}, ${located.state}`
                    : (homeCity ? 'Permitir ubicación' : 'Allow location access')}
              </span>
            </button>
            {locationError && (
              <p className="text-[12.5px] mt-2" style={{ opacity: .8 }}>{locationError} {homeCity ? `Usaremos ${homeCity} por ahora.` : ''}</p>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      <div className="px-7 flex flex-col gap-3 flex-shrink-0" style={{ paddingBottom: 'max(48px, calc(env(safe-area-inset-bottom) + 22px))' }}>
        {/* Campo de código de referido — solo en step 2 */}
        {step === 2 && (
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginBottom: 6 }}>
              ¿Tienes un código de invitación? (opcional)
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={referralInput}
                onChange={e => { setReferralInput(e.target.value.toUpperCase().slice(0, 6)); setReferralStatus('idle') }}
                placeholder="XXXXXX"
                maxLength={6}
                style={{ flex: 1, background: 'rgba(255,255,255,.15)', border: referralStatus === 'ok' ? '1.5px solid #4ADE80' : referralStatus === 'error' ? '1.5px solid #F87171' : '1.5px solid rgba(255,255,255,.3)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '.12em', outline: 'none' }}
              />
              {referralInput.length === 6 && (referralStatus === 'idle' || referralStatus === 'checking') && (
                <button
                  onClick={async () => {
                    setReferralStatus('checking')
                    try {
                      const res = await fetch('/api/rove/referral', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: referralInput, userId: 'new-user-' + Date.now() }),
                      })
                      setReferralStatus(res.ok ? 'ok' : 'error')
                    } catch { setReferralStatus('error') }
                  }}
                  disabled={referralStatus === 'checking'}
                  style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 12, padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  {referralStatus === 'checking' ? '…' : 'Aplicar'}
                </button>
              )}
            </div>
            {referralStatus === 'ok' && <p style={{ fontSize: 12, color: '#4ADE80', marginTop: 5, fontWeight: 600 }}>✓ Código válido — tu amigo recibirá +5 boletos cuando hagas tu primera reserva</p>}
            {referralStatus === 'error' && <p style={{ fontSize: 12, color: '#F87171', marginTop: 5, fontWeight: 600 }}>Código no encontrado. Verifica e intenta de nuevo.</p>}
          </div>
        )}
        <button
          onClick={() => step < 2 ? setStep(step + 1) : onDone(homeState, homeCity, located?.municipio ?? null)}
          disabled={step === 1 && !canContinue}
          className="w-full py-4 rounded-full font-bold text-[16px] bg-white transition-opacity"
          style={{ color: '#E8505B', opacity: step === 1 && !canContinue ? 0.45 : 1 }}>
          {step === 0 ? 'Get started' : step === 1 ? 'Continue' : 'Open Reva'}
        </button>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="text-center text-[13.5px] opacity-70">Back</button>
        )}
      </div>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────
type Msg = { id: number; who: 'reva' | 'user' | 'cards' | 'svc-cards'; text?: string; cards?: string[]; serviceCards?: string[] }
type ApiMsg = { role: 'user' | 'assistant'; content: string }

function extractBizIds(text: string): string[] {
  const match = text.match(/<!--\s*bizIds:\s*([^>]+)\s*-->/)
  if (!match) return []
  return match[1].split(',').map(s => s.trim()).filter(Boolean)
}
function extractServiceIds(text: string): string[] {
  const match = text.match(/<!--\s*serviceIds:\s*([^>]+)\s*-->/)
  if (!match) return []
  return match[1].split(',').map(s => s.trim()).filter(Boolean)
}
function stripComment(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').trim()
}

// ── Typing bubble ──────────────────────────────────────────
function TypingBubble() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, borderBottomLeftRadius: 6, padding: '14px 16px', alignSelf: 'flex-start', boxShadow: '0 2px 10px rgba(34,28,25,.06)' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#A89E94', display: 'block', animation: `typing-dot 1s ${i * 0.16}s infinite` }} />
      ))}
    </div>
  )
}

// ── Option Card (full-width vertical) ─────────────────────
function OptionCard({ biz, mode, onOpen, onBook }: { biz: Business; mode: Mode; onOpen: () => void; onBook: () => void }) {
  const en = useContext(LangContext) === 'en'
  return (
    <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 10px rgba(34,28,25,.06)', cursor: 'pointer' }} onClick={onOpen}>
      {/* color hero */}
      <div style={{ height: 90, background: `linear-gradient(135deg,${biz.grad[0]},${biz.grad[1]})`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '12px 14px' }}>
        <span style={{ position: 'absolute', right: -4, bottom: -10, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 80, opacity: .18, color: '#fff', lineHeight: 1 }}>{biz.mono}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Stars rating={biz.rating} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>{biz.rating} · {biz.type}</span>
        </div>
      </div>
      <div style={{ padding: '14px 14px 10px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#221C19', marginBottom: 4 }}>{biz.name}</div>
        <div style={{ fontSize: 13.5, color: '#6B615A', lineHeight: 1.4, marginBottom: 10 }}>{en ? biz.en : biz.es}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {biz.tags.slice(0, 2).map(t => (
            <span key={t} style={{ fontSize: 12, fontWeight: 600, color: '#6B615A', background: '#F3EADD', padding: '5px 10px', borderRadius: 999 }}>{t}</span>
          ))}
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B615A', background: '#F3EADD', padding: '5px 10px', borderRadius: 999 }}>📍 {biz.dist} km</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onBook() }}
          style={{ width: '100%', background: '#E8505B', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Icon n="spark" size={16} color="#fff" fill="none" />
          {en ? 'Reserve with Reva' : 'Reservar con Reva'}
        </button>
      </div>
    </div>
  )
}

// ── Service result card (chat) — tap for details, button to book ─
function ServiceChatCard({ biz, service, mode, onDetail, onBook }: { biz: Business; service: Service; mode: Mode; onDetail: () => void; onBook: () => void }) {
  const en = useContext(LangContext) === 'en'
  const available = inStock(service)
  return (
    <div onClick={onDetail} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, padding: 12, boxShadow: '0 2px 10px rgba(34,28,25,.06)', cursor: 'pointer' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: `linear-gradient(140deg,${service.grad[0]},${service.grad[1]})`, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.85)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19 }}>{biz.mono}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#221C19', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.name}</div>
        <div style={{ fontSize: 12.5, color: '#6B615A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{biz.name} · {service.price}</div>
        <div style={{ fontSize: 11.5, color: available ? '#A89E94' : '#B5472F', marginTop: 2, fontWeight: available ? 400 : 700 }}>{available ? (en ? 'Tap for details' : 'Toca para ver detalles') : (en ? 'Sold out' : 'Agotado')}</div>
      </div>
      <button disabled={!available} onClick={e => { e.stopPropagation(); onBook() }} style={{ flexShrink: 0, background: available ? '#E8505B' : '#F0D9D5', color: available ? '#fff' : '#B5472F', border: 'none', borderRadius: 12, padding: '9px 14px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, cursor: available ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
        {!available ? (en ? 'Sold out' : 'Agotado') : isScheduled(service) ? (en ? 'Reserve' : 'Reservar') : (en ? 'Request' : 'Solicitar')}
      </button>
    </div>
  )
}

// ── Service detail sheet — what the service includes ───────
function ServiceDetail({ biz, service, mode, onClose, onBook }: { biz: Business; service: Service; mode: Mode; onClose: () => void; onBook: () => void }) {
  const en = useContext(LangContext) === 'en'
  const scheduled = isScheduled(service)
  const available = inStock(service)
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'fadeIn .18s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FAF5EE', borderRadius: '30px 30px 0 0', maxHeight: '90%', overflowY: 'auto' }}>
        {/* hero */}
        <div style={{ height: 132, background: `linear-gradient(135deg,${service.grad[0]},${service.grad[1]})`, position: 'relative', borderRadius: '30px 30px 0 0' }}>
          <span style={{ position: 'absolute', right: 6, bottom: -12, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 120, opacity: .16, color: '#fff', lineHeight: 1 }}>{biz.mono}</span>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.92)', border: 'none', cursor: 'pointer', color: '#221C19', fontSize: 20, display: 'grid', placeItems: 'center' }}>×</button>
        </div>
        <div style={{ padding: '18px 20px calc(30px + env(safe-area-inset-bottom, 0px))' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#221C19', lineHeight: 1.1 }}>{service.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, color: '#6B615A', fontSize: 13.5 }}>
            <Icon n="pin" size={14} color="#A89E94" /> {biz.name} · {biz.hood}
          </div>

          {/* meta chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#221C19', background: '#fff', border: '1px solid #E9E0D5', padding: '7px 13px', borderRadius: 999 }}>{service.price}</span>
            {scheduled && service.duration ? <span style={{ fontSize: 13, fontWeight: 600, color: '#6B615A', background: '#F3EADD', padding: '7px 13px', borderRadius: 999 }}>⏱ {service.duration} min</span> : null}
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6B615A', background: '#F3EADD', padding: '7px 13px', borderRadius: 999 }}>{service.category}</span>
            {!scheduled && <span style={{ fontSize: 13, fontWeight: 700, color: '#16614c', background: '#DDF0E8', padding: '7px 13px', borderRadius: 999 }}>{en ? 'On request' : 'Bajo solicitud'}</span>}
            {tracksStock(service) && (available
              ? <span style={{ fontSize: 13, fontWeight: 700, color: (service.stock as number) <= 3 ? '#9A6410' : '#16614c', background: (service.stock as number) <= 3 ? '#F7ECD5' : '#DDF0E8', padding: '7px 13px', borderRadius: 999 }}>{en ? `${service.stock} left` : `Quedan ${service.stock}`}</span>
              : <span style={{ fontSize: 13, fontWeight: 700, color: '#B5472F', background: '#F0D9D5', padding: '7px 13px', borderRadius: 999 }}>{en ? 'Sold out' : 'Agotado'}</span>)}
          </div>

          {/* what's included */}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#221C19', marginTop: 22, marginBottom: 12 }}>
            {en ? "What's included" : 'Qué incluye'}
          </div>
          {service.includes && service.includes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {service.includes.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#DDF0E8', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon n="check" size={13} color="#1F8A6D" stroke={3} />
                  </span>
                  <span style={{ fontSize: 14.5, color: '#221C19', lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14.5, color: '#6B615A', lineHeight: 1.45 }}>{service.sub}</div>
          )}

          {/* trust */}
          <div style={{ display: 'flex', gap: 12, marginTop: 22, padding: '13px 15px', background: '#DDF0E8', borderRadius: 16 }}>
            <Icon n="shield" size={18} color="#1F8A6D" />
            <div style={{ fontSize: 12.5, color: '#16614c', lineHeight: 1.4 }}>
              {scheduled
                ? (en ? 'Free cancellation up to 2h before · No charge now.' : 'Cancelación gratis hasta 2h antes · Sin cargo ahora.')
                : (en ? 'Reva coordinates the details with you — no charge now.' : 'Reva coordina los detalles contigo — sin cargo ahora.')}
            </div>
          </div>

          {/* CTA */}
          <button onClick={onBook} disabled={!available} style={{ width: '100%', marginTop: 18, background: available ? '#E8505B' : '#F0D9D5', color: available ? '#fff' : '#B5472F', border: 'none', borderRadius: 999, padding: '15px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, cursor: available ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon n="spark" size={18} color={available ? '#fff' : '#B5472F'} />
            {!available ? (en ? 'Sold out' : 'Agotado') : scheduled ? (en ? 'Reserve with Reva' : 'Reservar con Reva') : (en ? 'Request with Reva' : 'Solicitar con Reva')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Result stacks (chat) — cap to a few, expand for the rest ─
const seeMoreBtn: React.CSSProperties = { width: '100%', padding: '11px 0', background: 'transparent', border: '1px solid #E9E0D5', borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: '#D23B47', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }

function BizCardStack({ businesses, mode, onOpen, onBook }: { businesses: Business[]; mode: Mode; onOpen: (b: Business) => void; onBook: (b: Business) => void }) {
  const en = useContext(LangContext) === 'en'
  const [all, setAll] = useState(false)
  const shown = all ? businesses : businesses.slice(0, 3)
  const hidden = businesses.length - shown.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 2 }}>
      {shown.map(biz => <OptionCard key={biz.id} biz={biz} mode={mode} onOpen={() => onOpen(biz)} onBook={() => onBook(biz)} />)}
      {hidden > 0 && (
        <button onClick={() => setAll(true)} style={seeMoreBtn}>
          {en ? `Show ${hidden} more place${hidden === 1 ? '' : 's'}` : `Ver ${hidden} lugar${hidden === 1 ? '' : 'es'} más`}
          <Icon n="chevDown" size={15} color="#D23B47" />
        </button>
      )}
    </div>
  )
}

function SvcCardStack({ results, mode, onServiceDetail, onBookService }: { results: { biz: Business; service: Service }[]; mode: Mode; onServiceDetail: (b: Business, s: Service) => void; onBookService: (b: Business, s: Service) => void }) {
  const en = useContext(LangContext) === 'en'
  const [all, setAll] = useState(false)
  const shown = all ? results : results.slice(0, 3)
  const hidden = results.length - shown.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
      {shown.map(({ biz, service }) => <ServiceChatCard key={service.id} biz={biz} service={service} mode={mode} onDetail={() => onServiceDetail(biz, service)} onBook={() => onBookService(biz, service)} />)}
      {hidden > 0 && (
        <button onClick={() => setAll(true)} style={seeMoreBtn}>
          {en ? `Show ${hidden} more service${hidden === 1 ? '' : 's'}` : `Ver ${hidden} servicio${hidden === 1 ? '' : 's'} más`}
          <Icon n="chevDown" size={15} color="#D23B47" />
        </button>
      )}
    </div>
  )
}

// ── Concierge Chat ─────────────────────────────────────────
function Concierge({ mode, onOpen, onBook, onBookService, onServiceDetail, onModeToggle, onBell, onMsg }: { mode: Mode; onOpen: (b: Business) => void; onBook: (b: Business) => void; onBookService: (b: Business, s: Service) => void; onServiceDetail: (b: Business, s: Service) => void; onModeToggle: () => void; onBell: () => void; onMsg: () => void }) {
  const en = useContext(LangContext) === 'en'
  const copy = en ? COPY.explorer : COPY.vecino
  const { businesses, catalog, city } = useContext(BizDataContext)
  const byId = (id: string) => businesses.find(b => b.id === id)!
  const scroller = useRef<HTMLDivElement>(null)

  const [msgs, setMsgs] = useState<Msg[]>([{ id: 1, who: 'reva', text: `${copy.greet} ${copy.sub}` }])
  const [history, setHistory] = useState<ApiMsg[]>([])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')

  useEffect(() => {
    setMsgs([{ id: 1, who: 'reva', text: `${copy.greet} ${copy.sub}` }])
    setHistory([])
    setInput('')
  }, [mode, city])

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [msgs, typing])

  const showPrompts = msgs.length <= 1 && !typing

  async function send(text: string) {
    if (!text.trim() || typing) return
    setInput('')
    const userMsg: ApiMsg = { role: 'user', content: text }
    const nextHistory = [...history, userMsg]
    setHistory(nextHistory)
    setMsgs(m => [...m, { id: Date.now(), who: 'user', text }])
    setTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextHistory, mode, city, businesses, catalog }),
      })

      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      const replyId = Date.now() + 1

      setTyping(false)
      setMsgs(m => [...m, { id: replyId, who: 'reva', text: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta: string = parsed.choices?.[0]?.delta?.content ?? ''
            if (delta) {
              full += delta
              setMsgs(m => m.map(msg => msg.id === replyId ? { ...msg, text: stripComment(full) } : msg))
            }
          } catch { /* skip */ }
        }
      }

      // Chat shows SERVICES only (no business cards). Expand recommended
      // businesses to their services when no specific service was named.
      const serviceIds = servicesForSearch(extractBizIds(full), extractServiceIds(full), catalog)
      if (serviceIds.length > 0) {
        setTimeout(() => setMsgs(m => [...m, { id: Date.now() + 2, who: 'svc-cards', serviceCards: serviceIds }]), 200)
      }
      setHistory(h => [...h, { role: 'assistant', content: full }])
    } catch {
      setTyping(false)
      // No AI available (e.g. no API key) — fall back to a local keyword search
      // over businesses AND their services so the user still sees results.
      const found = localSearch(text, businesses, catalog)
      const serviceIds = servicesForSearch(found.bizIds, found.serviceIds, catalog)
      if (serviceIds.length) {
        const n = serviceIds.length
        const line = en ? `Found ${n} service${n === 1 ? '' : 's'} that match:` : `Encontré ${n} servicio${n === 1 ? '' : 's'} que coinciden:`
        setMsgs(m => [...m, { id: Date.now() + 1, who: 'reva', text: line }])
        setMsgs(m => [...m, { id: Date.now() + 2, who: 'svc-cards', serviceCards: serviceIds }])
      } else {
        setMsgs(m => [...m, { id: Date.now() + 1, who: 'reva', text: en ? "I couldn't find that — try a place or service name." : 'No encontré eso — prueba con un lugar o servicio.' }])
      }
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FAF5EE' }}>
      {/* Header */}
      <AppHeader mode={mode} label={timeGreeting(en)} title={en ? 'Ask Reva' : 'Pregúntale a Reva'} hasNotif showModeBadge={false} onModeToggle={onModeToggle} onBell={onBell} onMsg={onMsg} />

      {/* Messages */}
      <div ref={scroller} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msgs.map(msg => {
          if (msg.who === 'reva') return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: '86%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size={26} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#A89E94' }}>Reva</span>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 20, borderBottomLeftRadius: 7, padding: '13px 16px', fontSize: 15.5, lineHeight: 1.42, color: '#221C19', boxShadow: '0 2px 10px rgba(34,28,25,.06)' }}>
                {msg.text}
              </div>
            </div>
          )
          if (msg.who === 'user') return (
            <div key={msg.id} style={{ alignSelf: 'flex-end', maxWidth: '82%', background: '#221C19', color: '#fff', borderRadius: 20, borderBottomRightRadius: 7, padding: '12px 16px', fontSize: 15.5, lineHeight: 1.4 }}>
              {msg.text}
            </div>
          )
          if (msg.who === 'cards') {
            const cards = (msg.cards ?? []).map(id => byId(id)).filter(Boolean)
            if (cards.length === 0) return null
            return <BizCardStack key={msg.id} businesses={cards} mode={mode} onOpen={onOpen} onBook={onBook} />
          }
          if (msg.who === 'svc-cards') {
            const results = (msg.serviceCards ?? []).map(id => findService(id, businesses, catalog)).filter(Boolean) as { biz: Business; service: Service }[]
            if (results.length === 0) return null
            return <SvcCardStack key={msg.id} results={results} mode={mode} onServiceDetail={onServiceDetail} onBookService={onBookService} />
          }
          return null
        })}
        {typing && <TypingBubble />}

        {showPrompts && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 12.5, color: '#A89E94', fontWeight: 600, marginBottom: 10, marginLeft: 2 }}>
              {en ? 'Try' : 'Prueba'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {copy.prompts.map(p => (
                <button key={p} onClick={() => send(p)}
                  style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, padding: '11px 15px', borderRadius: 16, border: '1px solid #E9E0D5', background: '#fff', color: '#221C19', cursor: 'pointer', textAlign: 'left', boxShadow: '0 2px 10px rgba(34,28,25,.06)' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{ padding: '10px 14px 14px', background: 'rgba(250,245,238,.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid #F1EADF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: '1px solid #E9E0D5', borderRadius: 999, padding: '6px 6px 6px 16px', boxShadow: '0 2px 10px rgba(34,28,25,.06)' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder={copy.ph}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-ui)', fontSize: 15.5, color: '#221C19' }} />

          <button onClick={() => send(input)}
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: input.trim() ? '#E8505B' : '#F3EADD', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'background .15s' }}>
            <Icon n="send" size={19} color={input.trim() ? '#fff' : '#A89E94'} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Discovery ──────────────────────────────────────────────
function MiniCard({ biz, mode, onOpen }: { biz: Business; mode: Mode; onOpen: () => void }) {
  const en = useContext(LangContext) === 'en'
  return (
    <div onClick={onOpen} style={{ width: 188, flexShrink: 0, cursor: 'pointer', background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 10px rgba(34,28,25,.06)' }}>
      <div style={{ height: 112, background: biz.img ? `center/cover no-repeat url(${biz.img})` : `linear-gradient(135deg,${biz.grad[0]},${biz.grad[1]})`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '10px 12px' }}>
        {!biz.img && <span style={{ position: 'absolute', right: -2, bottom: -8, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 72, opacity: .18, color: '#fff', lineHeight: 1 }}>{biz.mono}</span>}
        <Stars rating={biz.rating} />
      </div>
      <div style={{ padding: '11px 13px 13px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#221C19', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biz.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
          <span style={{ fontSize: 12, color: '#6B615A' }}>{biz.type} · {biz.dist} km</span>
        </div>
      </div>
    </div>
  )
}

// Tarjeta de la franja de Destacados (tier 'destacado'): igual que MiniCard pero
// con su etiqueta ✦ visible, honesta sobre que es un espacio pagado.
function DestacadoCard({ biz, onOpen }: { biz: Business; onOpen: () => void }) {
  const badge = featuredBadge(biz)
  return (
    <div onClick={onOpen} style={{ width: 188, flexShrink: 0, cursor: 'pointer', background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 10px rgba(34,28,25,.06)' }}>
      <div style={{ height: 112, background: biz.img ? `center/cover no-repeat url(${biz.img})` : `linear-gradient(135deg,${biz.grad[0]},${biz.grad[1]})`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '10px 12px' }}>
        {!biz.img && <span style={{ position: 'absolute', right: -2, bottom: -8, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 72, opacity: .18, color: '#fff', lineHeight: 1 }}>{biz.mono}</span>}
        {badge && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(27,36,54,.85)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 999 }}>{badge.icon} {badge.label}</span>
        )}
        <Stars rating={biz.rating} />
      </div>
      <div style={{ padding: '11px 13px 13px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#221C19', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biz.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
          <span style={{ fontSize: 12, color: '#6B615A' }}>{biz.type} · {biz.dist} km</span>
        </div>
      </div>
    </div>
  )
}

function HeroFeatured({ biz, mode, onOpen }: { biz: Business; mode: Mode; onOpen: () => void }) {
  const en = useContext(LangContext) === 'en'
  return (
    <div onClick={onOpen} style={{ margin: '0 16px 8px', borderRadius: 22, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 10px 30px rgba(34,28,25,.10)', position: 'relative', height: 210, background: biz.img ? `center/cover no-repeat url(${biz.img})` : `linear-gradient(135deg,${biz.grad[0]},${biz.grad[1]})` }}>
      {!biz.img && <span style={{ position: 'absolute', right: -10, bottom: -16, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 200, opacity: .12, color: '#fff', lineHeight: 1 }}>{biz.mono}</span>}
      {(() => { const badge = featuredBadge(biz); return badge && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(27,36,54,.85)', color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: 999 }}>{badge.icon} {badge.label}</div>
      ) })()}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, paddingTop: 50, background: 'linear-gradient(transparent,rgba(20,14,12,.82))', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Stars rating={biz.rating} />
          <span style={{ fontSize: 12.5, opacity: .9 }}>{biz.type}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 25, lineHeight: 1.1 }}>{biz.name}</div>
        <div style={{ fontSize: 13.5, opacity: .9, marginTop: 6, maxWidth: '34ch' }}>{en ? biz.en : biz.es}</div>
      </div>
    </div>
  )
}

function Discovery({ mode, onOpen, onBook, onModeToggle, onBell, onMsg }: { mode: Mode; onOpen: (b: Business) => void; onBook: (b: Business) => void; onModeToggle: () => void; onBell: () => void; onMsg: () => void }) {
  const en = useContext(LangContext) === 'en'
  const { businesses, city } = useContext(BizDataContext)
  const copy = { ...(en ? COPY.explorer : COPY.vecino), discoverTitle: en ? `Tonight in ${city}` : `Hoy en ${city}` }
  const cats = en ? ['All', 'Eat', 'Spa', 'Tours', 'Nightlife'] : ['Todo', 'Comer', 'Spa', 'Tours', 'Noche']
  const catKeys: (string | null)[] = [null, 'Comer', 'Spa', 'Tours', 'Vida nocturna']
  const [cat, setCat] = useState(0)
  // Premium tiene prioridad por el único spot destacado; si no hay Premium,
  // cae al primer Destacado disponible.
  const featured = businesses.find(b => b.tier === 'premium' && b.featured) ?? businesses.find(b => b.featured) ?? businesses[0]
  const catKey = catKeys[cat] ?? null
  const filteredBiz = catKey ? businesses.filter(b => b.cat === catKey) : businesses
  const favs = filteredBiz.filter(b => b.localFav)
  const newer = filteredBiz.filter(b => !b.localFav && !b.featured).slice(0, 3)
  const showFeatured = !!featured && (!catKey || featured.cat === catKey)
  // Franja de Destacados: negocios featured que no ocupan el hero (todos los que
  // no son el Premium mostrado arriba), con su etiqueta ✦.
  const destacados = filteredBiz.filter(b => b.featured && b.id !== (showFeatured ? featured?.id : undefined))

  // Impresiones reales del espacio Destacado (una vez por negocio/sesión).
  const featuredImpId = showFeatured ? featured?.id : undefined
  const destacadoIds = destacados.map(b => b.id).join(',')
  useEffect(() => {
    if (featuredImpId) trackFeatured(featuredImpId, 'impression', 'hero')
    if (destacadoIds) destacadoIds.split(',').forEach(id => trackFeatured(id, 'impression', 'strip'))
  }, [featuredImpId, destacadoIds])

  return (
    <div style={{ overflow: 'auto', height: '100%', paddingBottom: 18, background: '#FAF5EE' }}>
      {/* header */}
      <AppHeader mode={mode} title={copy.discoverTitle} hasNotif showModeBadge={false} onModeToggle={onModeToggle} onBell={onBell} onMsg={onMsg} />
      <div style={{ padding: '0 16px 14px' }}>
        {/* search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E9E0D5', borderRadius: 999, padding: '12px 16px', boxShadow: '0 2px 10px rgba(34,28,25,.06)', color: '#A89E94', marginBottom: 14 }}>
          <Icon n="search" size={19} color="#A89E94" />
          <span style={{ fontSize: 15, color: '#A89E94' }}>{en ? 'Search places, vibes, dishes…' : 'Busca lugares, planes, platillos…'}</span>
        </div>
        {/* cats */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {cats.map((c, i) => (
            <button key={c} onClick={() => setCat(i)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, padding: '8px 16px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', background: cat === i ? '#221C19' : '#fff', color: cat === i ? '#fff' : '#6B615A', border: cat === i ? 'none' : '1px solid #E9E0D5' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* proactive card — driven by business-configured alerts */}
      {(() => {
        const hit = activeAlert(businesses)
        if (!hit) return null
        const { biz: alertBiz, alert } = hit
        const typeLabel: Record<string, string> = {
          happy_hour: en ? 'Reva noticed' : 'Reva notó',
          evento: en ? 'Event nearby' : 'Evento cercano',
          promo: en ? 'Special offer' : 'Oferta especial',
          ultimos_lugares: en ? 'Almost full' : 'Últimos lugares',
        }
        return (
          <div style={{ margin: '0 16px 18px', borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#1B2436,#2A3550)', color: '#fff', boxShadow: '0 10px 30px rgba(34,28,25,.10)' }}>
            <div style={{ position: 'absolute', right: -20, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(232,80,91,.4),transparent 65%)' }} />
            <div style={{ padding: 18, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,.14)', padding: '5px 10px', borderRadius: 999 }}>
                  <Icon n="bell" size={12} color="#fff" /> {typeLabel[alert.type] ?? (en ? 'Reva noticed' : 'Reva notó')}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, lineHeight: 1.25 }}>
                {alert.title}
              </div>
              <div style={{ fontSize: 13.5, opacity: .82, marginTop: 6 }}>
                {alert.body}
              </div>
              <div style={{ marginTop: 14 }}>
                <button onClick={() => { if (alertBiz.featured) trackFeatured(alertBiz.id, 'click', 'alert'); onOpen(alertBiz) }} style={{ background: '#E8505B', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {alert.cta}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* section: tonight */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#221C19' }}>{copy.discoverTitle}</div>
        <div style={{ fontSize: 13, color: '#6B615A', marginTop: 2 }}>{copy.discoverSub}</div>
      </div>
      {showFeatured && featured && (
        <>
          <HeroFeatured biz={featured} mode={mode} onOpen={() => { trackFeatured(featured.id, 'click', 'hero'); onOpen(featured) }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px 20px', fontSize: 12, color: '#A89E94' }}>
            <Icon n="info" size={13} color="#A89E94" /> {en ? 'Destacado = a business paid to be featured here.' : 'Destacado = un negocio pagó por aparecer aquí.'}
          </div>
        </>
      )}

      {/* franja de destacados (tier 'destacado') */}
      {destacados.length > 0 && (
        <>
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#221C19' }}>{en ? 'Featured' : 'Destacados'}</div>
            <div style={{ fontSize: 13, color: '#6B615A', marginTop: 2 }}>{en ? 'Businesses that paid to stand out' : 'Negocios que pagaron por resaltar'}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, padding: '0 16px 24px', overflowX: 'auto' }}>
            {destacados.map(b => <DestacadoCard key={b.id} biz={b} onOpen={() => { trackFeatured(b.id, 'click', 'strip'); onOpen(b) }} />)}
          </div>
        </>
      )}

      {/* local favs */}
      {favs.length > 0 && (
        <>
          <div style={{ padding: '0 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#221C19' }}>{en ? 'Local favorites' : 'Favoritos locales'}</div>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#E8505B' }}>{en ? 'See all' : 'Ver todo'}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, padding: '0 16px 24px', overflowX: 'auto' }}>
            {favs.map(b => <MiniCard key={b.id} biz={b} mode={mode} onOpen={() => onOpen(b)} />)}
          </div>
        </>
      )}

      {/* new & worth it */}
      {newer.length > 0 && (
        <>
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#221C19' }}>{en ? 'New & worth it' : 'Nuevos y que valen'}</div>
          </div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {newer.map(b => (
              <OptionCard key={b.id} biz={b} mode={mode} onOpen={() => onOpen(b)} onBook={() => onBook(b)} />
            ))}
          </div>
        </>
      )}

      {/* empty state */}
      {filteredBiz.length === 0 && (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: '#A89E94' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#221C19', marginBottom: 6 }}>
            {en ? 'No places in this category yet' : 'Sin lugares en esta categoría'}
          </div>
          <div style={{ fontSize: 14 }}>{en ? 'Try another filter or ask Reva directly.' : 'Prueba otro filtro o pregúntale a Reva.'}</div>
        </div>
      )}
    </div>
  )
}

// ── Business Detail (full-screen) ──────────────────────────
// Etiqueta bilingüe del tipo de oferta (los valores viven en español en la BD).
function OFFER_TYPE_LABEL(type: string, en: boolean): string {
  const map: Record<string, string> = { 'Descuento': 'Discount', '2x1': '2-for-1', 'Regalo': 'Gift', 'Precio especial': 'Special price' }
  return en ? (map[type] ?? type) : type
}

function BizDetail({ biz, mode, onClose, onBook, onMessage }: { biz: Business; mode: Mode; onClose: () => void; onBook: (service?: Service) => void; onMessage: () => void }) {
  const en = useContext(LangContext) === 'en'
  const { catalog } = useContext(BizDataContext)
  const services = catalog[biz.id] ?? []
  const [selected, setSelected] = useState<Service | null>(null)
  const [cat, setCat] = useState<string>('all')
  const [showAll, setShowAll] = useState(false)
  const cats = [...new Set(services.map(s => s.category))]
  const filtered = cat === 'all' ? services : services.filter(s => s.category === cat)
  const LIMIT = 4
  const visible = showAll ? filtered : filtered.slice(0, LIMIT)
  const hidden = filtered.length - visible.length
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: '#FAF5EE', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        {/* hero */}
        <div style={{ height: 290, background: biz.img ? `center/cover no-repeat url(${biz.img})` : `linear-gradient(135deg,${biz.grad[0]},${biz.grad[1]})`, position: 'relative' }}>
          {!biz.img && <span style={{ position: 'absolute', right: -10, bottom: -16, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 220, opacity: .14, color: '#fff', lineHeight: 1 }}>{biz.mono}</span>}
          <button onClick={onClose} style={{ position: 'absolute', top: 'max(56px, calc(env(safe-area-inset-top) + 20px))', left: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.92)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <Icon n="chevL" size={20} color="#221C19" />
          </button>
          <button style={{ position: 'absolute', top: 'max(56px, calc(env(safe-area-inset-top) + 20px))', right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.92)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <Icon n="heart" size={19} color="#E8505B" />
          </button>
        </div>

        {/* body */}
        <div style={{ background: '#FAF5EE', borderRadius: '24px 24px 0 0', marginTop: -24, position: 'relative', padding: '22px 18px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 25, color: '#221C19', lineHeight: 1.1 }}>{biz.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#6B615A', fontSize: 13.5 }}>
                <Icon n="pin" size={14} color="#A89E94" /> {biz.hood} · {biz.dist} km
              </div>
            </div>
            <Stars rating={biz.rating} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6B615A', background: '#F3EADD', padding: '7px 13px', borderRadius: 999 }}>{biz.type}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6B615A', background: '#F3EADD', padding: '7px 13px', borderRadius: 999 }}>🕐 {biz.hours}</span>
            {biz.localFav && <span style={{ fontSize: 13, fontWeight: 700, color: '#1F8A6D', background: '#DDF0E8', padding: '7px 13px', borderRadius: 999 }}>★ Local fav</span>}
          </div>

          <p style={{ fontSize: 15.5, lineHeight: 1.5, color: '#221C19', marginTop: 18 }}>{en ? biz.en : biz.es}</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {biz.tags.map(t => <span key={t} style={{ fontSize: 13, fontWeight: 600, color: '#6B615A', background: '#F3EADD', padding: '7px 13px', borderRadius: 999 }}>{t}</span>)}
          </div>

          {/* promociones/ofertas del negocio */}
          {biz.offers && biz.offers.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#221C19', marginBottom: 12 }}>
                {en ? 'Promotions' : 'Promociones'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {biz.offers.map(o => (
                  <div key={o.id} style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 16, overflow: 'hidden' }}>
                    {o.imageUrl && <div style={{ height: 130, background: `center/cover no-repeat url(${o.imageUrl})` }} />}
                    <div style={{ padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#B5472F', background: '#FCE9E7', padding: '3px 9px', borderRadius: 999 }}>{OFFER_TYPE_LABEL(o.type, en)}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#221C19' }}>{o.title}</div>
                      {o.detail && <div style={{ fontSize: 13.5, color: '#6B615A', marginTop: 3 }}>{o.detail}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, color: '#A89E94' }}>
                        <Icon n="clock" size={14} color="#A89E94" />
                        <span style={{ fontSize: 12.5, color: '#6B615A' }}>{promoWindowLabel(o, en)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* services — selectable */}
          {services.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#221C19' }}>
                  {en ? 'Services' : 'Servicios'}
                </div>
                {services.length > LIMIT && <span style={{ fontSize: 13, fontWeight: 600, color: '#A89E94' }}>{services.length}</span>}
              </div>
              <div style={{ fontSize: 13.5, color: '#6B615A', marginTop: 2, marginBottom: 12 }}>
                {en ? 'Pick one — Reva books it for you.' : 'Elige uno — Reva te lo reserva.'}
              </div>

              {/* category filter chips */}
              {cats.length > 1 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12, scrollbarWidth: 'none' }}>
                  {[{ id: 'all', label: en ? 'All' : 'Todos' }, ...cats.map(c => ({ id: c, label: c }))].map(c => {
                    const on = cat === c.id
                    return (
                      <button key={c.id} onClick={() => { setCat(c.id); setShowAll(false) }}
                        style={{ flexShrink: 0, padding: '8px 15px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', border: 'none', background: on ? '#E8505B' : '#F3EADD', color: on ? '#fff' : '#6B615A', transition: 'background .15s' }}>
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visible.map(s => {
                  const on = selected?.id === s.id
                  const available = inStock(s)
                  return (
                    <button key={s.id} disabled={!available} onClick={() => setSelected(on ? null : s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%', cursor: available ? 'pointer' : 'not-allowed', opacity: available ? 1 : .6, background: on ? '#FCE9E7' : '#fff', border: on ? '1.5px solid #E8505B' : '1px solid #E9E0D5', borderRadius: 16, padding: '11px 12px', fontFamily: 'var(--font-ui)', transition: 'background .15s, border-color .15s' }}>
                      <div style={{ width: 46, height: 46, borderRadius: 11, flexShrink: 0, background: `linear-gradient(140deg,${s.grad[0]},${s.grad[1]})`, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.85)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19 }}>{biz.mono}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#221C19' }}>{s.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 12.5, color: '#6B615A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{s.sub}</span>
                          {!available && <span style={{ flexShrink: 0, whiteSpace: 'nowrap', fontSize: 10, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: '#B5472F', background: '#F0D9D5', padding: '2px 7px', borderRadius: 999 }}>{en ? 'Sold out' : 'Agotado'}</span>}
                          {available && tracksStock(s) && (s.stock as number) <= 3 && <span style={{ flexShrink: 0, whiteSpace: 'nowrap', fontSize: 10, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', color: '#9A6410', background: '#F7ECD5', padding: '2px 7px', borderRadius: 999 }}>{en ? `${s.stock} left` : `Quedan ${s.stock}`}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#221C19' }}>{s.price}</span>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', border: on ? 'none' : '1.5px solid #E9E0D5', background: on ? '#E8505B' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          {on && <Icon n="check" size={13} color="#fff" />}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* show more / less */}
              {filtered.length > LIMIT && (
                <button onClick={() => setShowAll(v => !v)}
                  style={{ width: '100%', marginTop: 10, padding: '12px 0', background: 'transparent', border: '1px solid #E9E0D5', borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, color: '#D23B47', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {showAll ? (en ? 'Show less' : 'Ver menos') : (en ? `Show all ${filtered.length}` : `Ver los ${filtered.length} servicios`)}
                  <Icon n={showAll ? 'chevUp' : 'chevDown'} size={15} color="#D23B47" />
                </button>
              )}
            </div>
          )}

          {/* hours row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, padding: '14px 16px', background: '#fff', borderRadius: 16, border: '1px solid #E9E0D5' }}>
            <Icon n="clock" size={18} color="#E8505B" />
            <span style={{ fontSize: 14.5, color: '#221C19' }}>{en ? 'Hours' : 'Horario'}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#221C19', fontSize: 14.5 }}>{biz.hours}</span>
          </div>

          {/* trust */}
          <div style={{ display: 'flex', gap: 14, marginTop: 20, padding: '14px 16px', background: '#DDF0E8', borderRadius: 16 }}>
            <Icon n="shield" size={20} color="#1F8A6D" />
            <div style={{ fontSize: 13, color: '#16614c', lineHeight: 1.4 }}>
              {en ? 'Free cancellation up to 2h before · Secure payment · Confirmed in real time by Reva.' : 'Cancelación gratis hasta 2h antes · Pago seguro · Confirmado en tiempo real por Reva.'}
            </div>
          </div>

          {/* reviews */}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#221C19', marginTop: 24, marginBottom: 12 }}>
            {en ? 'What locals say' : 'Lo que dicen los locales'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {biz.reviews.map((r, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#F3EADD', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#6B615A' }}>{r.who[0]}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#221C19' }}>{r.who}</span>
                  {r.es && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1F8A6D', background: '#DDF0E8', padding: '2px 7px', borderRadius: 999 }}>LOCAL</span>}
                </div>
                <div style={{ fontSize: 14.5, color: '#221C19', lineHeight: 1.4 }}>"{r.txt}"</div>
              </div>
            ))}
          </div>
          <div style={{ height: 16 }} />
        </div>
      </div>

      {/* sticky CTA */}
      <div style={{ padding: '12px 18px 28px', background: 'rgba(250,245,238,.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #F1EADF', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#A89E94', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected ? selected.name : (en ? 'from' : 'desde')}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#221C19', whiteSpace: 'nowrap' }}>{selected ? selected.price : `${'$'.repeat(biz.price)} · ${biz.cat}`}</div>
        </div>
        <button onClick={onMessage} aria-label={en ? 'Message' : 'Mensaje'}
          style={{ flexShrink: 0, width: 50, height: 50, background: '#fff', color: '#221C19', border: '1px solid #E9E0D5', borderRadius: 16, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
          <Icon n="chat" size={20} color="#221C19" />
        </button>
        <button onClick={() => onBook(selected ?? undefined)}
          style={{ flex: 1, background: '#E8505B', color: '#fff', border: 'none', borderRadius: 16, padding: '14px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon n="spark" size={17} color="#fff" />
          {selected ? (en ? 'Reserve' : 'Reservar') : (en ? 'Reserve with Reva' : 'Reservar con Reva')}
        </button>
      </div>
    </div>
  )
}

// ── Booking Sheet ──────────────────────────────────────────
function Booking({ biz, mode, service, onClose, onConfirm }: { biz: Business; mode: Mode; service?: Service; onClose: () => void; onConfirm: (bk: Booking) => void }) {
  const en = useContext(LangContext) === 'en'
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select')
  const [slot, setSlot] = useState('')
  const [party, setParty] = useState(2)
  const days = upcomingDays(4, en)
  // Start on the first day this service is actually offered.
  const [dayIdx, setDayIdx] = useState(() => Math.max(0, days.findIndex(d => dayOffered(service, d.dow))))
  // Time slots: when the chosen service has a duration, generate them from its
  // hours (per-service override or the business hours); else fall back to curated.
  const genSlots = service?.duration ? slotsFromHours(service.hours || biz.hours, service.duration) : []
  const slots = genSlots.length ? genSlots : biz.slots
  // Cross-reference the business agenda to mark already-booked times for the
  // selected day. Timed services use overlap; tables use exact-time match.
  const avail = slotAvailability(biz.id, dayIdx, slots, service?.duration)
  const freeCount = avail.filter(a => !a.taken).length
  // Does this service use a calendar (date + time)? Products/quotes don't.
  const scheduled = isScheduled(service)
  // Con inventario agotado no se puede confirmar la solicitud.
  const available = inStock(service)
  const canConfirm = available && (!scheduled || !!slot)

  async function doConfirm() {
    setStep('confirm')
    try {
      await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bizId: biz.id, bizName: biz.name, userRequest: service ? `${scheduled ? 'Reserve' : 'Request'} ${service.name} at ${biz.name}` : `Reserve at ${biz.name}`, service: service?.name, servicePrice: service?.price, partySize: party, preferredTime: scheduled ? slot : '', preferredDate: scheduled ? days[dayIdx].iso : '', scheduled, mode }),
      })
    } catch { /* proceed */ }
    // Persiste la reserva real (el usuario ya tiene sesión: tryBook lo garantiza).
    // service.id sólo se envía si es un uuid real de la BD (no un slug demo).
    try {
      const isUuid = !!service?.id && /^[0-9a-f-]{36}$/i.test(service.id)
      const slotIso = scheduled && slot ? `${days[dayIdx].iso}T${slot}:00` : null
      await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biz_id: biz.id,
          service_id: isUuid ? service!.id : null,
          slot: slotIso,
          party,
          notes: service?.name ?? null,
          deposit_amount: 0,
        }),
      })
    } catch { /* la confirmación local sigue mostrándose */ }
    setStep('success')
    setTimeout(() => onConfirm({ biz, date: scheduled ? days[dayIdx].label : '', time: scheduled ? slot : '', party, service }), 2500)
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ background: '#FAF5EE', borderRadius: '30px 30px 0 0', padding: '20px 20px calc(40px + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
        {step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DDF0E8', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icon n="check" size={30} color="#1F8A6D" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#221C19', marginBottom: 4 }}>
              {scheduled ? (en ? 'Booked!' : '¡Reservado!') : (en ? 'Request sent!' : '¡Solicitud enviada!')}
            </h3>
            <p style={{ fontSize: 14, color: '#6B615A' }}>{[biz.name, scheduled ? slot : null, `${party} ${en ? 'guests' : 'personas'}`].filter(Boolean).join(' · ')}</p>
          </div>
        ) : step === 'confirm' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FCE9E7', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Avatar size={32} />
            </div>
            <p style={{ fontWeight: 600, fontSize: 15, color: '#6B615A' }}>
              {en ? 'Reva is confirming with the business…' : 'Reva está confirmando con el negocio…'}
            </p>
          </div>
        ) : (
          <>
            {/* biz strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `linear-gradient(140deg,${biz.grad[0]},${biz.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>{biz.mono}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#221C19' }}>{biz.name}</div>
                  <div style={{ fontSize: 13, color: '#6B615A' }}>{biz.hood}</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#A89E94', fontSize: 22 }}>×</button>
            </div>

            {service && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '12px 14px', background: '#fff', border: '1px solid #E9E0D5', borderRadius: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `linear-gradient(140deg,${service.grad[0]},${service.grad[1]})` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#221C19' }}>{service.name}</div>
                  <div style={{ fontSize: 12.5, color: '#6B615A' }}>{service.sub}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#221C19', flexShrink: 0 }}>{service.price}</span>
              </div>
            )}

            {scheduled ? (<>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#A89E94', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
              {en ? 'Date' : 'Fecha'}
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {days.map((d, i) => {
                const off = !dayOffered(service, d.dow)
                return (
                  <button key={d.iso} disabled={off} onClick={() => { setDayIdx(i); setSlot('') }}
                    style={{ flex: 1, padding: '10px 4px', borderRadius: 13, cursor: off ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, border: dayIdx === i ? '1.5px solid #E8505B' : '1px solid #E9E0D5', background: off ? '#F1EADF' : (dayIdx === i ? '#FCE9E7' : '#fff'), color: off ? '#C8BFB8' : (dayIdx === i ? '#D23B47' : '#221C19'), textDecoration: off ? 'line-through' : 'none' }}>
                    {d.label}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#A89E94', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {en ? 'Time' : 'Hora'}
              </p>
              <span style={{ fontSize: 11.5, color: '#A89E94' }}>
                {service?.duration && genSlots.length > 0 ? `${biz.hours} · ${service.duration} min · ` : ''}
                {freeCount} {en ? (freeCount === 1 ? 'free' : 'free') : (freeCount === 1 ? 'libre' : 'libres')}
              </span>
            </div>
            {freeCount === 0 ? (
              <div style={{ marginBottom: 18, padding: '14px 16px', background: '#FBEFD7', borderRadius: 13, fontSize: 13, color: '#9A6C1C' }}>
                {en ? 'No times left this day — try another date.' : 'Sin horarios este día — prueba otra fecha.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                {avail.map(({ time, taken }) => (
                  <button key={time} disabled={taken} onClick={() => setSlot(time)}
                    style={{ padding: '10px 18px', borderRadius: 13, fontSize: 14, fontWeight: 600, cursor: taken ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', border: slot === time ? '1.5px solid #E8505B' : '1px solid #E9E0D5', background: taken ? '#F1EADF' : (slot === time ? '#FCE9E7' : '#fff'), color: taken ? '#C8BFB8' : (slot === time ? '#D23B47' : '#221C19'), textDecoration: taken ? 'line-through' : 'none' }}>
                    {time}
                  </button>
                ))}
              </div>
            )}
            </>) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18, fontSize: 12.5, color: '#1F8A6D', background: '#DDF0E8', padding: '12px 14px', borderRadius: 13, lineHeight: 1.45 }}>
                <Icon n="spark" size={15} color="#1F8A6D" /> {en ? 'No fixed schedule — Reva coordinates the details with you.' : 'Sin horario fijo — Reva coordina los detalles contigo.'}
              </div>
            )}

            <p style={{ fontSize: 12, fontWeight: 700, color: '#A89E94', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
              {en ? 'Party' : 'Personas'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <button onClick={() => setParty(Math.max(1, party - 1))} style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid #E9E0D5', background: '#fff', fontSize: 22, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#221C19' }}>−</button>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: '#221C19', minWidth: 28, textAlign: 'center' }}>{party}</span>
              <button onClick={() => setParty(Math.min(12, party + 1))} style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid #E9E0D5', background: '#fff', fontSize: 22, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#221C19' }}>+</button>
              <span style={{ fontSize: 14, color: '#6B615A' }}>{en ? (party === 1 ? 'guest' : 'guests') : (party === 1 ? 'persona' : 'personas')}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, fontSize: 12.5, color: '#1F8A6D', background: '#DDF0E8', padding: '11px 14px', borderRadius: 13 }}>
              <Icon n="shield" size={15} color="#1F8A6D" /> {en ? 'No charge now — free cancellation up to 2h before.' : 'Sin cargo ahora — cancelación gratis hasta 2h antes.'}
            </div>

            <button onClick={doConfirm} disabled={!canConfirm}
              style={{ width: '100%', background: canConfirm ? '#E8505B' : '#E9E0D5', color: '#fff', border: 'none', borderRadius: 999, padding: '15px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, cursor: canConfirm ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon n="spark" size={18} color="#fff" />
              {!available ? (en ? 'Sold out' : 'Agotado') : scheduled ? (en ? 'Confirm with Reva' : 'Confirmar con Reva') : (en ? 'Request with Reva' : 'Solicitar con Reva')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Rove ───────────────────────────────────────────────────
function Countdown() {
  const [time, setTime] = useState({ d: 2, h: 14, m: 6 })
  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { d, h, m } = prev
        m--; if (m < 0) { m = 59; h-- }; if (h < 0) { h = 23; d-- }
        return { d: Math.max(0, d), h: Math.max(0, h), m: Math.max(0, m) }
      })
    }, 60000)
    return () => clearInterval(t)
  }, [])
  return <span style={{ fontWeight: 700, fontSize: 15, color: '#221C19' }}>{time.d}d · {time.h}h · {String(time.m).padStart(2, '0')}m</span>
}

function Rove({ mode, onModeToggle, onBell, onMsg, isRegistered, onRegister, onLogin }: { mode: Mode; onModeToggle: () => void; onBell: () => void; onMsg: () => void; isRegistered: boolean; onRegister: () => void; onLogin: () => void }) {
  const en = useContext(LangContext) === 'en'

  if (!isRegistered) {
    return (
      <div style={{ height: '100%', background: '#FAF5EE', display: 'flex', flexDirection: 'column' }}>
        <AppHeader mode={mode} title="Reva+" hasNotif={false} onModeToggle={onModeToggle} onBell={onBell} onMsg={onMsg} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px 48px', gap: 20, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FDF3E1', display: 'grid', placeItems: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E7A33C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h2M20 12h2M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /><circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21, color: '#221C19', margin: '0 0 8px' }}>
              {en ? 'Reva+ Rewards' : 'Reva+ Rewards'}
            </p>
            <p style={{ fontSize: 14.5, color: '#6B615A', lineHeight: 1.5, margin: 0 }}>
              {en
                ? 'Create an account to earn tickets, unlock rewards and collect loyalty cards from your favourite spots.'
                : 'Crea una cuenta para acumular boletos, desbloquear recompensas y coleccionar tarjetas de lealtad de tus lugares favoritos.'}
            </p>
          </div>
          <button onClick={onRegister} style={{ width: '100%', padding: '15px', borderRadius: 14, background: '#E8505B', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {en ? 'Create account' : 'Crear cuenta'}
          </button>
          <button onClick={onLogin} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'transparent', border: '1.5px solid #D9D0C7', color: '#221C19', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            {en ? 'Sign in' : 'Ya tengo cuenta'}
          </button>
        </div>
      </div>
    )
  }

  // ── Balance real desde API ──────────────────────────────────────────────────
  const [tickets, setTickets] = useState(6)
  const [history, setHistory] = useState<{ id: string; amount: number; reason: string; createdAt: string }[]>([])
  const [rewards, setRewards] = useState<RoveReward[]>([])
  const [loadingBalance, setLoadingBalance] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/rove/balance').then(r => r.json()),
      fetch('/api/rove/rewards').then(r => r.json()),
    ]).then(([bal, rew]) => {
      setTickets(bal.balance ?? 6)
      setHistory(bal.history ?? [])
      setRewards(rew.rewards ?? [])
    }).catch(() => {}).finally(() => setLoadingBalance(false))
  }, [])

  // ── Tarjetas de lealtad BoomerangMe (sin cambios) ───────────────────────────
  const loyaltyCards = [
    {
      id: 'lupita', letter: 'L', color: '#C25C3C', name: 'Taco Club', biz: 'La Lupita Taco & Mezcal',
      type: 'STAMPS' as const, stamps: 10, filled: 7, serial: ROVE_SERIALS.tacoClub, program: 'stamps' as RoveProgram,
      reward: en ? 'Free pastor taco' : 'Pastor gratis',
    },
    {
      id: 'azul', letter: 'A', color: '#C25C3C', name: en ? 'Frequent Sailor' : 'Marinero Frecuente', biz: 'Cabo Azul Sunset Sail',
      type: 'POINTS' as const, points: 36, serial: ROVE_SERIALS.marinero, program: 'points' as RoveProgram,
      reward: en ? '$10 off your next sail' : '$10 en tu próximo paseo',
    },
  ]
  type LoyaltyCard = typeof loyaltyCards[number]
  const [qrCard, setQrCard] = useState<LoyaltyCard | null>(null)

  // ── Referidos ────────────────────────────────────────────────────────────────
  const [referralData, setReferralData] = useState<{ code: string; link: string; totalReferred: number; completed: number } | null>(null)
  const [showReferral, setShowReferral] = useState(false)
  const [referralCopied, setReferralCopied] = useState(false)

  useEffect(() => {
    fetch('/api/rove/referral').then(r => r.json()).then(d => setReferralData(d)).catch(() => {})
  }, [])

  function handleCopyReferral() {
    if (!referralData) return
    navigator.clipboard.writeText(referralData.link).then(() => {
      setReferralCopied(true)
      setTimeout(() => setReferralCopied(false), 2500)
    })
  }

  // ── Marketplace ─────────────────────────────────────────────────────────────
  const [selectedReward, setSelectedReward] = useState<RoveReward | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [redemption, setRedemption] = useState<RoveRedemptionResult | null>(null)

  async function handleRedeem(reward: RoveReward) {
    setRedeeming(true)
    try {
      const res = await fetch('/api/rove/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: reward.id }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error === 'insufficient_tickets' ? (en ? 'Not enough tickets' : 'Boletos insuficientes') : (en ? 'Could not redeem' : 'No se pudo canjear')); return }
      setTickets(t => t - reward.ticketCost)
      setRewards(prev => prev.map(r => r.id === reward.id && r.stock !== null ? { ...r, stock: (r.stock as number) - 1 } : r))
      setSelectedReward(null)
      setRedemption(data.redemption)
    } finally { setRedeeming(false) }
  }

  // Historial reciente derivado de la API
  const recentItems = history.slice(0, 3).map(t => {
    const labels: Record<string, { es: string; en: string; emoji: string }> = {
      reservation: { es: 'Reserva completada', en: 'Completed reservation', emoji: '🍽️' },
      review:      { es: 'Reseña publicada',   en: 'Review published',     emoji: '⭐' },
      referral:    { es: 'Referido exitoso',    en: 'Successful referral',  emoji: '👥' },
      weekly_bonus:{ es: 'Bono semanal',        en: 'Weekly bonus',         emoji: '🎫' },
      redemption:  { es: 'Canje de recompensa', en: 'Reward redeemed',      emoji: '🎁' },
    }
    const l = labels[t.reason] ?? labels.weekly_bonus
    const d = new Date(t.createdAt)
    const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0)
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
    const day = diff === 0 ? (en ? 'Today' : 'Hoy') : diff === 1 ? (en ? 'Yest.' : 'Ayer') : `${diff}d`
    return { emoji: l.emoji, label: en ? l.en : l.es, pts: t.amount > 0 ? `+${t.amount}` : `${t.amount}`, day }
  })

  const EARN_ACTIONS = [
    { emoji: '🍽️', label: en ? 'Complete a reservation' : 'Completar una reserva', pts: '+2', tab: 'discover' as const },
    { emoji: '⭐', label: en ? 'Leave a review' : 'Dejar una reseña', pts: '+1', tab: 'bookings' as const },
    { emoji: '👥', label: en ? 'Refer a friend' : 'Referir un amigo', pts: '+5', tab: 'profile' as const },
  ]

  const CATEGORY_EMOJI: Record<string, string> = { food: '🍽️', experience: '🌅', discount: '🏷️', upgrade: '⭐' }
  const CATEGORY_LABEL: Record<string, { es: string; en: string }> = {
    food:       { es: 'Comida & bebida', en: 'Food & drink' },
    experience: { es: 'Experiencia',     en: 'Experience' },
    discount:   { es: 'Descuento',       en: 'Discount' },
    upgrade:    { es: 'Upgrade',         en: 'Upgrade' },
  }

  const [roveTab, setRoveTab] = useState<'recent' | 'earn'>('recent')

  return (
    <div style={{ overflowY: 'auto', height: '100%', background: '#FAF5EE', paddingBottom: 32 }}>
      {/* Header */}
      <AppHeader mode={mode} label={en ? 'Rewards' : 'Recompensas'} title="Reva+" hasNotif showModeBadge={false} onModeToggle={onModeToggle} onBell={onBell} onMsg={onMsg} />

      {/* Tarjeta de boletos — más compacta */}
      <div style={{ margin: '0 16px 20px', borderRadius: 22, overflow: 'hidden', background: 'linear-gradient(135deg,#E7A33C,#C87A28)', position: 'relative', padding: '16px 20px 18px', color: '#fff' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
        <div style={{ position: 'absolute', right: 20, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Icon n="ticket" size={13} color="rgba(255,255,255,.8)" />
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', opacity: .85 }}>ROVE · REWARDS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1, opacity: loadingBalance ? .4 : 1, transition: 'opacity .3s' }}>{tickets}</span>
              <span style={{ fontSize: 16, fontWeight: 600, opacity: .8, paddingBottom: 6 }}>{en ? 'tickets' : 'boletos'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 11.5, opacity: .85, textAlign: 'right', maxWidth: 130, lineHeight: 1.4 }}>
              {en ? 'Use them in the marketplace' : 'Úsalos en el marketplace'}
            </span>
          </div>
        </div>
      </div>

      {/* Marketplace — carrusel horizontal */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: '#A89E94', textTransform: 'uppercase', marginBottom: 10, padding: '0 16px' }}>
          {en ? 'Rewards marketplace' : 'Marketplace de recompensas'}
        </p>
        {rewards.length === 0 ? (
          <div style={{ margin: '0 16px', background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, padding: '24px 20px', textAlign: 'center', color: '#A89E94', fontSize: 14 }}>
            {en ? 'No rewards available right now' : 'No hay recompensas disponibles por ahora'}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 20px 8px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {rewards.map(reward => {
              const canAfford = tickets >= reward.ticketCost
              const catEmoji = CATEGORY_EMOJI[reward.category] ?? '🎁'
              const catLabel = (CATEGORY_LABEL[reward.category] ?? { es: reward.category, en: reward.category })[en ? 'en' : 'es']
              return (
                <button
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
                  style={{ flexShrink: 0, width: 160, textAlign: 'left', border: '1px solid #E9E0D5', borderRadius: 18, padding: '14px 14px 16px', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-ui)', opacity: canAfford ? 1 : .6, boxShadow: '0 1px 6px rgba(34,28,25,.05)', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: reward.bizColor + '22', display: 'grid', placeItems: 'center', fontSize: 24 }}>
                    {catEmoji}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#221C19', lineHeight: 1.3, marginBottom: 2 }}>{reward.title}</p>
                    <p style={{ fontSize: 11.5, color: '#6B615A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reward.bizName}</p>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9A6C1C', background: '#FBEFD7', padding: '2px 8px', borderRadius: 999 }}>{catLabel}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: canAfford ? '#E8505B' : '#A89E94', display: 'block', lineHeight: 1 }}>{reward.ticketCost}</span>
                      <span style={{ fontSize: 10, color: '#A89E94', fontWeight: 600 }}>{en ? 'tkts' : 'blt'}</span>
                    </div>
                  </div>
                  {reward.stock !== null && reward.stock <= 5 && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#C87A28', background: '#FEF3E2', padding: '2px 8px', borderRadius: 999, display: 'inline-block' }}>
                      {reward.stock} {en ? 'left' : 'restantes'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Tarjetas de lealtad BoomerangMe — scroll horizontal */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: '#A89E94', textTransform: 'uppercase', marginBottom: 10, padding: '0 16px' }}>
          {en ? 'Cards from your places' : 'Tarjetas de tus lugares'}
        </p>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 20px 8px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {loyaltyCards.map(card => (
            <button key={card.id} onClick={() => setQrCard(card)} style={{ flexShrink: 0, width: 260, textAlign: 'left', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${card.color},#8B3A24)`, borderRadius: 18, padding: '14px 16px', color: '#fff', fontFamily: 'var(--font-ui)', scrollSnapAlign: 'start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: card.type === 'STAMPS' ? 12 : 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.22)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16 }}>{card.letter}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{card.name}</p>
                    <p style={{ fontSize: 12, opacity: .8 }}>{card.biz}</p>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', background: 'rgba(255,255,255,.22)', padding: '4px 10px', borderRadius: 999 }}>{card.type}</span>
              </div>
              {card.type === 'STAMPS' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Array.from({ length: card.stamps }).map((_, i) => (
                    <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: i < card.filled ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.25)', display: 'grid', placeItems: 'center' }}>
                      {i < card.filled && <span style={{ color: card.color, fontSize: 13, fontWeight: 900 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
              {card.type === 'POINTS' && (
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginTop: 4 }}>{card.points} pts</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 11, borderTop: '1px solid rgba(255,255,255,.18)', fontSize: 12, fontWeight: 600, opacity: .9 }}>
                <Icon n="qr" size={15} color="#fff" stroke={2} />
                {en ? 'Tap to show your code at checkout' : 'Toca para mostrar tu código en caja'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reciente + Ganar boletos — tabs combinadas */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: '#EFEAD3', borderRadius: 12, padding: 3 }}>
          {(['recent', 'earn'] as const).map(tab => (
            <button key={tab} onClick={() => setRoveTab(tab)} style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: 'none', background: roveTab === tab ? '#fff' : 'transparent', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: roveTab === tab ? '#221C19' : '#A89E94', cursor: 'pointer', transition: 'all .15s', boxShadow: roveTab === tab ? '0 1px 4px rgba(34,28,25,.1)' : 'none' }}>
              {tab === 'recent' ? (en ? 'Recent' : 'Reciente') : (en ? 'Earn tickets' : 'Ganar boletos')}
            </button>
          ))}
        </div>
        {roveTab === 'recent' ? (
          recentItems.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, padding: '24px 20px', textAlign: 'center', color: '#A89E94', fontSize: 14 }}>
              {en ? 'No recent activity' : 'Sin actividad reciente'}
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
              {recentItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: i < recentItems.length - 1 ? '1px solid #F1EADF' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3E2', display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>{item.emoji}</div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#221C19' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: item.pts.startsWith('+') ? '#1F8A6D' : '#E8505B' }}>{item.pts}</span>
                    <span style={{ fontSize: 12, color: '#A89E94' }}>{item.day}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
            {EARN_ACTIONS.map((item, i, arr) => {
              const isReferral = item.tab === 'profile'
              return (
                <div
                  key={i}
                  onClick={isReferral ? () => setShowReferral(true) : undefined}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F1EADF' : 'none', cursor: isReferral ? 'pointer' : 'default' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3EADD', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{item.emoji}</div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#221C19' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#1F8A6D', fontSize: 14 }}>{item.pts}</span>
                    {isReferral && <Icon n="chevR" size={14} color="#C4B8AC" />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: detalle de recompensa + confirmar canje */}
      {selectedReward && (
        <div onClick={() => setSelectedReward(null)} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(34,28,25,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn .18s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#FAF5EE', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: '10px 22px 32px', boxShadow: '0 -10px 40px rgba(34,28,25,.25)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E0D6C8', margin: '6px auto 18px' }} />
            {/* Biz avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: selectedReward.bizColor + '33', display: 'grid', placeItems: 'center', fontSize: 24, flexShrink: 0 }}>
                {CATEGORY_EMOJI[selectedReward.category] ?? '🎁'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#221C19' }}>{selectedReward.title}</p>
                <p style={{ fontSize: 13, color: '#6B615A', marginTop: 2 }}>{selectedReward.bizName}</p>
              </div>
              <button onClick={() => setSelectedReward(null)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #E9E0D5', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                <Icon n="x" size={16} color="#6B615A" />
              </button>
            </div>
            {/* Descripción */}
            <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
              <p style={{ fontSize: 14, color: '#3D3530', lineHeight: 1.55 }}>{selectedReward.description}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#6B615A', background: '#F1EADF', padding: '4px 10px', borderRadius: 999 }}>
                  📅 {en ? `${selectedReward.validDays} days to use` : `${selectedReward.validDays} días para usar`}
                </span>
                {selectedReward.stock !== null && (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9A6C1C', background: '#FBEFD7', padding: '4px 10px', borderRadius: 999 }}>
                    {selectedReward.stock} {en ? 'available' : 'disponibles'}
                  </span>
                )}
              </div>
            </div>
            {/* Costo + balance */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #E9E0D5', borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#6B615A', fontWeight: 500 }}>{en ? 'Your balance' : 'Tu balance'}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#221C19' }}>{tickets} {en ? 'tickets' : 'boletos'}</span>
            </div>
            <button
              onClick={() => handleRedeem(selectedReward)}
              disabled={redeeming || tickets < selectedReward.ticketCost}
              style={{ width: '100%', background: tickets >= selectedReward.ticketCost ? '#E8505B' : '#E9E0D5', color: tickets >= selectedReward.ticketCost ? '#fff' : '#A89E94', border: 'none', borderRadius: 14, padding: '14px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, cursor: tickets >= selectedReward.ticketCost ? 'pointer' : 'not-allowed', opacity: redeeming ? .7 : 1 }}
            >
              {redeeming
                ? (en ? 'Redeeming…' : 'Canjeando…')
                : tickets >= selectedReward.ticketCost
                  ? (en ? `Redeem for ${selectedReward.ticketCost} tickets` : `Canjear por ${selectedReward.ticketCost} boletos`)
                  : (en ? `Need ${selectedReward.ticketCost - tickets} more tickets` : `Necesitas ${selectedReward.ticketCost - tickets} boletos más`)}
            </button>
          </div>
        </div>
      )}

      {/* Modal: código de canje generado */}
      {redemption && (
        <div onClick={() => setRedemption(null)} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(34,28,25,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn .18s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#FAF5EE', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: '10px 22px 32px', boxShadow: '0 -10px 40px rgba(34,28,25,.25)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E0D6C8', margin: '6px auto 18px' }} />
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#221C19' }}>{en ? 'Reward redeemed!' : '¡Recompensa canjeada!'}</p>
              <p style={{ fontSize: 13.5, color: '#6B615A', marginTop: 4 }}>{redemption.reward.title} · {redemption.reward.bizName}</p>
            </div>
            {/* Código */}
            <div style={{ background: '#fff', border: '2px dashed #E9E0D5', borderRadius: 20, padding: '24px 20px', textAlign: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: '#A89E94', textTransform: 'uppercase', marginBottom: 10 }}>{en ? 'Your redemption code' : 'Tu código de canje'}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: '#221C19', letterSpacing: '.12em' }}>{redemption.code}</p>
              <p style={{ fontSize: 12, color: '#A89E94', marginTop: 8 }}>
                {en ? `Valid for ${redemption.reward.validDays} days` : `Válido por ${redemption.reward.validDays} días`}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B615A', marginBottom: 18, lineHeight: 1.5 }}>
              <Icon n="info" size={15} color="#A89E94" stroke={2} />
              <span>{en ? 'Show this code to the staff at the venue. They will enter it in their scanner to validate it.' : 'Muestra este código al personal del lugar. Lo ingresarán en su escáner para validarlo.'}</span>
            </div>
            <button onClick={() => setRedemption(null)} style={{ width: '100%', background: '#221C19', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {en ? 'Done' : 'Listo'}
            </button>
          </div>
        </div>
      )}

      {/* Modal: referir un amigo */}
      {showReferral && (
        <div onClick={() => setShowReferral(false)} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(34,28,25,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn .18s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#FAF5EE', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: '10px 22px 32px', boxShadow: '0 -10px 40px rgba(34,28,25,.25)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E0D6C8', margin: '6px auto 18px' }} />
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#221C19' }}>
                  {en ? 'Refer a friend' : 'Referir un amigo'}
                </p>
                <p style={{ fontSize: 13, color: '#6B615A', marginTop: 2 }}>
                  {en ? 'You earn 5 tickets when they complete their first booking' : 'Ganas 5 boletos cuando completen su primera reserva'}
                </p>
              </div>
              <button onClick={() => setShowReferral(false)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #E9E0D5', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon n="x" size={16} color="#6B615A" />
              </button>
            </div>

            {/* Código */}
            <div style={{ background: '#fff', border: '1.5px dashed #E9E0D5', borderRadius: 20, padding: '20px', textAlign: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#A89E94', textTransform: 'uppercase', marginBottom: 8 }}>
                {en ? 'Your referral code' : 'Tu código de referido'}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, color: '#221C19', letterSpacing: '.14em' }}>
                {referralData?.code ?? '——'}
              </p>
              {referralData && referralData.completed > 0 && (
                <p style={{ fontSize: 12, color: '#1F8A6D', fontWeight: 600, marginTop: 8 }}>
                  🎫 {referralData.completed} {en ? 'friend(s) joined — you earned' : referralData.completed === 1 ? 'amigo se unió — ganaste' : 'amigos se unieron — ganaste'} {referralData.completed * 5} {en ? 'tickets' : 'boletos'}
                </p>
              )}
            </div>

            {/* Pasos */}
            <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
              {[
                { n: '1', text: en ? 'Share your link with a friend' : 'Comparte tu enlace con un amigo' },
                { n: '2', text: en ? 'They sign up and enter your code' : 'Se registra e ingresa tu código' },
                { n: '3', text: en ? 'They complete their first booking' : 'Completa su primera reserva' },
                { n: '4', text: en ? 'You get +5 tickets 🎫' : 'Tú recibes +5 boletos 🎫' },
              ].map((s, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: i < arr.length - 1 ? 10 : 0, marginBottom: i < arr.length - 1 ? 10 : 0, borderBottom: i < arr.length - 1 ? '1px solid #F1EADF' : 'none' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FEF3E2', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: '#9A6C1C', flexShrink: 0 }}>{s.n}</div>
                  <span style={{ fontSize: 13.5, color: '#3D3530', lineHeight: 1.45 }}>{s.text}</span>
                </div>
              ))}
            </div>

            {/* Botón copiar */}
            <button
              onClick={handleCopyReferral}
              style={{ width: '100%', background: referralCopied ? '#1F8A6D' : '#221C19', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'background .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {referralCopied
                ? (en ? '✓ Link copied!' : '✓ ¡Enlace copiado!')
                : (en ? 'Copy invite link' : 'Copiar enlace de invitación')}
            </button>
          </div>
        </div>
      )}

      {/* QR reveal BoomerangMe */}
      {qrCard && (
        <div onClick={() => setQrCard(null)} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(34,28,25,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn .18s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#FAF5EE', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: '10px 22px 30px', boxShadow: '0 -10px 40px rgba(34,28,25,.25)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: '#E0D6C8', margin: '6px auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg,${qrCard.color},#8B3A24)`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>{qrCard.letter}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#221C19' }}>{qrCard.name}</p>
                <p style={{ fontSize: 12.5, color: '#6B615A' }}>{qrCard.biz}</p>
              </div>
              <button onClick={() => setQrCard(null)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #E9E0D5', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon n="x" size={16} color="#6B615A" />
              </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 22, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, boxShadow: '0 2px 12px rgba(34,28,25,.06)' }}>
              <QRImage value={roveToken({ serial: qrCard.serial, program: qrCard.program })} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#A89E94', textTransform: 'uppercase' }}>{en ? 'Card serial' : 'Folio de tarjeta'}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#221C19', letterSpacing: '.04em', marginTop: 2 }}>{qrCard.serial}</p>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #E9E0D5', borderRadius: 14, padding: '12px 15px' }}>
              <span style={{ fontSize: 13.5, color: '#6B615A', fontWeight: 500 }}>
                {qrCard.type === 'STAMPS'
                  ? (en ? `${qrCard.filled}/${qrCard.stamps} stamps` : `${qrCard.filled}/${qrCard.stamps} sellos`)
                  : (en ? `${qrCard.points} points` : `${qrCard.points} puntos`)}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#9A6C1C', background: '#FBEFD7', padding: '4px 11px', borderRadius: 999 }}>
                🎁 {qrCard.reward}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12.5, color: '#6B615A', lineHeight: 1.45 }}>
              <Icon n="info" size={15} color="#A89E94" stroke={2} />
              <span>{en ? 'Show this code to the staff — they scan it to add a stamp or redeem your reward.' : 'Muestra este código al personal — lo escanean para sumar un sello o canjear tu recompensa.'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: 11, fontWeight: 600, color: '#A89E94' }}>
              <Icon n="shield" size={12} color="#A89E94" stroke={2} /> {en ? 'Powered by BoomerangMe' : 'Con tecnología de BoomerangMe'}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  )
}

// ── Profile ────────────────────────────────────────────────
// ── Trips ──────────────────────────────────────────────────
type Booking = { biz: Business; date: string; time: string; party: number; service?: Service }

// Reserva real tal como la devuelve GET /api/reservations (con datos del negocio).
type DbReservation = {
  id: string
  biz_id: string
  slot: string | null
  party: number | null
  status: string
  notes: string | null
  businesses?: { name: string; hood: string; type: string } | null
}

function Trips({ mode, onModeToggle, onBell, onMsg }: { mode: Mode; onModeToggle: () => void; onBell: () => void; onMsg: () => void }) {
  const en = useContext(LangContext) === 'en'
  const { businesses } = useContext(BizDataContext)
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({})

  // Carga las reservas reales del usuario con sesión.
  const [rsvs, setRsvs] = useState<DbReservation[]>([])
  useEffect(() => {
    let cancelled = false
    fetch('/api/reservations')
      .then(r => r.ok ? r.json() : { reservations: [] })
      .then(d => { if (!cancelled) setRsvs(d.reservations ?? []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Convierte una reserva de BD a la forma Booking que pinta PassCard.
  const toBooking = (r: DbReservation): Booking => {
    const biz = businesses.find(b => b.id === r.biz_id)
      ?? ({ id: r.biz_id, name: r.businesses?.name ?? 'Negocio', mono: (r.businesses?.name ?? 'R').charAt(0).toUpperCase(), grad: ['#E27A52', '#B5472F'] } as Business)
    const d = r.slot ? new Date(r.slot) : null
    const date = d ? d.toLocaleDateString(en ? 'en-US' : 'es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) : ''
    const time = d ? d.toLocaleTimeString(en ? 'en-US' : 'es-MX', { hour: '2-digit', minute: '2-digit' }) : ''
    return { biz, date, time, party: r.party ?? 1, service: r.notes ? ({ name: r.notes } as Service) : undefined }
  }

  const now = Date.now()
  const isPast = (r: DbReservation) => r.status === 'completed' || r.status === 'cancelled' || (r.slot ? new Date(r.slot).getTime() < now : false)
  const upcoming = rsvs.filter(r => !isPast(r))
  const past = rsvs.filter(isPast)

  const statusOf = (r: DbReservation): { label: string; tone: 'pending' | 'ok' | 'past' } => {
    if (r.status === 'cancelled') return { label: en ? 'Cancelled' : 'Cancelada', tone: 'past' }
    if (isPast(r)) return { label: en ? 'Completed' : 'Completada', tone: 'past' }
    if (r.status === 'pending') return { label: en ? 'Pending' : 'Por confirmar', tone: 'pending' }
    return { label: en ? 'Confirmed' : 'Confirmada', tone: 'ok' }
  }

  const toneBg = { pending: '#FBEFD7', ok: '#DDF0E8', past: '#F3EADD' }
  const toneFg = { pending: '#9A6C1C', ok: '#1F8A6D', past: '#6B615A' }

  const PassCard = ({ bk, status, rid }: { bk: Booking; status: { label: string; tone: 'pending' | 'ok' | 'past' }; rid: string }) => (
    <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 10px rgba(34,28,25,.06)' }}>
      <div style={{ display: 'flex', gap: 13, padding: 15, alignItems: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, flexShrink: 0, background: `linear-gradient(140deg,${bk.biz.grad[0]},${bk.biz.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#fff' }}>
          {bk.biz.mono}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#221C19' }}>{bk.biz.name}</div>
          {bk.service && <div style={{ fontSize: 13, fontWeight: 600, color: '#221C19', marginTop: 2 }}>{bk.service.name}</div>}
          <div style={{ fontSize: 13, color: '#6B615A', marginTop: 3 }}>{[bk.date, bk.time, `${bk.party} ${en ? 'guests' : 'pers.'}`].filter(Boolean).join(' · ') || (en ? 'Reva coordinating' : 'Reva coordina')}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: toneBg[status.tone], color: toneFg[status.tone] }}>
            {status.tone !== 'pending' && <Icon n="check" size={12} color={toneFg[status.tone]} stroke={3} />}
            {status.label}
          </div>
        </div>
        {status.tone === 'ok' && <Icon n="chevR" size={18} color="#A89E94" />}
      </div>
      {status.tone === 'past' && !reviewed[rid] && (
        <div style={{ padding: '0 15px 15px' }}>
          <button onClick={() => setReviewed(r => ({ ...r, [rid]: true }))}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, borderRadius: 13, border: 'none', cursor: 'pointer', background: '#FBEFD7', color: '#9A6C1C', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14 }}>
            <Icon n="star" size={16} color="#9A6C1C" fill="#9A6C1C" />
            {en ? 'How was it? Leave a review' : '¿Cómo te fue? Deja tu reseña'}
          </button>
        </div>
      )}
      {status.tone === 'past' && reviewed[rid] && (
        <div style={{ margin: '0 15px 15px', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', background: '#DDF0E8', borderRadius: 13, fontSize: 13, fontWeight: 600, color: '#16614c' }}>
          <Icon n="check" size={15} color="#1F8A6D" stroke={3} /> {en ? 'Review published — thanks!' : 'Reseña publicada — ¡gracias!'}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ overflowY: 'auto', height: '100%', background: '#FAF5EE' }}>
      <AppHeader mode={mode} title={en ? 'Trips' : 'Reservas'} hasNotif showModeBadge={false} onModeToggle={onModeToggle} onBell={onBell} onMsg={onMsg} />
      <div style={{ padding: '0 16px 32px' }}>
        {rsvs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F3EADD', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icon n="cal" size={28} color="#A89E94" />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#221C19' }}>{en ? 'No reservations yet' : 'Aún sin reservas'}</p>
            <p style={{ fontSize: 14, color: '#6B615A', marginTop: 6, lineHeight: 1.5 }}>{en ? 'Ask Reva and your bookings show up here.' : 'Pídele a Reva y tus reservas aparecen aquí.'}</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#A89E94', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>{en ? 'Upcoming' : 'Próximas'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {upcoming.map(r => <PassCard key={r.id} rid={r.id} bk={toBooking(r)} status={statusOf(r)} />)}
                </div>
              </>
            )}
            {past.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#A89E94', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>{en ? 'Past' : 'Pasadas'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {past.map(r => <PassCard key={r.id} rid={r.id} bk={toBooking(r)} status={statusOf(r)} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Profile ────────────────────────────────────────────────
// ── Profile sub-pages ──────────────────────────────────────
type ProfilePageId = 'idioma' | 'pago' | 'notif' | 'cancelacion' | 'ayuda'

function PageShell({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#FAF5EE', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'max(54px, calc(env(safe-area-inset-top) + 18px)) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, background: '#FAF5EE', flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #E9E0D5', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon n="chevL" size={18} color="#221C19" />
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#221C19', letterSpacing: '-.02em' }}>{title}</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 16px 32px' }}>{children}</div>
    </div>
  )
}

function PSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 3, background: on ? '#E8505B' : '#E9E0D5', transition: 'background .18s', flexShrink: 0 }}>
      <span style={{ display: 'block', width: 21, height: 21, borderRadius: '50%', background: '#fff', transform: on ? 'translateX(19px)' : 'none', transition: 'transform .18s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  )
}

function PSec({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#A89E94', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: '18px 2px 10px' }}>{children}</div>
}

function LanguagePage({ onLangChange }: { onLangChange: (l: 'es'|'en') => void }) {
  const currentLang = useContext(LangContext)
  const en = currentLang === 'en'
  const [selected, setSelected] = useState(currentLang)
  const opts = [{ id: 'es' as const, label: 'Español', sub: 'México', flag: '🇲🇽' }, { id: 'en' as const, label: 'English', sub: 'United States', flag: '🇺🇸' }]

  const handleSelect = (l: 'es'|'en') => {
    setSelected(l)
    onLangChange(l)
  }

  return (
    <div>
      <PSec>{en ? 'App language' : 'Idioma de la app'}</PSec>
      <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
        {opts.map((o, i) => (
          <button key={o.id} onClick={() => handleSelect(o.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', border: 'none', borderTop: i ? '1px solid #F1EADF' : 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{o.flag}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: '#221C19' }}>{o.label}</span>
              <span style={{ display: 'block', fontSize: 13, color: '#6B615A', marginTop: 1 }}>{o.sub}</span>
            </span>
            {selected === o.id && <Icon n="check" size={19} color="#E8505B" stroke={3} />}
          </button>
        ))}
      </div>
      <PSec>{en ? 'Region & currency' : 'Región y moneda'}</PSec>
      <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <Icon n="pin" size={18} color="#A89E94" />
          <span style={{ flex: 1, fontSize: 15, color: '#221C19' }}>{en ? 'Region' : 'Región'}</span>
          <span style={{ fontSize: 14, color: '#6B615A' }}>Los Cabos, BCS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderTop: '1px solid #F1EADF' }}>
          <Icon n="info" size={18} color="#A89E94" />
          <span style={{ flex: 1, fontSize: 15, color: '#221C19' }}>{en ? 'Currency' : 'Moneda'}</span>
          <span style={{ fontSize: 14, color: '#6B615A' }}>MXN ($)</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 16, padding: '13px 15px', borderRadius: 14, background: '#FBEFD7', fontSize: 12.5, color: '#9A6C1C', lineHeight: 1.45 }}>
        <Icon n="spark" size={14} color="#9A6C1C" fill="#9A6C1C" />
        {en ? 'Reva replies in your language and shows prices in your currency.' : 'Reva te responde en tu idioma y muestra precios en tu moneda.'}
      </div>
    </div>
  )
}

function PaymentPage({ en }: { en: boolean }) {
  const [methods, setMethods] = useState(en
    ? [{ label: 'Visa', sub: '•••• 4242' }, { label: 'Apple Pay', sub: 'iPhone' }]
    : [{ label: 'Mercado Pago', sub: 'daniela@correo.com' }, { label: 'Visa', sub: '•••• 8810' }])
  const [def, setDef] = useState(0)
  return (
    <div>
      <PSec>{en ? 'Payment methods' : 'Métodos de pago'}</PSec>
      <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
        {methods.map((m, i) => (
          <button key={i} onClick={() => setDef(i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', border: 'none', borderTop: i ? '1px solid #F1EADF' : 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
            <div style={{ width: 40, height: 28, background: '#1B2436', borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>{m.label === 'Apple Pay' ? '  ' : m.label === 'Mercado Pago' ? 'MP' : 'VISA'}</span>
            </div>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#221C19' }}>{m.label}</span>
                {def === i && <span style={{ fontSize: 10, fontWeight: 700, color: '#D23B47', background: '#FCE9E7', padding: '2px 8px', borderRadius: 999 }}>{en ? 'DEFAULT' : 'PRINCIPAL'}</span>}
              </span>
              <span style={{ display: 'block', fontSize: 13, color: '#6B615A', marginTop: 1 }}>{m.sub}</span>
            </span>
            <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${def === i ? '#E8505B' : '#E9E0D5'}`, background: def === i ? '#E8505B' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              {def === i && <Icon n="check" size={12} color="#fff" stroke={3} />}
            </span>
          </button>
        ))}
      </div>
      <button onClick={() => setMethods(m => [...m, { label: 'New card', sub: '•••• ••••' }])}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 14, borderRadius: 14, border: '1.5px dashed #E9E0D5', background: 'transparent', cursor: 'pointer', color: '#6B615A', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14 }}>
        + {en ? 'Add payment method' : 'Agregar método de pago'}
      </button>
      <PSec>{en ? 'Reva charges' : 'Cómo cobra Reva'}</PSec>
      <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, padding: '15px 16px', fontSize: 13.5, color: '#6B615A', lineHeight: 1.55 }}>
        {en ? "Reva only charges deposits when a business requires one to hold your booking. It’s credited to your final bill." : 'Reva solo cobra anticipos cuando un negocio lo pide para apartar tu reserva. Se abona a tu cuenta final.'}
      </div>
    </div>
  )
}

function NotifPage({ en }: { en: boolean }) {
  const init = en
    ? [['Bookings & reminders', true], ['Business messages', true], ['Promotions & cards', true], ['Reva+ draws', false], ['News from Reva', false]]
    : [['Reservas y recordatorios', true], ['Mensajes de negocios', true], ['Promociones y tarjetas', true], ['Sorteos Reva+', false], ['Novedades de Reva', false]]
  const [rows, setRows] = useState<[string, boolean][]>(init as [string, boolean][])
  const [channels, setChannels] = useState({ push: true, email: true, sms: false })
  return (
    <div>
      <PSec>{en ? 'What to notify' : 'Qué notificar'}</PSec>
      <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', borderTop: i ? '1px solid #F1EADF' : 'none' }}>
            <span style={{ flex: 1, fontSize: 15, color: '#221C19' }}>{r[0]}</span>
            <PSwitch on={r[1]} onClick={() => setRows(rs => rs.map((x, j) => j === i ? [x[0], !x[1]] as [string, boolean] : x))} />
          </div>
        ))}
      </div>
      <PSec>{en ? 'Channels' : 'Canales'}</PSec>
      <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
        {([['push', en ? 'Push' : 'Push', 'bell'], ['email', en ? 'Email' : 'Correo', 'chat'], ['sms', 'SMS', 'info']] as const).map(([k, lbl, ic], i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', borderTop: i ? '1px solid #F1EADF' : 'none' }}>
            <Icon n={ic} size={18} color="#A89E94" />
            <span style={{ flex: 1, fontSize: 15, color: '#221C19' }}>{lbl}</span>
            <PSwitch on={channels[k as keyof typeof channels]} onClick={() => setChannels(c => ({ ...c, [k]: !c[k as keyof typeof channels] }))} />
          </div>
        ))}
      </div>
    </div>
  )
}

function CancelPage({ en }: { en: boolean }) {
  const tiers = en
    ? [{ ic: 'check' as const, c: '#1F8A6D', bg: '#DDF0E8', t: 'More than 24h before', d: 'Free cancellation. Any deposit is fully refunded to your payment method.' },
       { ic: 'clock' as const, c: '#9A6C1C', bg: '#FBEFD7', t: 'Between 24h and 2h before', d: 'Deposit is held as credit — use it on your next booking at the same place within 60 days.' },
       { ic: 'info' as const, c: '#D23B47', bg: '#FCE9E7', t: 'Less than 2h before / no-show', d: 'Deposit is non-refundable. The business keeps it to cover the held spot.' }]
    : [{ ic: 'check' as const, c: '#1F8A6D', bg: '#DDF0E8', t: 'Más de 24h antes', d: 'Cancelación gratis. Cualquier anticipo se reembolsa completo a tu método de pago.' },
       { ic: 'clock' as const, c: '#9A6C1C', bg: '#FBEFD7', t: 'Entre 24h y 2h antes', d: 'El anticipo queda como saldo — úsalo en tu próxima reserva en el mismo lugar dentro de 60 días.' },
       { ic: 'info' as const, c: '#D23B47', bg: '#FCE9E7', t: 'Menos de 2h antes / no llegar', d: 'El anticipo no es reembolsable. El negocio lo conserva por el lugar apartado.' }]
  return (
    <div>
      <div style={{ fontSize: 14.5, color: '#6B615A', lineHeight: 1.55, margin: '4px 2px 6px' }}>
        {en ? 'Cancel any booking free of charge up to 24 hours before.' : 'Cancela cualquier reserva sin costo hasta 24 horas antes.'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
        {tiers.map((t, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, padding: 16, display: 'flex', gap: 13 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: t.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon n={t.ic} size={18} color={t.c} stroke={t.ic === 'check' ? 3 : 2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#221C19' }}>{t.t}</div>
              <div style={{ fontSize: 13.5, color: '#6B615A', marginTop: 4, lineHeight: 1.5 }}>{t.d}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 16, padding: '13px 15px', borderRadius: 14, background: '#F3EADD', fontSize: 12.5, color: '#6B615A', lineHeight: 1.45 }}>
        <Icon n="spark" size={14} color="#6B615A" />
        {en ? 'Need to cancel? Just tell Reva — she handles it.' : '¿Necesitas cancelar? Solo dile a Reva — ella lo gestiona.'}
      </div>
    </div>
  )
}

function SupportChatScreen({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const en = useContext(LangContext) === 'en'
  const [msgs, setMsgs] = useState<{ from: 'user' | 'reva'; txt: string }[]>([
    { from: 'reva', txt: en ? "Hi! I'm Reva support. How can I help you today?" : '¡Hola! Soy el soporte de Reva. ¿En qué te puedo ayudar hoy?' }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [msgs, sending])

  async function send() {
    const t = input.trim(); if (!t || sending) return
    setInput('')
    setMsgs(m => [...m, { from: 'user', txt: t }])
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: t }], mode }),
      })
      if (!res.ok || !res.body) throw new Error('api')
      setMsgs(m => [...m, { from: 'reva', txt: '' }])
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let acc = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim(); if (data === '[DONE]') break
          try { const delta: string = JSON.parse(data).choices?.[0]?.delta?.content ?? ''; if (delta) { acc += delta; setMsgs(m => { const c = [...m]; c[c.length - 1] = { from: 'reva', txt: acc }; return c }) } } catch { /**/ }
        }
      }
      if (!acc) throw new Error('empty')
    } catch {
      setMsgs(m => [...m, { from: 'reva', txt: en ? 'Your message was received — the Reva team will follow up soon. 🙌' : 'Tu mensaje fue recibido — el equipo de Reva te dará seguimiento pronto. 🙌' }])
    } finally { setSending(false) }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#FAF5EE', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'max(54px, calc(env(safe-area-inset-top) + 18px)) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, background: '#FAF5EE', flexShrink: 0, borderBottom: '1px solid #F1EADF' }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #E9E0D5', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon n="chevL" size={18} color="#221C19" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#221C19' }}>{en ? 'Reva Support' : 'Soporte Reva'}</div>
          <div style={{ fontSize: 12, color: '#1F8A6D', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1F8A6D', flexShrink: 0 }} />
            {en ? 'Usually replies instantly' : 'Suele responder al instante'}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9A6C1C', background: '#FBEFD7', padding: '4px 10px', borderRadius: 999 }}>
          {en ? 'Ticket open' : 'Ticket abierto'}
        </span>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {msgs.map((m, i) => (
          m.from === 'reva' ? (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '86%' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8505B', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
                <Avatar size={18} />
              </div>
              <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: '18px 18px 18px 6px', padding: '11px 14px', fontSize: 14.5, color: '#221C19', lineHeight: 1.4 }}>
                {m.txt || <span style={{ opacity: .4 }}>…</span>}
              </div>
            </div>
          ) : (
            <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '82%', background: '#221C19', color: '#fff', borderRadius: '18px 18px 6px 18px', padding: '11px 14px', fontSize: 14.5, lineHeight: 1.4 }}>{m.txt}</div>
          )
        ))}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8505B', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Avatar size={18} /></div>
            <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: '18px 18px 18px 6px', padding: '11px 14px', display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#A89E94', animation: `typing-dot 1s ${i * .16}s infinite` }} />)}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 14px 28px', borderTop: '1px solid #F1EADF', background: 'rgba(250,245,238,.95)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: '1px solid #E9E0D5', borderRadius: 999, padding: '6px 6px 6px 16px' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={en ? 'Describe your issue…' : 'Describe tu problema…'}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-ui)', fontSize: 15, color: '#221C19' }} />
          <button onClick={send} disabled={sending}
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: input.trim() && !sending ? '#E8505B' : '#F3EADD', cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'background .15s', flexShrink: 0 }}>
            <Icon n="send" size={18} color={input.trim() && !sending ? '#fff' : '#A89E94'} />
          </button>
        </div>
      </div>
    </div>
  )
}

function HelpPage({ en, onChatSupport }: { en: boolean; onChatSupport?: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const faqs = en
    ? [['How do I change a booking?', 'Open the booking in Trips and tap Reschedule, or just ask Reva to move it.'],
       ['When am I charged?', "Only deposits, and only when a business requires one. It's credited to your final bill."],
       ['What are Reva+ tickets?', 'You earn them on every booking and review. Use them to enter weekly draws for local prizes.'],
       ['Is my data shared with businesses?', 'Only your name and booking details. Your phone is shared after you confirm.']]
    : [['¿Cómo cambio una reserva?', 'Abre la reserva en Reservas y toca Reagendar, o simplemente pídele a Reva que la mueva.'],
       ['¿Cuándo me cobran?', 'Solo anticipos, y solo cuando un negocio lo pide. Se abona a tu cuenta final.'],
       ['¿Qué son los boletos Reva+?', 'Los ganas en cada reserva y reseña. Úsalos para entrar a sorteos semanales de premios locales.'],
       ['¿Comparten mis datos con los negocios?', 'Solo tu nombre y los detalles de la reserva. Tu teléfono se comparte al confirmar.']]
  return (
    <div>
      <PSec>{en ? 'Get in touch' : 'Contáctanos'}</PSec>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[{ ic: 'chat' as const, bg: '#E8505B', t: en ? 'Chat with Reva' : 'Chatear con Reva', s: en ? 'Usually replies instantly' : 'Suele responder al instante', action: onChatSupport }].map((item, i) => (
          <button key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 16, border: '1px solid #E9E0D5', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left', boxShadow: '0 2px 8px rgba(34,28,25,.06)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: item.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon n={item.ic} size={19} color="#fff" />
            </div>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700, color: '#221C19' }}>{item.t}</span>
              <span style={{ display: 'block', fontSize: 13, color: '#6B615A', marginTop: 1 }}>{item.s}</span>
            </span>
            <Icon n="chevR" size={16} color="#C8BFB8" />
          </button>
        ))}
      </div>
      <PSec>{en ? 'FAQ' : 'Preguntas frecuentes'}</PSec>
      <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
        {faqs.map((f, i) => (
          <div key={i} style={{ borderTop: i ? '1px solid #F1EADF' : 'none' }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: '#221C19' }}>{f[0]}</span>
              <span style={{ transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .18s', flexShrink: 0 }}>
                <Icon n="chevDown" size={16} color="#A89E94" />
              </span>
            </button>
            {open === i && <div style={{ padding: '0 16px 15px', fontSize: 13.5, color: '#6B615A', lineHeight: 1.55 }}>{f[1]}</div>}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 12.5, color: '#A89E94', marginTop: 22 }}>Reva · v2.4.0 · Los Cabos</div>
    </div>
  )
}

// ── Profile ────────────────────────────────────────────────
function Profile({ mode, userName, homeState, homeCity, currentCity, onCityChange, onModeSwitch, onLangChange, onChatSupport, onBell, onMsg, isRegistered, onRegister, onLogin }: { mode: Mode; userName: string | null; homeState: string | null; homeCity: string | null; currentCity: string; onCityChange: (c: string) => void; onModeSwitch: () => void; onLangChange: (l: 'es'|'en') => void; onChatSupport: () => void; onBell: () => void; onMsg: () => void; isRegistered: boolean; onRegister: () => void; onLogin: () => void }) {
  const en = useContext(LangContext) === 'en'
  const name = userName || (en ? 'Your profile' : 'Tu perfil')
  const sub = mode === 'vecino'
    ? `Vecina · ${homeCity}${homeState ? `, ${homeState}` : ''}`
    : `Explorer · ${en ? 'visiting' : 'visitando'} ${currentCity}`
  const [page, setPage] = useState<ProfilePageId | null>(null)

  if (!isRegistered) {
    return (
      <div style={{ height: '100%', background: '#FAF5EE', display: 'flex', flexDirection: 'column' }}>
        <AppHeader mode={mode} title={en ? 'You' : 'Tu perfil'} hasNotif={false} onModeToggle={onModeSwitch} onBell={onBell} onMsg={onMsg} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px 48px', gap: 20, textAlign: 'center' }}>
          {/* Avatar placeholder */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#EDE6DC', display: 'grid', placeItems: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A89E94" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0116 0" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21, color: '#221C19', margin: '0 0 8px' }}>
              {en ? 'Your profile' : 'Tu perfil'}
            </p>
            <p style={{ fontSize: 14.5, color: '#6B615A', lineHeight: 1.5, margin: 0 }}>
              {en
                ? 'Create an account to manage your bookings, save favourites and earn Reva+ rewards.'
                : 'Crea una cuenta para gestionar tus reservas, guardar favoritos y acumular puntos Reva+.'}
            </p>
          </div>
          <button onClick={onRegister} style={{ width: '100%', padding: '15px', borderRadius: 14, background: '#E8505B', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {en ? 'Create account' : 'Crear cuenta'}
          </button>
          <button onClick={onLogin} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'transparent', border: '1.5px solid #D9D0C7', color: '#221C19', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            {en ? 'Sign in' : 'Ya tengo cuenta'}
          </button>
          {/* Settings accesibles incluso sin sesión */}
          <div style={{ width: '100%', background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden', marginTop: 8 }}>
            <button onClick={() => setPage('idioma')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
              <Icon n="globe" size={19} color="#A89E94" />
              <span style={{ flex: 1, fontSize: 15, color: '#221C19' }}>{en ? 'Language' : 'Idioma'}</span>
              <span style={{ fontSize: 14, color: '#6B615A' }}>{en ? 'English' : 'Español'}</span>
              <Icon n="chevR" size={16} color="#C8BFB8" />
            </button>
            <button onClick={() => setPage('ayuda')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', border: 'none', borderTop: '1px solid #F1EADF', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
              <Icon n="info" size={19} color="#A89E94" />
              <span style={{ flex: 1, fontSize: 15, color: '#221C19' }}>{en ? 'Help & support' : 'Ayuda y soporte'}</span>
              <Icon n="chevR" size={16} color="#C8BFB8" />
            </button>
          </div>
        </div>
        {page && (
          <PageShell title={page === 'idioma' ? (en ? 'Language' : 'Idioma') : (en ? 'Help & support' : 'Ayuda y soporte')} onBack={() => setPage(null)}>
            {page === 'idioma' && <LanguagePage onLangChange={onLangChange} />}
            {page === 'ayuda' && <HelpPage en={en} onChatSupport={() => { setPage(null); onChatSupport() }} />}
          </PageShell>
        )}
      </div>
    )
  }

  const rows1 = en
    ? [{ icon: 'globe' as const, label: 'Language', val: 'English', page: 'idioma' as ProfilePageId },
       { icon: 'bell' as const, label: 'Notifications', val: 'On', page: 'notif' as ProfilePageId }]
    : [{ icon: 'globe' as const, label: 'Idioma', val: 'Español', page: 'idioma' as ProfilePageId },
       { icon: 'bell' as const, label: 'Notificaciones', val: 'Activadas', page: 'notif' as ProfilePageId }]

  const rows2 = en
    ? [{ icon: 'cal' as const, label: 'Booking history', val: null, page: null as null },
       { icon: 'shield' as const, label: 'Cancellation policy', val: null, page: 'cancelacion' as ProfilePageId },
       { icon: 'info' as const, label: 'Help & support', val: null, page: 'ayuda' as ProfilePageId }]
    : [{ icon: 'cal' as const, label: 'Historial de reservas', val: null, page: null as null },
       { icon: 'shield' as const, label: 'Política de cancelación', val: null, page: 'cancelacion' as ProfilePageId },
       { icon: 'info' as const, label: 'Ayuda y soporte', val: null, page: 'ayuda' as ProfilePageId }]

  const pageTitle: Record<ProfilePageId, string> = {
    idioma: en ? 'Language' : 'Idioma',
    pago: en ? 'Payment' : 'Pago',
    notif: en ? 'Notifications' : 'Notificaciones',
    cancelacion: en ? 'Cancellation policy' : 'Política de cancelación',
    ayuda: en ? 'Help & support' : 'Ayuda y soporte',
  }

  return (
    <div style={{ height: '100%', background: '#FAF5EE', position: 'relative', overflow: 'hidden' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
      <AppHeader mode={mode} title={en ? 'You' : 'Tu perfil'} hasNotif={false} onModeToggle={onModeSwitch} onBell={onBell} onMsg={onMsg} />
      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '2px 0 6px' }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg,#E8505B,#E7A33C)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#fff', flexShrink: 0 }}>
            {name[0]}
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#221C19' }}>{name}</p>
            <p style={{ fontSize: 13.5, color: '#6B615A', marginTop: 2 }}>{sub}</p>
          </div>
        </div>

        {/* city + mode card */}
        <div style={{ background: 'linear-gradient(135deg,#1B2436,#2A3550)', borderRadius: 18, padding: 17, color: '#fff' }}>
          {/* City switcher */}
          <p style={{ fontSize: 11, fontWeight: 700, opacity: .6, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>
            {en ? 'Browsing' : 'Explorando'}
          </p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {CITIES.map(city => {
              const active = city === currentCity
              return (
                <button key={city} onClick={() => onCityChange(city)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, background: active ? '#fff' : 'rgba(255,255,255,.12)', color: active ? '#221C19' : 'rgba(255,255,255,.7)', transition: 'background .15s' }}>
                  {city === homeCity && <Icon n="home" size={12} color={active ? '#E8505B' : 'rgba(255,255,255,.6)'} />}
                  {city}
                </button>
              )
            })}
          </div>

          {/* Mode — read-only indicator (auto-derived from city) */}
          <p style={{ fontSize: 11, fontWeight: 700, opacity: .6, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>
            {en ? 'Mode' : 'Modo'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(255,255,255,.1)', borderRadius: 12, marginBottom: 10 }}>
            <Icon n={mode === 'explorer' ? 'globe' : 'home'} size={18} color="#fff" />
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15 }}>
              {mode === 'explorer' ? 'Explorer' : 'Vecino'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, opacity: .55, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              AUTO
            </span>
          </div>

          <p style={{ fontSize: 12, opacity: .6, lineHeight: 1.45 }}>
            {homeCity
              ? (en
                ? `Vecino in ${homeCity}${homeState ? ` (${homeState})` : ''} · Explorer everywhere else. Change city above.`
                : `Vecino en ${homeCity}${homeState ? `, ${homeState}` : ''} · Explorer en otros municipios. Cambia de ciudad arriba.`)
              : (en
                ? 'Explorer mode — set your home city above to get Vecino access.'
                : 'Modo Explorer — selecciona tu ciudad de origen arriba para acceder como Vecino.')}
          </p>
        </div>

        {/* payment */}
        <button onClick={() => setPage('pago')} style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'var(--font-ui)' }}>
          <div style={{ width: 40, height: 26, background: '#1B2436', borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '.03em' }}>VISA</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14.5, color: '#221C19' }}>Visa · 4242</p>
            <p style={{ fontSize: 12, color: '#6B615A' }}>Secure card · Stripe</p>
          </div>
          <Icon n="chevR" size={18} color="#A89E94" />
        </button>

        {/* settings rows 1 */}
        <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
          {rows1.map((r, i) => (
            <button key={i} onClick={() => setPage(r.page)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', border: 'none', borderTop: i ? '1px solid #F1EADF' : 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
              <Icon n={r.icon} size={19} color="#A89E94" />
              <span style={{ flex: 1, fontSize: 15, color: '#221C19' }}>{r.label}</span>
              {r.val && <span style={{ fontSize: 14, color: '#6B615A' }}>{r.val}</span>}
              <Icon n="chevR" size={16} color="#C8BFB8" />
            </button>
          ))}
        </div>

        {/* settings rows 2 */}
        <div style={{ background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, overflow: 'hidden' }}>
          {rows2.map((r, i) => (
            <button key={i} onClick={() => r.page && setPage(r.page)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', border: 'none', borderTop: i ? '1px solid #F1EADF' : 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
              <Icon n={r.icon} size={19} color="#A89E94" />
              <span style={{ flex: 1, fontSize: 15, color: '#221C19' }}>{r.label}</span>
              <Icon n="chevR" size={16} color="#C8BFB8" />
            </button>
          ))}
        </div>

        <button style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#E8505B', padding: '4px 0' }}>
          {en ? 'Sign out' : 'Cerrar sesión'}
        </button>
      </div>

      </div>{/* end inner scrollable */}

      {/* Sub-page overlay — outside scroll context so inset:0 covers full screen */}
      {page && (
        <PageShell title={pageTitle[page]} onBack={() => setPage(null)}>
          {page === 'idioma' && <LanguagePage onLangChange={onLangChange} />}
          {page === 'pago' && <PaymentPage en={en} />}
          {page === 'notif' && <NotifPage en={en} />}
          {page === 'cancelacion' && <CancelPage en={en} />}
          {page === 'ayuda' && <HelpPage en={en} onChatSupport={() => { setPage(null); onChatSupport() }} />}
        </PageShell>
      )}
    </div>
  )
}

// ── App Shell ──────────────────────────────────────────────
type Tab = 'concierge' | 'discover' | 'bookings' | 'rove' | 'profile'

// ── Messages Screen ────────────────────────────────────────
// Chat cliente↔negocio real, persistido en la tabla `messages` (Fase 4).
type GMsg = { from: string; txt: string } // from: user | biz | reva
type GThread = { bizId: string; bizName: string; grad: [string, string]; mono: string; last: string; time: string; unread: boolean; msgs: GMsg[] }
interface ApiThread { bizId: string; bizName: string; grad_from: string | null; grad_to: string | null; mono: string | null; last: string; created_at: string; messages: { from_role: string; body: string }[] }

function msgRelTime(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`
}

function MessagesScreen({ mode, onClose, startBizId }: { mode: Mode; onClose: () => void; startBizId?: string | null }) {
  const en = useContext(LangContext) === 'en'
  const { businesses } = useContext(BizDataContext)
  const [threads, setThreads] = useState<GThread[]>([])
  const [activeBizId, setActiveBizId] = useState<string | null>(startBizId ?? null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/messages')
      if (!r.ok) return
      const d = await r.json()
      setThreads((d.threads ?? []).map((t: ApiThread): GThread => ({
        bizId: t.bizId,
        bizName: t.bizName,
        grad: [t.grad_from || '#E27A52', t.grad_to || '#B5472F'],
        mono: t.mono || (t.bizName || 'R').charAt(0).toUpperCase(),
        last: t.last,
        time: msgRelTime(t.created_at),
        unread: false,
        msgs: (t.messages ?? []).map(m => ({ from: m.from_role, txt: m.body })),
      })))
    } catch { /* mantiene lo que haya */ }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [threads, activeBizId])

  // Abre (creando un hilo vacío si hace falta) la conversación con un negocio.
  useEffect(() => {
    if (!startBizId) return
    setThreads(prev => {
      if (prev.some(t => t.bizId === startBizId)) return prev
      const b = businesses.find(x => x.id === startBizId)
      return [{ bizId: startBizId, bizName: b?.name ?? 'Negocio', grad: b?.grad ?? ['#E27A52', '#B5472F'], mono: b?.mono ?? 'R', last: '', time: '', unread: false, msgs: [] }, ...prev]
    })
    setActiveBizId(startBizId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startBizId])

  const active = threads.find(t => t.bizId === activeBizId) ?? null

  async function send() {
    const t = input.trim()
    if (!t || sending || !activeBizId) return
    setInput('')
    setThreads(prev => prev.map(x => x.bizId === activeBizId ? { ...x, msgs: [...x.msgs, { from: 'user', txt: t }], last: t } : x))
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biz_id: activeBizId, body: t, mode }),
      })
      if (res.ok) {
        const d = await res.json()
        const replyTxt: string = d.reply?.body ?? ''
        if (replyTxt) setThreads(prev => prev.map(x => x.bizId === activeBizId ? { ...x, msgs: [...x.msgs, { from: 'biz', txt: replyTxt }], last: replyTxt } : x))
      }
    } catch { /* el mensaje del cliente ya se muestra */ } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: '#FAF5EE', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'max(54px, calc(env(safe-area-inset-top) + 18px)) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, background: '#FAF5EE', flexShrink: 0 }}>
        <button onClick={() => active ? setActiveBizId(null) : onClose()} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #E9E0D5', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon n="chevL" size={18} color="#221C19" />
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#221C19', letterSpacing: '-.02em' }}>
          {active ? active.bizName.split(' ').slice(0, 2).join(' ') : en ? 'Messages' : 'Mensajes'}
        </div>
      </div>

      {active ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0 16px 16px' }}>
          {/* biz header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid #F1EADF', flexShrink: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(140deg,${active.grad[0]},${active.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#fff', flexShrink: 0 }}>{active.mono}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#221C19' }}>{active.bizName}</div>
              <div style={{ fontSize: 12, color: '#6B615A', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8505B', flexShrink: 0 }} />
                {en ? 'Connected via Reva' : 'Conectado vía Reva'}
              </div>
            </div>
          </div>
          {/* thread */}
          <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '14px 2px', display: 'flex', flexDirection: 'column', gap: 11 }}>
            {active.msgs.length === 0 && (
              <div style={{ textAlign: 'center', fontSize: 12.5, color: '#A89E94', marginTop: 24, lineHeight: 1.5, padding: '0 24px' }}>
                {en ? `Say hi to ${active.bizName} — Reva delivers your message.` : `Salúdalo — Reva le hace llegar tu mensaje a ${active.bizName}.`}
              </div>
            )}
            {active.msgs.map((m, i) => {
              if (m.from === 'reva') return (
                <div key={i} style={{ alignSelf: 'center', maxWidth: '92%', textAlign: 'center', fontSize: 12, color: '#9A6C1C', background: '#FBEFD7', padding: '7px 13px', borderRadius: 13, lineHeight: 1.4 }}>
                  <Icon n="spark" size={11} color="#9A6C1C" fill="#9A6C1C" /> {m.txt}
                </div>
              )
              const me = m.from === 'user'
              return (
                <div key={i} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '80%', background: me ? '#221C19' : '#fff', color: me ? '#fff' : '#221C19', border: me ? 'none' : '1px solid #E9E0D5', borderRadius: 16, borderBottomRightRadius: me ? 5 : 16, borderBottomLeftRadius: me ? 16 : 5, padding: '10px 14px', fontSize: 14.5, lineHeight: 1.4 }}>{m.txt || <span style={{ opacity: .5 }}>…</span>}</div>
              )
            })}
          </div>
          {/* composer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF5EE', border: '1px solid #E9E0D5', borderRadius: 999, padding: '5px 5px 5px 15px', flexShrink: 0 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={en ? `Message ${active.bizName.split(' ').slice(0, 2).join(' ')}…` : `Escribe a ${active.bizName.split(' ').slice(0, 2).join(' ')}…`}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-ui)', fontSize: 14.5, color: '#221C19' }} />
            <button onClick={send} disabled={sending} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: input.trim() && !sending ? '#E8505B' : '#F1EADF', cursor: sending ? 'default' : 'pointer', display: 'grid', placeItems: 'center', transition: 'background .15s', flexShrink: 0 }}>
              <Icon n="send" size={17} color={input.trim() && !sending ? '#fff' : '#A89E94'} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 16px 18px' }}>
          {threads.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: 12.5, color: '#A89E94', marginTop: 40, lineHeight: 1.5, padding: '0 24px' }}>
              {en ? 'No messages yet. Open a business and tap “Message” to start a chat.' : 'Aún no tienes mensajes. Abre un negocio y toca “Mensaje” para empezar un chat.'}
            </div>
          ) : threads.map(t => (
            <div key={t.bizId} onClick={() => setActiveBizId(t.bizId)} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: '1px solid #E9E0D5', borderRadius: 18, padding: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(34,28,25,.06)', marginBottom: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(140deg,${t.grad[0]},${t.grad[1]})`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: '#fff', flexShrink: 0 }}>{t.mono}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: '#221C19' }}>{t.bizName}</span>
                  <span style={{ fontSize: 11.5, color: '#A89E94', flexShrink: 0, marginLeft: 8 }}>{t.time}</span>
                </div>
                <div style={{ fontSize: 13, color: '#6B615A', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.last || (en ? 'New conversation' : 'Nueva conversación')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Notifications Screen ───────────────────────────────────
function NotificationsScreen({ mode, onClose, onMessages }: { mode: Mode; onClose: () => void; onMessages: () => void }) {
  const en = useContext(LangContext) === 'en'
  const groups = en ? [
    { label: 'Today', items: [
      { ic: 'check' as const, c: '#1F8A6D', bg: '#DDF0E8', t: 'Booking confirmed', d: 'La Lupita confirmed your table tonight · 20:00.', time: '2m', unread: true, msg: false },
      { ic: 'chat' as const, c: '#E8505B', bg: '#FCE9E7', t: 'New message', d: 'La Lupita: "We can do the terrace 🌿"', time: '18m', unread: true, msg: true },
      { ic: 'gift' as const, c: '#B5472F', bg: '#FCE9E7', t: 'Almost a reward', d: 'Taco Club — 1 more stamp for a free pastor.', time: '3h', unread: false, msg: false },
    ]},
    { label: 'Earlier', items: [
      { ic: 'ticket' as const, c: '#9A6C1C', bg: '#FBEFD7', t: '+1 Reva+ ticket', d: 'You earned a ticket from your Sunset Sail review.', time: 'Tue', unread: false, msg: false },
      { ic: 'bell' as const, c: '#A89E94', bg: '#F1EADF', t: 'Reminder', d: 'Your Cabo Azul Sunset Sail is tomorrow · 17:30.', time: 'Tue', unread: false, msg: false },
    ]},
  ] : [
    { label: 'Hoy', items: [
      { ic: 'check' as const, c: '#1F8A6D', bg: '#DDF0E8', t: 'Reserva confirmada', d: 'La Lupita confirmó tu mesa de hoy · 21:00.', time: '2m', unread: true, msg: false },
      { ic: 'chat' as const, c: '#E8505B', bg: '#FCE9E7', t: 'Nuevo mensaje', d: 'La Lupita: "¡Claro! Te aparto una botella."', time: '18m', unread: true, msg: true },
      { ic: 'gift' as const, c: '#B5472F', bg: '#FCE9E7', t: 'Casi tienes premio', d: 'Taco Club — te falta 1 sello para un pastor gratis.', time: '3h', unread: false, msg: false },
    ]},
    { label: 'Antes', items: [
      { ic: 'ticket' as const, c: '#9A6C1C', bg: '#FBEFD7', t: '+1 boleto Reva+', d: 'Ganaste un boleto por tu reseña del Sunset Sail.', time: 'Mar', unread: false, msg: false },
      { ic: 'bell' as const, c: '#A89E94', bg: '#F1EADF', t: 'Recordatorio', d: 'Tu Sunset Sail de Cabo Azul es mañana · 17:30.', time: 'Mar', unread: false, msg: false },
    ]},
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: '#FAF5EE', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'max(54px, calc(env(safe-area-inset-top) + 18px)) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, background: '#FAF5EE', flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #E9E0D5', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon n="chevL" size={18} color="#221C19" />
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#221C19', letterSpacing: '-.02em' }}>{en ? 'Notifications' : 'Notificaciones'}</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 16px 24px' }}>
        {groups.map((g, gi) => (
          <div key={gi}>
            <div style={{ fontSize: 12, color: '#A89E94', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: gi ? '20px 2px 10px' : '2px 2px 10px' }}>{g.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {g.items.map((n, i) => (
                <button key={i} onClick={() => n.msg && onMessages()} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '14px 15px', borderRadius: 16, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', position: 'relative', border: `1px solid ${n.unread ? '#FCE9E7' : '#E9E0D5'}`, background: n.unread ? '#FDF3F2' : '#fff', width: '100%' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: n.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon n={n.ic} size={18} color={n.c} stroke={n.ic === 'check' ? 3 : 2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#221C19' }}>{n.t}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#A89E94', flexShrink: 0 }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6B615A', marginTop: 3, lineHeight: 1.45 }}>{n.d}</div>
                  </div>
                  {n.unread && <span style={{ position: 'absolute', top: 14, right: 13, width: 8, height: 8, borderRadius: '50%', background: '#E8505B' }} />}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', fontSize: 12.5, color: '#A89E94', marginTop: 22, lineHeight: 1.5, padding: '0 24px' }}>
          {en ? 'Manage what arrives here in Profile · Notifications.' : 'Configura qué llega aquí en Perfil · Notificaciones.'}
        </div>
      </div>
    </div>
  )
}

// ── Auth Required Modal ────────────────────────────────────
function AuthRequiredModal({ en, onRegister, onLogin, onDismiss }: { en: boolean; onRegister: () => void; onLogin: () => void; onDismiss: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div onClick={onDismiss} style={{ position: 'absolute', inset: 0, background: 'rgba(34,28,25,0.55)', backdropFilter: 'blur(2px)' }} />
      {/* Sheet */}
      <div style={{ position: 'relative', background: '#FAF5EE', borderRadius: '20px 20px 0 0', padding: '28px 24px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#D9D0C7', margin: '0 auto 4px' }} />
        {/* Icon */}
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE8EA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E8505B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0116 0" />
          </svg>
        </div>
        {/* Text */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#221C19', margin: '0 0 8px' }}>
            {en ? 'Sign in to book' : 'Inicia sesión para reservar'}
          </p>
          <p style={{ fontSize: 14.5, color: '#6B5E55', lineHeight: 1.5, margin: 0 }}>
            {en
              ? 'You need a Reva account to make reservations and manage your bookings.'
              : 'Necesitas una cuenta en Reva para hacer reservaciones y gestionar tus citas.'}
          </p>
        </div>
        {/* Actions */}
        <button onClick={onRegister} style={{ width: '100%', padding: '15px', borderRadius: 14, background: '#E8505B', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
          {en ? 'Create account' : 'Crear cuenta'}
        </button>
        <button onClick={onLogin} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'transparent', border: '1.5px solid #D9D0C7', color: '#221C19', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          {en ? 'Sign in' : 'Ya tengo cuenta'}
        </button>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#A89E94', fontSize: 13.5, cursor: 'pointer', textDecoration: 'underline' }}>
          {en ? 'Maybe later' : 'Ahora no'}
        </button>
      </div>
    </div>
  )
}

export default function AppPage() {
  const [onboarded, setOnboarded] = useState(false)
  const [lang, setLang] = useState<'es'|'en'>('en')
  const [homeState, setHomeState] = useState<string | null>(null)
  const [homeCity, setHomeCity] = useState<string | null>(null)
  const [currentCity, setCurrentCity] = useState(CITIES[0] as string)
  const mode: Mode = homeCity !== null && homeCity === currentCity ? 'vecino' : 'explorer'

  // El onboarding se guarda en localStorage y se rehidrata al montar. Sin esto,
  // registrarse (window.location.href a /auth/register) es una navegación dura
  // que borra el estado de React: al volver a /app el usuario veía de nuevo el
  // onboarding aunque ya lo hubiera completado.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('reva.onboarding')
      if (raw) {
        const s = JSON.parse(raw) as { homeState: string | null; homeCity: string | null; currentCity: string | null; lang: 'es' | 'en' }
        setHomeState(s.homeState ?? null)
        setHomeCity(s.homeCity ?? null)
        if (s.currentCity) setCurrentCity(s.currentCity)
        if (s.lang) setLang(s.lang)
        setOnboarded(true)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Live businesses + catalog for whatever city the guest is currently in.
  // Los Cabos uses the curated demo set instantly; other cities fetch from
  // Supabase and fall back to Los Cabos if that city has no data yet.
  const [bizData, setBizData] = useState<CityData>({ businesses: BIZ, catalog: CATALOG })
  useEffect(() => {
    let cancelled = false
    fetchCityData(currentCity).then(data => { if (!cancelled) setBizData(data) })
    return () => { cancelled = true }
  }, [currentCity])

  const handleCityChange = (city: string) => {
    setCurrentCity(city)
  }

  const [tab, setTab] = useState<Tab>('concierge')
  const [openBiz, setOpenBiz] = useState<Business | null>(null)
  const [bookingBiz, setBookingBiz] = useState<Business | null>(null)
  const [bookingService, setBookingService] = useState<Service | null>(null)
  const [detailService, setDetailService] = useState<{ biz: Business; service: Service } | null>(null)
  const [showMessages, setShowMessages] = useState(false)
  const [messagesBizId, setMessagesBizId] = useState<string | null>(null)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  // Auth gate: track registration state and pending booking intent.
  // isRegistered ahora refleja la sesión real de Supabase.
  const [isRegistered, setIsRegistered] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [pendingBook, setPendingBook] = useState<{ biz: Business; service: Service | null } | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // El nombre viene de los metadatos del usuario (full_name), guardado en el registro.
    const nameOf = (u: { user_metadata?: { full_name?: string } } | null | undefined) =>
      (u?.user_metadata?.full_name ?? '').trim() || null
    supabase.auth.getUser().then(({ data }) => {
      setIsRegistered(!!data.user)
      setUserName(nameOf(data.user))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsRegistered(!!session?.user)
      setUserName(nameOf(session?.user))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const en = useContext(LangContext) === 'en'

  // Central booking entry point — checks auth before opening the booking sheet
  const tryBook = (biz: Business, service: Service | null = null) => {
    if (!isRegistered) {
      setPendingBook({ biz, service })
      setShowAuthModal(true)
      return
    }
    setBookingService(service)
    setBookingBiz(biz)
  }

  // Abrir chat con un negocio (requiere sesión: los mensajes se persisten).
  const tryMessage = (biz: Business) => {
    if (!isRegistered) { setShowAuthModal(true); return }
    setOpenBiz(null)
    setMessagesBizId(biz.id)
    setShowMessages(true)
  }

  const handleAuthDismiss = () => {
    setShowAuthModal(false)
    setPendingBook(null)
  }

  // If not registered and on a protected tab, redirect to concierge
  const protectedTabs: Tab[] = ['bookings', 'rove']
  if (!isRegistered && protectedTabs.includes(tab)) {
    setTab('concierge')
  }

  const tabs = [
    { id: 'concierge' as Tab, label: 'Reva', icon: I.chat },
    { id: 'discover' as Tab, label: en ? 'Discover' : 'Explorar', icon: I.compass },
    ...(isRegistered ? [
      { id: 'bookings' as Tab, label: en ? 'Trips' : 'Reservas', icon: I.cal },
      { id: 'rove' as Tab, label: 'Reva+', icon: I.ticket },
      { id: 'profile' as Tab, label: en ? 'You' : 'Tú', icon: I.user },
    ] : [
      { id: 'profile' as Tab, label: en ? 'You' : 'Tú', icon: I.user },
    ]),
  ]

  // Evita el parpadeo del onboarding mientras leemos localStorage.
  if (!hydrated) return null

  if (!onboarded) {
    return <Onboarding onDone={(state, city, located) => {
      const here = located ?? city
      const nextLang: 'es' | 'en' = city ? 'es' : 'en'
      setHomeState(state)
      setHomeCity(city)
      if (here) setCurrentCity(here)
      setLang(nextLang)
      setOnboarded(true)
      // Persistir para que registrarse/recargar no reinicie el onboarding.
      try {
        localStorage.setItem('reva.onboarding', JSON.stringify({
          homeState: state, homeCity: city, currentCity: here, lang: nextLang,
        }))
      } catch {}
    }} />
  }

  return (
    <LangContext.Provider value={lang}>
    <BizDataContext.Provider value={{ ...bizData, city: currentCity }}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAF5EE', position: 'relative' }}>
      {/* Screen */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {tab === 'concierge' && <Concierge mode={mode} onOpen={setOpenBiz} onBook={(b) => tryBook(b, null)} onBookService={(b, s) => tryBook(b, s)} onServiceDetail={(b, s) => setDetailService({ biz: b, service: s })} onModeToggle={() => setTab('profile')} onBell={() => setShowNotifs(true)} onMsg={() => setShowMessages(true)} />}
        {tab === 'discover' && <Discovery mode={mode} onOpen={setOpenBiz} onBook={(b) => tryBook(b, null)} onModeToggle={() => setTab('profile')} onBell={() => setShowNotifs(true)} onMsg={() => setShowMessages(true)} />}
        {tab === 'bookings' && <Trips mode={mode} onModeToggle={() => setTab('profile')} onBell={() => setShowNotifs(true)} onMsg={() => setShowMessages(true)} />}
        {tab === 'rove' && <Rove mode={mode} onModeToggle={() => setTab('profile')} onBell={() => setShowNotifs(true)} onMsg={() => setShowMessages(true)} isRegistered={isRegistered} onRegister={() => { window.location.href = '/auth/register' }} onLogin={() => { window.location.href = '/auth/login' }} />}
        {tab === 'profile' && <Profile mode={mode} userName={userName} homeState={homeState} homeCity={homeCity} currentCity={currentCity} onCityChange={handleCityChange} onModeSwitch={() => {}} onLangChange={setLang} onChatSupport={() => setShowSupport(true)} onBell={() => setShowNotifs(true)} onMsg={() => setShowMessages(true)} isRegistered={isRegistered} onRegister={() => { window.location.href = '/auth/register' }} onLogin={() => { window.location.href = '/auth/login' }} />}
      </div>

      {/* Bottom nav */}
      <nav style={{ display: 'flex', borderTop: '1px solid #E9E0D5', background: '#fff', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 0 14px', background: 'none', border: 'none', cursor: 'pointer', color: tab === t.id ? '#E8505B' : '#A89E94' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {t.icon}
            </svg>
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Overlays */}
      {openBiz && (
        <BizDetail biz={openBiz} mode={mode} onClose={() => setOpenBiz(null)} onBook={(svc) => { setOpenBiz(null); tryBook(openBiz, svc ?? null) }} onMessage={() => tryMessage(openBiz)} />
      )}
      {bookingBiz && (
        <Booking biz={bookingBiz} mode={mode} service={bookingService ?? undefined} onClose={() => { setBookingBiz(null); setBookingService(null) }} onConfirm={() => { setBookingBiz(null); setBookingService(null) }} />
      )}
      {detailService && (
        <ServiceDetail biz={detailService.biz} service={detailService.service} mode={mode}
          onClose={() => setDetailService(null)}
          onBook={() => { setDetailService(null); tryBook(detailService.biz, detailService.service) }} />
      )}
      {showMessages && (
        <MessagesScreen mode={mode} startBizId={messagesBizId} onClose={() => { setShowMessages(false); setMessagesBizId(null) }} />
      )}
      {showNotifs && (
        <NotificationsScreen mode={mode} onClose={() => setShowNotifs(false)} onMessages={() => { setShowNotifs(false); setShowMessages(true) }} />
      )}
      {showSupport && (
        <SupportChatScreen mode={mode} onClose={() => setShowSupport(false)} />
      )}
      {showAuthModal && (
        <AuthRequiredModal
          en={en}
          onRegister={() => { window.location.href = '/auth/register' }}
          onLogin={() => { window.location.href = '/auth/login' }}
          onDismiss={handleAuthDismiss}
        />
      )}
    </div>
    </BizDataContext.Provider>
    </LangContext.Provider>
  )
}
