import type { Metadata } from 'next'
import ForBusinessPage from '@/components/marketing/ForBusinessPage'

export const metadata: Metadata = {
  title: 'For business — Reva',
  description: 'Your AI agent takes bookings while you sleep. Reva for restaurants, spas, tours and more in Los Cabos.',
  alternates: {
    languages: {
      es: '/para-negocios',
      en: '/en/for-business',
    },
  },
}

export default function ForBusinessPageEn() {
  return <ForBusinessPage lang="en" />
}
