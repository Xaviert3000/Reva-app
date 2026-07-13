import type { Metadata } from 'next'
import TermsPage from '@/components/marketing/TermsPage'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Reva',
  description: 'Reva Terms and Conditions of Use. Los Cabos. Version 4.0 — July 2026.',
  alternates: {
    languages: {
      es: '/terminos',
      en: '/en/terms',
    },
  },
}

// The legal document is authoritative in Spanish (see Section 17 · Idioma),
// so the EN route renders the same content with the English site chrome.
export default function EnTermsPage() {
  return <TermsPage lang="en" />
}
