# Push server-side (APNs + FCM)

Cómo activar el envío de notificaciones push a las apps nativas (iOS y Android).

## Cómo funciona

```
Pedido cambia a "ready"/"out_for_delivery"
        │  (trigger de migración 030)
        ▼
INSERT en tabla  notifications   ──► la app lo muestra en la campana (realtime/lectura)
        │  (trigger de migración 034, vía pg_net)
        ▼
POST /api/push/send  (Vercel)
        │  lee device_tokens del usuario
        ├──► APNs  → iPhones del usuario
        └──► FCM   → Androids del usuario
```

Requisitos previos: aplicar las migraciones **033** (`device_tokens`) y **034**
(`push_dispatch`) en Supabase.

## 1. Variables de entorno en Vercel

```
PUSH_WEBHOOK_SECRET   = <un secreto largo aleatorio>

# APNs (iOS)
APNS_KEY        = <contenido del .p8, con \n escapados o multilínea>
APNS_KEY_ID     = <Key ID de la APNs Auth Key>
APNS_TEAM_ID    = <tu Apple Team ID>
APNS_BUNDLE_ID  = com.reva.app
APNS_PRODUCTION = false   # "true" para builds de App Store/TestFlight

# FCM (Android) — del JSON del service account de Firebase
FCM_PROJECT_ID   = <project_id>
FCM_CLIENT_EMAIL = <client_email>
FCM_PRIVATE_KEY  = <private_key, con \n escapados>
```

### Obtener la APNs Auth Key (.p8)
Apple Developer → Certificates, IDs & Profiles → **Keys** → crea una key con
**Apple Push Notifications service (APNs)** habilitado. Descarga el `.p8` (solo
una vez) y anota el **Key ID**. El Team ID está arriba a la derecha de la consola.

### Obtener el service account de FCM
Firebase Console → tu proyecto → ⚙ → **Service accounts** → *Generate new private
key*. Del JSON copia `project_id`, `client_email` y `private_key`.

## 2. Configurar la BD (una sola vez, en el SQL Editor de Supabase)

```sql
alter database postgres set app.push_endpoint = 'https://reva-app-ten.vercel.app/api/push/send';
alter database postgres set app.push_secret   = '<el mismo PUSH_WEBHOOK_SECRET>';
```

El trigger `034` lee esos ajustes; si `app.push_endpoint` no está, no hace nada
(seguro para entornos sin push).

## 3. Probar

Con un usuario que tenga un token en `device_tokens`:

```bash
curl -X POST https://reva-app-ten.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -H "x-push-secret: <PUSH_WEBHOOK_SECRET>" \
  -d '{"record":{"user_id":"<uuid-del-usuario>","title":"Pedido listo","body":"Tu pedido en La Lupita está listo 🎉"}}'
```

Respuesta: `{ "apnsSent": n, "fcmSent": m, "pruned": k }`. `pruned` = tokens
inválidos (dispositivos desinstalados) que la ruta borra automáticamente.

## Notas

- El cliente de push YA está en ambas apps: registran su token en `device_tokens`
  (iOS `platform=ios`, Android `platform=android`).
- La ruta firma los JWT de APNs (ES256) y FCM (RS256) con `node:crypto` — sin
  dependencias nuevas. Corre en runtime Node (no Edge).
- Alternativa al trigger `pg_net`: un **Database Webhook** de Supabase (dashboard)
  sobre INSERT en `notifications` que apunte a `/api/push/send` con la cabecera
  `x-push-secret`. Si lo usas, no necesitas la migración 034.
