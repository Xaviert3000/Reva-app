import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config para la app cliente de Reva (iOS).
 *
 * Modelo: la app nativa es un contenedor que CARGA la web hospedada
 * (Next.js corre en Vercel con sus API routes, auth de Supabase y Stripe).
 *
 * ── QUÉ TIENES QUE CAMBIAR ──────────────────────────────────────────
 * Cuando publiques la web en Vercel, pon aquí su URL en `server.url`.
 * Mientras desarrollas, puedes apuntar a tu dev server en la IP local
 * (ej. http://192.168.1.10:3000) para probar en el simulador/dispositivo.
 * ────────────────────────────────────────────────────────────────────
 */
const config: CapacitorConfig = {
  appId: 'com.reva.app',
  appName: 'Reva',
  // `webDir` es el fallback local; el contenido real llega desde server.url.
  webDir: 'www',
  server: {
    // 👇 REEMPLAZA por tu URL pública de Vercel cuando la tengas.
    // Ejemplo: 'https://reva.vercel.app'
    url: 'https://REEMPLAZA-CON-TU-URL.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#F5F0E8', // fondo crema de Reva
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
