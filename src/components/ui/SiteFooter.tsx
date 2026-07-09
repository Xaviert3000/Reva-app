import Link from 'next/link'
import { getLandingDict, type Lang } from '@/i18n/landing'

const RevaLogo = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 46 46" aria-hidden="true">
    <rect width="46" height="46" rx="14" fill="#E8505B"/>
    <path d="M11 30c0-7.2 5.6-13 12-13s12 5.8 12 13" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"/>
    <circle cx="23" cy="30" r="3.3" fill="#fff"/>
    <path d="M23 30 L23 37.5" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"/>
  </svg>
)

export function SiteFooter({ lang = 'es' }: { lang?: Lang }) {
  const t = getLandingDict(lang).footer
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="brand" style={{ marginBottom: 14 }}>
              <RevaLogo />
              <span className="word">Reva</span>
            </div>
            <p style={{ maxWidth: '34ch', fontSize: 15 }}>{t.tagline}</p>
          </div>
          <div>
            <h4>{t.productTitle}</h4>
            <ul>
              {t.productLinks.map((l) => (
                <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>{t.businessTitle}</h4>
            <ul>
              {t.businessLinks.map((l) => (
                <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>{t.companyTitle}</h4>
            <ul>
              {t.companyLinks.map((l) => (
                <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>{t.copyright}</span>
          <span className="sp"></span>
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="TikTok">TikTok</a>
          <a href="#" aria-label="WhatsApp">WhatsApp</a>
        </div>
      </div>
    </footer>
  )
}
