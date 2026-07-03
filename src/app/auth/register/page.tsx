'use client'
import { useState } from 'react'
import Link from 'next/link'
import { RevaMark } from '@/components/ui/RevaMark'
import { Btn } from '@/components/ui/Btn'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    })
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  return (
    <div className="h-full bg-bg overflow-y-auto flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <RevaMark size={48} className="mx-auto mb-4" />
          <h1 className="font-extrabold text-[28px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>Crear cuenta</h1>
          <p className="text-[14px] text-ink-soft mt-1">Únete a Reva, gratis</p>
        </div>

        {done ? (
          <div className="bg-jade-tint border border-jade/20 rounded-[18px] p-5 text-center">
            <p className="text-jade font-bold text-[16px]">✓ ¡Bienvenido!</p>
            <p className="text-[13.5px] text-ink-soft mt-1">Revisa tu correo para confirmar tu cuenta.</p>
            <Link href="/app" className="inline-block mt-4 text-coral font-semibold text-[14px] hover:underline">Abrir Reva →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-[24px] p-6">
            <div className="mb-4">
              <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Nombre</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                placeholder="Tu nombre" />
            </div>
            <div className="mb-4">
              <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Correo</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                placeholder="tu@email.com" />
            </div>
            <div className="mb-2">
              <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                placeholder="Mínimo 8 caracteres" />
            </div>

            {error && <p className="text-coral text-[13px] mb-3">{error}</p>}

            <Btn full type="submit" disabled={loading} className="mt-4">
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </Btn>
          </form>
        )}

        <p className="text-center text-[13.5px] text-ink-soft mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-coral font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
