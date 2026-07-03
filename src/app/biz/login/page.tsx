'use client'
import { useState } from 'react'
import Link from 'next/link'
import { RevaMark } from '@/components/ui/RevaMark'
import { Btn } from '@/components/ui/Btn'
import { createClient } from '@/lib/supabase/client'

export default function BizLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else window.location.href = '/biz'
    setLoading(false)
  }

  async function handleMagicLink() {
    if (!email) { setError('Ingresa tu correo primero'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <header className="border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <RevaMark size={34} />
            <span className="font-extrabold text-[18px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>Reva</span>
          </Link>
          <Link href="/para-negocios" className="text-[13.5px] text-ink-soft hover:text-ink font-semibold">
            ← Para negocios
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-[12px] font-bold tracking-widest uppercase text-jade mb-3 block">Panel de negocios</span>
            <h1 className="font-extrabold text-[34px] tracking-tight text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              Bienvenido de vuelta
            </h1>
            <p className="text-[15px] text-ink-soft mt-2">Entra a tu panel de Reva Negocios</p>
          </div>

          {sent ? (
            <div className="bg-jade-tint border border-jade/20 rounded-[20px] p-6 text-center">
              <p className="text-jade font-bold text-[18px] mb-1">✓ Revisa tu correo</p>
              <p className="text-[14px] text-ink-soft">Te enviamos un enlace mágico a <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-[24px] p-7 shadow-[0_4px_24px_rgba(34,28,25,.07)]">
              <div className="mb-4">
                <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Correo</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                  placeholder="tu@negocio.com"
                />
              </div>
              <div className="mb-2">
                <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-coral text-[13px] mt-3 mb-1">{error}</p>}

              <Btn full type="submit" disabled={loading} className="mt-5 mb-3">
                {loading ? 'Entrando…' : 'Entrar al panel'}
              </Btn>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line" /></div>
                <div className="relative text-center"><span className="bg-surface px-3 text-[12px] text-ink-faint">o</span></div>
              </div>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="w-full py-3 border border-line rounded-full text-[14px] font-semibold text-ink hover:bg-bg transition-colors"
              >
                ✨ Enlace mágico por correo
              </button>
            </form>
          )}

          <p className="text-center text-[14px] text-ink-soft mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/biz/register" className="text-coral font-semibold hover:underline">Registrar mi negocio</Link>
          </p>
        </div>
      </div>

      <footer className="border-t border-line py-6 text-center">
        <span className="text-[13px] text-ink-faint">Reva · Panel de Negocios · Los Cabos</span>
      </footer>
    </div>
  )
}
