import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reva App',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-bg flex items-stretch justify-center md:items-center">
      {/* On device: full-bleed, edge-to-edge (no max-width / shadow / radius — those
          would letterbox the screen and expose the cream page behind a gradient
          screen). Real viewport height, no position:fixed so iOS WKWebView scrolls
          inner overflow containers reliably. On desktop: centered phone-frame mock. */}
      <div className="w-full h-[100dvh] relative bg-bg overflow-hidden md:max-w-sm md:h-[812px] md:max-h-[812px] md:shadow-[0_30px_80px_rgba(34,28,25,.25)] md:rounded-[40px]">
        {children}
      </div>
    </div>
  )
}
