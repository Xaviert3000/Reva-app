import type { Metadata } from 'next'
import PrivacyPage from '@/components/marketing/PrivacyPage'

export const metadata: Metadata = {
  title: 'Privacy Policy — Reva',
  description: 'Reva Privacy Policy. Los Cabos. Compliant with Mexico\'s LFPDPPP. Version 4.0 — July 2026.',
  alternates: {
    languages: {
      es: '/privacidad',
      en: '/en/privacy',
    },
  },
}

// The legal document is authoritative in Spanish (see Terms · Section 17 · Idioma),
// so the EN route renders the same content with the English site chrome.
export default function EnPrivacyPage() {
  return <PrivacyPage lang="en" />
}
