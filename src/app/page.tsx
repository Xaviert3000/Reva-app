import type { Metadata } from 'next'
import LandingPage from '@/components/marketing/LandingPage'

export const metadata: Metadata = {
  title: 'Reva — Tu concierge local',
  description: 'Un amigo local muy bien conectado en tu bolsillo. Reserva mesas, agenda citas, vive Los Cabos.',
  alternates: {
    languages: {
      es: '/',
      en: '/en',
    },
  },
}

export default function HomePage() {
  return <LandingPage lang="es" />
}
