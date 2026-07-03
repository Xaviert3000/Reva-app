import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reva App',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-bg flex items-center justify-center">
      {/* Full-height on device (real viewport, no position:fixed so iOS WKWebView
          scrolls inner overflow containers reliably); phone frame on desktop. */}
      <div className="w-full max-w-sm h-[100dvh] md:h-[812px] md:max-h-[812px] relative bg-bg overflow-hidden shadow-[0_30px_80px_rgba(34,28,25,.25)] rounded-[0] md:rounded-[40px]">
        {children}
      </div>
    </div>
  )
}
