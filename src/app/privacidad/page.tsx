import type { Metadata } from 'next'
import PrivacyPage from '@/components/marketing/PrivacyPage'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Reva',
  description: 'Política de Privacidad de Reva, tu concierge local de IA en Los Cabos. Cumple con la LFPDPPP. Versión 4.0 — Julio 2026.',
  alternates: {
    languages: {
      es: '/privacidad',
      en: '/en/privacy',
    },
  },
}

export default function PrivacidadPage() {
  return <PrivacyPage lang="es" />
}
