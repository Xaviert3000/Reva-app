import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reva — Tu concierge local',
  description: 'Un amigo local muy bien conectado en tu bolsillo. Reserva mesas, agenda citas, vive Los Cabos.',
}

// viewport-fit=cover exposes the device safe-area insets (notch / Dynamic Island /
// home indicator) to CSS via env(safe-area-inset-*), which the app UI consumes so
// content never sits under the iOS status bar when wrapped in Capacitor.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
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
