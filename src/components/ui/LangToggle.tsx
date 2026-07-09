import Link from 'next/link'
import { route, type Lang, type MarketingRoute } from '@/i18n/landing'

// ES/EN switcher for the Tailwind-styled marketing pages (how-it-works, for-business).
// `page` is the marketing route the current page belongs to, so each side links to
// its own language version of the SAME page. The landing page uses its own `.lang`
// markup in LandingPage instead of this component.
//
// Note: globals.css sets an unlayered `a { color: inherit }` rule, which in Tailwind v4
// beats layered `text-*` utilities — so link text color is set via inline style here.
export function LangToggle({ lang, page }: { lang: Lang; page: MarketingRoute }) {
  const base = 'px-2.5 py-1 rounded-full text-[12.5px] font-bold transition-colors'
  return (
    <div className="flex items-center gap-0.5 bg-bg-alt border border-line rounded-full p-0.5" role="group" aria-label="Idioma / Language">
      <Link
        href={route(page, 'es')}
        className={base}
        style={lang === 'es' ? { background: 'var(--ink)', color: '#fff' } : { color: 'var(--ink-soft)' }}
        aria-current={lang === 'es' ? 'true' : undefined}
      >
        ES
      </Link>
      <Link
        href={route(page, 'en')}
        className={base}
        style={lang === 'en' ? { background: 'var(--ink)', color: '#fff' } : { color: 'var(--ink-soft)' }}
        aria-current={lang === 'en' ? 'true' : undefined}
      >
        EN
      </Link>
    </div>
  )
}
