'use client'
import { useState } from 'react'
import Link from 'next/link'
import { RevaMark } from '@/components/ui/RevaMark'
import { Btn } from '@/components/ui/Btn'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
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
    else window.location.href = '/app'
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
    <div className="h-full bg-bg overflow-y-auto flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <RevaMark size={48} className="mx-auto mb-4" />
          <h1 className="font-extrabold text-[28px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>Bienvenido de vuelta</h1>
          <p className="text-[14px] text-ink-soft mt-1">Entra a tu cuenta Reva</p>
        </div>

        {sent ? (
          <div className="bg-jade-tint border border-jade/20 rounded-[18px] p-5 text-center">
            <p className="text-jade font-bold text-[16px]">✓ Revisa tu correo</p>
            <p className="text-[13.5px] text-ink-soft mt-1">Te enviamos un enlace mágico a {email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-[24px] p-6">
            <div className="mb-4">
              <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Correo</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                placeholder="tu@email.com" />
            </div>
            <div className="mb-2">
              <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                placeholder="••••••••" />
            </div>

            {error && <p className="text-coral text-[13px] mb-3">{error}</p>}

            <Btn full type="submit" disabled={loading} className="mb-3">
              {loading ? 'Entrando…' : 'Entrar'}
            </Btn>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line" /></div>
              <div className="relative text-center"><span className="bg-surface px-3 text-[12px] text-ink-faint">o</span></div>
            </div>

            <button type="button" onClick={handleMagicLink} disabled={loading}
              className="w-full py-3 border border-line rounded-full text-[14px] font-semibold text-ink hover:bg-bg-alt transition-colors">
              ✨ Enlace mágico por correo
            </button>
          </form>
        )}

        <p className="text-center text-[13.5px] text-ink-soft mt-5">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" className="text-coral font-semibold hover:underline">Crear cuenta</Link>
        </p>
        <p className="text-center mt-3">
          <Link href="/" className="text-[13px] text-ink-faint hover:text-ink">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
