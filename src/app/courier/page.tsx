'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Panel del repartidor. El negocio crea la cuenta en Ajustes → Repartidores.
// El repartidor inicia sesión aquí y ve SOLO las entregas que le asignaron.

interface CourierOrder {
  id: string
  status: string
  fulfillment: string
  customer_name: string | null
  customer_phone: string | null
  address: string | null
  notes: string | null
  total: number
  created_at: string
  businesses: { name: string } | null
  order_items: { name: string; qty: number }[]
}

const C = {
  coral: '#E8505B', coralPress: '#D23B47', ink: '#221C19', inkSoft: '#6B615A',
  bg: '#FAF5EE', surface: '#fff', line: '#E9E0D5', jade: '#1F8A6D', jadeTint: '#DDF0E8',
  blue: '#3A5BC7', blueTint: '#E7EDFB', ui: 'var(--font-ui)', display: 'var(--font-display)',
}

const STATUS_LABEL: Record<string, string> = {
  ready: 'Listo para recoger',
  out_for_delivery: 'En camino',
  delivered: 'Entregado',
}

export default function CourierPage() {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [orders, setOrders] = useState<CourierOrder[]>([])
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  // Pedido en espera de código para confirmar la entrega.
  const [deliverFor, setDeliverFor] = useState<CourierOrder | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/courier/orders')
      if (r.status === 403) { setError('Tu cuenta no está registrada como repartidor.'); setOrders([]); return }
      if (r.ok) { const d = await r.json(); setOrders(d.orders ?? []); setName(d.courier?.name ?? null); setError(null) }
    } catch { /* deja como está */ }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user); setReady(true)
      if (data.user) load()
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user)
      if (session?.user) load()
    })
    return () => sub.subscription.unsubscribe()
  }, [load])

  // Realtime: refresca cuando cambia un pedido asignado a este repartidor.
  useEffect(() => {
    if (!signedIn) return
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      channel = supabase
        .channel('courier-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `courier_id=eq.${data.user.id}` }, () => load())
        .subscribe()
    })
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [signedIn, load])

  async function signIn() {
    if (!email.trim() || !password || busy) return
    setBusy(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError('Correo o contraseña incorrectos.')
    setBusy(false)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSignedIn(false); setOrders([])
  }

  async function setStatus(id: string, status: 'out_for_delivery' | 'delivered') {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    try {
      await fetch('/api/courier/orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
    } catch { /* ignora */ }
    load()
  }

  // Entrega: exige el código que el cliente da al recibir. No es optimista;
  // el servidor valida la coincidencia y puede rechazarla (422).
  async function confirmDeliver(id: string, code: string): Promise<{ ok: boolean; codeMismatch?: boolean }> {
    try {
      const r = await fetch('/api/courier/orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'delivered', confirmation_code: code }),
      })
      if (r.status === 422) return { ok: false, codeMismatch: true }
      if (!r.ok) return { ok: false }
    } catch { return { ok: false } }
    load()
    return { ok: true }
  }

  if (!ready) {
    return <div style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', fontFamily: C.ui, color: C.inkSoft }}>Cargando…</div>
  }

  if (!signedIn) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 20px', fontFamily: C.ui, maxWidth: 460, margin: '0 auto' }}>
        <div style={{ fontFamily: C.display, fontWeight: 800, fontSize: 28, color: C.ink, marginBottom: 6 }}>Reva · Repartidor</div>
        <div style={{ fontSize: 14, color: C.inkSoft, marginBottom: 24 }}>Inicia sesión con la cuenta que te dio el negocio.</div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo" inputMode="email" style={inp} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" type="password" style={{ ...inp, marginTop: 10 }} onKeyDown={e => { if (e.key === 'Enter') signIn() }} />
        {error && <div style={{ color: C.coralPress, fontSize: 13, marginTop: 10 }}>{error}</div>}
        <button onClick={signIn} disabled={busy} style={{ marginTop: 16, padding: '14px 0', borderRadius: 999, border: 'none', background: C.coral, color: '#fff', fontFamily: C.ui, fontWeight: 700, fontSize: 15.5, cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    )
  }

  const active = orders.filter(o => o.status !== 'delivered')
  const done = orders.filter(o => o.status === 'delivered')

  const card = (o: CourierOrder) => (
    <div key={o.id} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.display, fontWeight: 700, fontSize: 16, color: C.ink }}>{o.businesses?.name || 'Negocio'}</div>
          <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 3 }}>{o.order_items.map(i => `${i.qty}× ${i.name}`).join(' · ')}</div>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: o.status === 'out_for_delivery' ? C.blue : C.coralPress, background: o.status === 'out_for_delivery' ? C.blueTint : '#FCE9E7', padding: '4px 10px', borderRadius: 999, flexShrink: 0 }}>{STATUS_LABEL[o.status] ?? o.status}</span>
      </div>
      <div style={{ marginTop: 12, padding: '12px 14px', background: C.bg, borderRadius: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{o.customer_name || 'Cliente'}</div>
        {o.address && <div style={{ fontSize: 13.5, color: C.ink, marginTop: 4 }}>📍 {o.address}</div>}
        {o.customer_phone && <a href={`tel:${o.customer_phone}`} style={{ display: 'inline-block', fontSize: 13.5, color: C.blue, marginTop: 4, textDecoration: 'none', fontWeight: 600 }}>📞 {o.customer_phone}</a>}
        {o.notes && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 4, fontStyle: 'italic' }}>“{o.notes}”</div>}
      </div>
      {o.status !== 'delivered' && (
        <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
          {o.status === 'ready' && (
            <button onClick={() => setStatus(o.id, 'out_for_delivery')} style={btn(C.blue)}>Recogí — en camino</button>
          )}
          {o.status === 'out_for_delivery' && (
            <button onClick={() => setDeliverFor(o)} style={btn(C.jade)}>Marcar entregado</button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.ui, maxWidth: 520, margin: '0 auto', padding: '20px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: C.display, fontWeight: 800, fontSize: 24, color: C.ink }}>Mis entregas</div>
          {name && <div style={{ fontSize: 13, color: C.inkSoft }}>Hola, {name}</div>}
        </div>
        <button onClick={signOut} style={{ background: 'none', border: `1px solid ${C.line}`, borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontFamily: C.ui, fontWeight: 600, fontSize: 13, color: C.inkSoft }}>Salir</button>
      </div>

      {error && <div style={{ background: '#FCE9E7', color: C.coralPress, borderRadius: 12, padding: '12px 14px', fontSize: 13.5, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {active.map(card)}
        {active.length === 0 && !error && (
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: '40px 20px', textAlign: 'center', color: C.inkSoft, fontSize: 14 }}>
            Sin entregas asignadas por ahora.
          </div>
        )}
        {done.length > 0 && (
          <>
            <div style={{ fontFamily: C.display, fontWeight: 700, fontSize: 15, color: C.inkSoft, marginTop: 10 }}>Entregados</div>
            {done.map(card)}
          </>
        )}
      </div>

      {deliverFor && (
        <DeliverModal
          order={deliverFor}
          onClose={() => setDeliverFor(null)}
          onConfirm={code => confirmDeliver(deliverFor.id, code)}
        />
      )}
    </div>
  )
}

// Modal para confirmar la entrega con el código que da el cliente. El repartidor
// no conoce el código: lo pide al recibir y lo captura; el servidor lo valida.
function DeliverModal({ order, onClose, onConfirm }: { order: CourierOrder; onClose: () => void; onConfirm: (code: string) => Promise<{ ok: boolean; codeMismatch?: boolean }> }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const c = code.trim()
    if (c.length < 4 || busy) return
    setBusy(true); setError(null)
    const res = await onConfirm(c)
    if (res.ok) { onClose(); return }
    setBusy(false)
    setError(res.codeMismatch ? 'Código incorrecto. Pídeselo de nuevo al cliente.' : 'No se pudo confirmar. Intenta otra vez.')
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(34,28,25,.45)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, background: C.surface, borderRadius: 20, padding: '22px 22px 20px', boxShadow: '0 12px 40px rgba(34,28,25,.24)' }}>
        <div style={{ fontFamily: C.display, fontWeight: 800, fontSize: 19, color: C.ink }}>Confirmar entrega</div>
        <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.5 }}>
          Pídele su código a {order.customer_name || 'el cliente'} al entregar el pedido.
        </div>
        <input
          value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          inputMode="numeric" autoFocus placeholder="0000" maxLength={4}
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 16, padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${error ? C.coral : C.line}`, background: C.bg, fontFamily: C.display, fontWeight: 800, fontSize: 26, letterSpacing: '.4em', textAlign: 'center', color: C.ink, outline: 'none' }}
        />
        {error && <div style={{ color: C.coralPress, fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 999, border: `1px solid ${C.line}`, background: C.surface, color: C.ink, fontFamily: C.ui, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={submit} disabled={code.trim().length < 4 || busy}
            style={{ flex: 1.4, padding: '12px 0', borderRadius: 999, border: 'none', background: code.trim().length < 4 || busy ? C.line : C.jade, color: '#fff', fontFamily: C.ui, fontWeight: 700, fontSize: 14, cursor: code.trim().length < 4 || busy ? 'default' : 'pointer' }}>
            {busy ? 'Confirmando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12, border: `1px solid ${C.line}`, background: C.surface, fontFamily: C.ui, fontSize: 15, color: C.ink, outline: 'none' }
function btn(bg: string): React.CSSProperties {
  return { flex: 1, padding: '13px 0', borderRadius: 999, border: 'none', background: bg, color: '#fff', fontFamily: C.ui, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }
}
