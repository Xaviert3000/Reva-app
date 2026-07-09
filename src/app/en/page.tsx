import type { Metadata } from 'next'
import LandingPage from '@/components/marketing/LandingPage'

export const metadata: Metadata = {
  title: 'Reva — Your local concierge',
  description: 'A very well-connected local friend in your pocket. Book tables, schedule appointments, live Los Cabos.',
  alternates: {
    languages: {
      es: '/',
      en: '/en',
    },
  },
}

export default function HomePageEn() {
  return <LandingPage lang="en" />
}
