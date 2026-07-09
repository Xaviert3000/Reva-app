import Link from 'next/link'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { RevaMark } from '@/components/ui/RevaMark'
import { Btn } from '@/components/ui/Btn'
import { LangToggle } from '@/components/ui/LangToggle'
import { route, type Lang } from '@/i18n/landing'
import { getHowDict } from '@/i18n/como-funciona'

export default function HowItWorksPage({ lang }: { lang: Lang }) {
  const t = getHowDict(lang)

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={route('home', lang)} className="flex items-center gap-2.5">
            <RevaMark size={34} />
            <span className="font-extrabold text-[18px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>Reva</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href={route('home', lang)} className="text-[14px] font-semibold text-ink-soft hover:text-ink">{t.navHome}</Link>
            <Link href={route('howItWorks', lang)} className="text-[14px] font-semibold text-coral">{t.navHowItWorks}</Link>
            <Link href={route('forBusiness', lang)} className="text-[14px] font-semibold text-ink-soft hover:text-ink">{t.navForBusiness}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LangToggle lang={lang} page="howItWorks" />
            <Link href="/app"><Btn size="sm">{t.navCta}</Btn></Link>
          </div>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-8 text-center">
        <span className="text-[12px] font-bold tracking-widest uppercase text-coral mb-4 block">{t.eyebrow}</span>
        <h1 className="font-extrabold text-[48px] leading-[1.04] tracking-[-0.03em] text-ink mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          {t.titleLine1}<br />{t.titleLine2}
        </h1>
        <p className="text-[16px] text-ink-soft leading-relaxed max-w-[40ch] mx-auto">
          {t.lede}
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="flex flex-col gap-6">
          {t.steps.map((step, i) => (
            <div key={step.n} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full grid place-items-center shrink-0 font-extrabold text-[13px]"
                  style={{ background: '#E8505B', color: '#fff', fontFamily: 'var(--font-display)' }}>
                  {step.n}
                </div>
                {i < t.steps.length - 1 && <div className="flex-1 w-px bg-line mt-2" />}
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
        <h2 className="font-extrabold text-[32px] tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>{t.ctaTitle}</h2>
        <p className="text-[15px] opacity-70 mb-6">{t.ctaBody}</p>
        <Link href="/app"><Btn size="lg">{t.ctaButton}</Btn></Link>
      </section>

      <SiteFooter lang={lang} />
    </div>
  )
}
