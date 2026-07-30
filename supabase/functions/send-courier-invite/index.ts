import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Envía al repartidor recién agregado su correo de acceso al panel /courier:
// su correo, la clave temporal que generó Reva y un botón para entrar. Réplica de
// send-team-invite con copy de "eres repartidor".
// Desplegar con: supabase functions deploy send-courier-invite

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Reva <onboarding@resend.dev>'

interface InvitePayload {
  email: string
  name?: string
  bizName?: string
  tempPassword: string
  courierUrl: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload: InvitePayload = await req.json()
    const { email, name, bizName, tempPassword, courierUrl } = payload

    if (!email || !tempPassword || !courierUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const hi = name ? `Hola ${name},` : 'Hola,'
    const forBiz = bizName ? `<strong style="color:#221C19;">${bizName}</strong>` : 'un negocio en Reva'

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Acceso de repartidor · Reva</title>
</head>
<body style="margin:0;padding:0;background:#FAF5EE;font-family:'Helvetica Neue',Arial,sans-serif;color:#221C19;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#E8505B;border-radius:11px;width:38px;height:38px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:22px;font-weight:900;line-height:38px;">R</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <div style="font-weight:900;font-size:20px;color:#221C19;line-height:1;">Reva</div>
                    <div style="font-size:10px;color:#A89E94;font-weight:700;letter-spacing:.06em;">REPARTIDOR</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:20px;border:1px solid #E9E0D5;padding:36px 36px 32px;">
              <h1 style="font-size:24px;font-weight:900;color:#221C19;margin:0 0 10px;">
                Eres repartidor en Reva 🛵
              </h1>
              <p style="font-size:15px;color:#6B615A;line-height:1.6;margin:0 0 20px;">
                ${hi} ${forBiz} te agregó como repartidor. Entra al panel de entregas
                para ver y gestionar tus pedidos asignados.
              </p>

              <!-- Credenciales -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EE;border:1px solid #E9E0D5;border-radius:14px;margin-bottom:24px;">
                <tr><td style="padding:16px 18px;">
                  <div style="font-size:12px;color:#A89E94;font-weight:700;letter-spacing:.05em;margin-bottom:4px;">TU CORREO</div>
                  <div style="font-size:15px;color:#221C19;font-weight:700;margin-bottom:14px;">${email}</div>
                  <div style="font-size:12px;color:#A89E94;font-weight:700;letter-spacing:.05em;margin-bottom:4px;">CLAVE TEMPORAL</div>
                  <div style="font-size:18px;color:#221C19;font-weight:900;letter-spacing:.02em;font-family:'Courier New',monospace;">${tempPassword}</div>
                </td></tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#E8505B;border-radius:14px;padding:0;">
                    <a href="${courierUrl}" target="_blank"
                       style="display:inline-block;padding:15px 32px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;">
                      Entrar al panel de repartidor →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12.5px;color:#A89E94;margin:0;line-height:1.6;">
                Inicia sesión con tu correo y la clave temporal de arriba.<br/>
                Si no esperabas este correo, puedes ignorarlo.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;font-size:12px;color:#A89E94;line-height:1.7;">
              Reva · Los Cabos, Baja California Sur<br/>
              <a href="https://reva.mx" style="color:#A89E94;">reva.mx</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: bizName ? `Eres repartidor de ${bizName} en Reva` : 'Eres repartidor en Reva',
        html,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('Resend error:', resendData)
      return new Response(JSON.stringify({ error: 'Email delivery failed', detail: resendData }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, id: resendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('send-courier-invite error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
