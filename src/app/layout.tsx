import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reva — Tu concierge local',
  description: 'Un amigo local muy bien conectado en tu bolsillo. Reserva mesas, agenda citas, vive Los Cabos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
