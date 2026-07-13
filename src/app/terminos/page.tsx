import type { Metadata } from 'next'
import TermsPage from '@/components/marketing/TermsPage'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Reva',
  description: 'Términos y Condiciones de Uso de Reva, tu concierge local de IA en Los Cabos. Versión 4.0 — Julio 2026.',
  alternates: {
    languages: {
      es: '/terminos',
      en: '/en/terms',
    },
  },
}

export default function TerminosPage() {
  return <TermsPage lang="es" />
}
