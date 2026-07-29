// Página que ve el CLIENTE en su teléfono al terminar (o cancelar) el pago con
// tarjeta del kiosko, tras escanear el QR. No controla el flujo del kiosko: la
// pantalla del kiosko detecta el pago por su cuenta (sondeo). Aquí sólo se le
// agradece al cliente y se le pide volver a la pantalla del local.
type SP = { status?: string }

export default async function PayDone({ searchParams }: { searchParams: Promise<SP> }) {
  const { status } = await searchParams
  const ok = status !== 'cancel'

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 32,
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        background: '#F7F1EA',
        color: '#221C19',
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: 44,
          background: ok ? '#DCEFE4' : '#F6E0DA',
        }}
        aria-hidden
      >
        {ok ? '✅' : '↩️'}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
        {ok ? '¡Pago recibido! · Payment received!' : 'Pago cancelado · Payment cancelled'}
      </h1>
      <p style={{ fontSize: 16, color: '#6B615B', maxWidth: 360, margin: 0, lineHeight: 1.5 }}>
        {ok
          ? 'Ya puedes volver a la pantalla del local para ver tu número de orden. ¡Gracias! · You can return to the kiosk screen for your order number. Thank you!'
          : 'No se realizó ningún cargo. Vuelve a la pantalla del local para intentarlo de nuevo. · No charge was made. Return to the kiosk screen to try again.'}
      </p>
    </main>
  )
}
