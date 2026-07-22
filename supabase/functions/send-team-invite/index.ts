import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Envía el correo de invitación al equipo Reva (operadores / analistas).
// Réplica de send-biz-invite pero con copy de "unirse al equipo" en vez de
// "dar de alta un negocio". Desplegar con: supabase functions deploy send-team-invite

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Reva <onboarding@resend.dev>'

interface InvitePayload {
  email: string
  role: string          // 'Operador' | 'Analista'
  inviteUrl: string
  invitedBy?: string
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
    const { email, role, inviteUrl, invitedBy } = payload

    if (!email || !role || !inviteUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const perms = role === 'Analista'
      ? 'acceso de solo lectura a las métricas de la plataforma'
      : 'acceso a soporte, moderación y reservas'

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación al equipo Reva</title>
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
                    <div style="font-size:10px;color:#A89E94;font-weight:700;letter-spacing:.06em;">PANEL DE SUPER ADMINISTRADOR</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:20px;border:1px solid #E9E0D5;padding:36px 36px 32px;">
              <h1 style="font-size:24px;font-weight:900;color:#221C19;margin:0 0 10px;">
                Te invitaron al equipo Reva 🎉
              </h1>
              <p style="font-size:15px;color:#6B615A;line-height:1.6;margin:0 0 24px;">
                ${invitedBy ? `<strong style="color:#221C19;">${invitedBy}</strong> te ha invitado` : 'Te han invitado'}
                a unirte al panel de administración de Reva como
                <strong style="color:#221C19;">${role}</strong>, con ${perms}.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#E8505B;border-radius:14px;padding:0;">
                    <a href="${inviteUrl}" target="_blank"
                       style="display:inline-block;padding:15px 32px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;">
                      Aceptar invitación →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12.5px;color:#A89E94;margin:0;line-height:1.6;">
                Este enlace es válido por <strong>7 días</strong> y es de uso único.<br/>
                Si no esperabas esta invitación, puedes ignorar este correo.
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
        subject: 'Tienes una invitación para unirte al equipo Reva',
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
    console.error('send-team-invite error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
