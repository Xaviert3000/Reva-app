import type { Metadata } from 'next'
import HowItWorksPage from '@/components/marketing/HowItWorksPage'

export const metadata: Metadata = {
  title: 'How it works — Reva',
  description: 'From a wish to a booking in seconds. How Reva connects customers with Los Cabos businesses.',
  alternates: {
    languages: {
      es: '/como-funciona',
      en: '/en/how-it-works',
    },
  },
}

export default function HowItWorksPageEn() {
  return <HowItWorksPage lang="en" />
}
