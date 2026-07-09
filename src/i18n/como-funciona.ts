import type { Lang } from './landing'

export interface HowStep {
  n: string
  title: string
  body: string
  chips: string[]
}

export interface HowDict {
  navHome: string
  navHowItWorks: string
  navForBusiness: string
  navCta: string
  eyebrow: string
  // title split across two lines with a <br />
  titleLine1: string
  titleLine2: string
  lede: string
  steps: HowStep[]
  ctaTitle: string
  ctaBody: string
  ctaButton: string
}

const es: HowDict = {
  navHome: 'Inicio',
  navHowItWorks: 'Cómo funciona',
  navForBusiness: 'Para negocios',
  navCta: 'Probar Reva',
  eyebrow: 'Cómo funciona',
  titleLine1: 'Del deseo a la reserva',
  titleLine2: 'en segundos',
  lede: 'Reva no es un directorio con chat encima. Es una conversación que termina en una transacción resuelta.',
  steps: [
    {
      n: '01',
      title: 'Le hablas a Reva',
      body: 'Di lo que quieres en tus palabras — no hay formularios, no hay filtros. "Mesa para 2 esta noche, algo tranquilo" es suficiente. Reva entiende contexto, estado de ánimo e intención.',
      chips: ['"Resérvame lo de siempre"', '"Planes para el atardecer"', '"Necesito cita con el dentista"'],
    },
    {
      n: '02',
      title: 'Reva busca y propone',
      body: 'En segundos Reva consulta los negocios disponibles con agente activo. Te muestra opciones curadas con foto, rating de locales, distancia y precio aproximado — sin publicidad disfrazada.',
      chips: ['★ 4.8 · Favorito local', '📍 2.4 km', '$$ · Precio justo'],
    },
    {
      n: '03',
      title: 'El agente negocia en vivo',
      body: 'Aquí está la magia: el agente de Reva conecta en tiempo real con el agente del negocio. Consigue tu lugar, horario y condiciones — sin que nadie tenga que contestar el teléfono.',
      chips: ['Reva consultando…', '→ Agente de La Lupita', '← Terraza disponible ✓'],
    },
    {
      n: '04',
      title: 'Confirmación instantánea',
      body: 'Recibes confirmación en el chat en segundos. Si aplica depósito, lo pagas ahí mismo con tarjeta o SPEI. Sin llamadas, sin WhatsApp, sin esperar.',
      chips: ['🎉 ¡Reservado!', 'Mesa para 2 · 20:30', 'Terraza · Aniversario'],
    },
    {
      n: '05',
      title: 'Ganas boletos Reva+',
      body: 'Cada reserva completada suma boletos al sorteo semanal. Precios reales — vuelos, cenas, experiencias. Cuanto más usas Reva, más chances tienes.',
      chips: ['+2 boletos ganados', '🎟️ 7 boletos esta semana', '🎁 Sorteo dominical'],
    },
  ],
  ctaTitle: '¿Lista para probarlo?',
  ctaBody: 'Gratis para usuarios. Sin descargas por ahora — prueba la versión web.',
  ctaButton: 'Abrir Reva →',
}

const en: HowDict = {
  navHome: 'Home',
  navHowItWorks: 'How it works',
  navForBusiness: 'For business',
  navCta: 'Try Reva',
  eyebrow: 'How it works',
  titleLine1: 'From a wish to a booking',
  titleLine2: 'in seconds',
  lede: 'Reva isn’t a directory with a chat bolted on. It’s a conversation that ends in a done deal.',
  steps: [
    {
      n: '01',
      title: 'You talk to Reva',
      body: 'Say what you want in your own words — no forms, no filters. "Table for 2 tonight, somewhere quiet" is enough. Reva gets context, mood and intent.',
      chips: ['"Book me the usual"', '"Sunset plans"', '"I need a dentist appointment"'],
    },
    {
      n: '02',
      title: 'Reva searches and suggests',
      body: 'In seconds Reva checks the businesses with an active agent. It shows you curated options with a photo, local rating, distance and rough price — no ads in disguise.',
      chips: ['★ 4.8 · Local favorite', '📍 2.4 km', '$$ · Fair price'],
    },
    {
      n: '03',
      title: 'The agent negotiates live',
      body: 'Here’s the magic: Reva’s agent connects in real time with the business’s agent. It secures your spot, time and terms — without anyone picking up the phone.',
      chips: ['Reva checking…', '→ La Lupita’s agent', '← Terrace available ✓'],
    },
    {
      n: '04',
      title: 'Instant confirmation',
      body: 'You get confirmation in the chat within seconds. If a deposit applies, you pay it right there by card or SPEI. No calls, no WhatsApp, no waiting.',
      chips: ['🎉 Booked!', 'Table for 2 · 8:30 PM', 'Terrace · Anniversary'],
    },
    {
      n: '05',
      title: 'You earn Reva+ tickets',
      body: 'Every completed booking adds tickets to the weekly draw. Real prizes — flights, dinners, experiences. The more you use Reva, the better your odds.',
      chips: ['+2 tickets earned', '🎟️ 7 tickets this week', '🎁 Sunday draw'],
    },
  ],
  ctaTitle: 'Ready to try it?',
  ctaBody: 'Free for users. No downloads for now — try the web version.',
  ctaButton: 'Open Reva →',
}

const dictionaries: Record<Lang, HowDict> = { es, en }

export function getHowDict(lang: Lang): HowDict {
  return dictionaries[lang]
}
