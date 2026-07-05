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
    // La app abre directo en la experiencia de cliente (ruta /app),
    // no en la landing de marketing (raíz).
    // ── PRODUCCIÓN (activo): ──
    url: 'https://reva-app-ten.vercel.app/app',
    // IMPORTANTE: sin esto, Capacitor compara la navegación contra la URL
    // COMPLETA (incluyendo `/app`), así que rutas como `/auth/register` o
    // `/auth/login` se consideran "externas" y se abren en Safari en vez de
    // quedarse dentro de la app. Al whitelistar el host, TODA navegación al
    // mismo dominio se mantiene dentro del webview.
    allowNavigation: ['reva-app-ten.vercel.app'],
    cleartext: false,
    // ── DEV LOCAL (para probar en el simulador contra `npm run dev`):
    //    comenta las 2 líneas de arriba y descomenta estas 2, luego `npx cap sync ios`.
    // url: 'http://localhost:3000/app',
    // cleartext: true,
  },
  ios: {
    // `never`: la web ya maneja los safe-areas por CSS (viewport-fit=cover +
    // env(safe-area-inset-*) en headers y bottom nav). Con `automatic`, WKWebView
    // añade OTRA VEZ esos insets encima → doble inset y un hueco blanco debajo de
    // la barra inferior. `never` deja que el CSS sea la única fuente de verdad y
    // la web ocupa la pantalla de borde a borde.
    contentInset: 'never',
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
