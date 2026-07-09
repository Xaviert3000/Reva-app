'use client'
import { useState } from 'react'
import Link from 'next/link'
import { RevaMark } from '@/components/ui/RevaMark'
import { Btn } from '@/components/ui/Btn'
import { createClient } from '@/lib/supabase/client'

const TYPES = [
  'Restaurante', 'Bar', 'Spa', 'Clínica', 'Salón de belleza',
  'Tour / Excursión', 'Despacho', 'Inmobiliaria', 'Otro',
]

export default function BizRegisterPage() {
  const [bizName, setBizName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bizType, setBizType] = useState(TYPES[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: ownerName,
          business_name: bizName,
          business_type: bizType,
          role: 'business',
        },
        // Confirmación vuelve a este host y aterriza en el panel de negocios.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/biz`,
      },
    })
    if (error) setError(error.message)
    else setDone(true)
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
              Registra tu negocio
            </h1>
            <p className="text-[15px] text-ink-soft mt-2">Empieza gratis. Tu agente de IA listo en minutos.</p>
          </div>

          {done ? (
            <div className="bg-jade-tint border border-jade/20 rounded-[20px] p-6 text-center">
              <p className="text-jade font-bold text-[20px] mb-2">✓ ¡Cuenta creada!</p>
              <p className="text-[14.5px] text-ink-soft mb-4">Revisa tu correo para confirmar tu cuenta y activar tu panel.</p>
              <Link href="/biz/login">
                <Btn>Entrar al panel →</Btn>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-[24px] p-7 shadow-[0_4px_24px_rgba(34,28,25,.07)] flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Nombre del negocio</label>
                <input
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  required
                  className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                  placeholder="La Lupita Taco & Mezcal"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Tu nombre</label>
                <input
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  required
                  className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Giro del negocio</label>
                <select
                  value={bizType}
                  onChange={e => setBizType(e.target.value)}
                  className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                >
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
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
              <div>
                <label className="text-[12px] font-bold text-ink-faint uppercase tracking-wide block mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border border-line rounded-[12px] px-4 py-3 text-[14.5px] text-ink outline-none focus:border-coral bg-bg transition-colors"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              {error && <p className="text-coral text-[13px]">{error}</p>}

              <Btn full type="submit" disabled={loading}>
                {loading ? 'Creando cuenta…' : 'Crear cuenta gratis'}
              </Btn>

              <p className="text-[12.5px] text-ink-faint text-center">
                Al registrarte aceptas los{' '}
                <Link href="#" className="underline hover:text-ink">Términos de uso</Link>
                {' '}de Reva.
              </p>
            </form>
          )}

          <p className="text-center text-[14px] text-ink-soft mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/biz/login" className="text-coral font-semibold hover:underline">Entrar al panel</Link>
          </p>
        </div>
      </div>

      <footer className="border-t border-line py-6 text-center">
        <span className="text-[13px] text-ink-faint">Reva · Panel de Negocios · Los Cabos</span>
      </footer>
    </div>
  )
}
