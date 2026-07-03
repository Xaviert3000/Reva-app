export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center">
      {/* Same phone frame as /app */}
      <div className="w-full max-w-sm h-full max-h-[812px] relative bg-bg overflow-hidden shadow-[0_30px_80px_rgba(34,28,25,.25)] rounded-[0] md:rounded-[40px]">
        {children}
      </div>
    </div>
  )
}
