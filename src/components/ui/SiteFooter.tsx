import Link from 'next/link'

const RevaLogo = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 46 46" aria-hidden="true">
    <rect width="46" height="46" rx="14" fill="#E8505B"/>
    <path d="M11 30c0-7.2 5.6-13 12-13s12 5.8 12 13" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"/>
    <circle cx="23" cy="30" r="3.3" fill="#fff"/>
    <path d="M23 30 L23 37.5" stroke="#fff" strokeWidth="3.4" strokeLinecap="round"/>
  </svg>
)

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="brand" style={{ marginBottom: 14 }}>
              <RevaLogo />
              <span className="word">Reva</span>
            </div>
            <p style={{ maxWidth: '34ch', fontSize: 15 }}>Tu concierge local de IA. Hecho aquí, para los de aquí y para quien nos visita.</p>
          </div>
          <div>
            <h4>Producto</h4>
            <ul>
              <li><Link href="/">Inicio</Link></li>
              <li><Link href="/como-funciona">Cómo funciona</Link></li>
              <li><Link href="#descargar">Descargar app</Link></li>
              <li><Link href="/como-funciona#rove">Reva+</Link></li>
            </ul>
          </div>
          <div>
            <h4>Negocios</h4>
            <ul>
              <li><Link href="/para-negocios">Para negocios</Link></li>
              <li><Link href="/para-negocios#precios">Planes</Link></li>
              <li><Link href="/biz/register">Registrar negocio</Link></li>
            </ul>
          </div>
          <div>
            <h4>Reva</h4>
            <ul>
              <li><Link href="#">Sobre nosotros</Link></li>
              <li><Link href="#">Privacidad</Link></li>
              <li><Link href="#">Términos</Link></li>
              <li><Link href="#">Contacto</Link></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Reva</span>
          <span className="sp"></span>
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="TikTok">TikTok</a>
          <a href="#" aria-label="WhatsApp">WhatsApp</a>
        </div>
      </div>
    </footer>
  )
}
