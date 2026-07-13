// Bilingual dictionary for the marketing landing page.
// Spanish is the default (route `/`); English is served at `/en`.
// Plain module (no `server-only`) so the client LandingPage component can import it.

export type Lang = 'es' | 'en'

// Canonical URLs for the marketing pages in each language. English uses `/en/*`
// with English slugs; the ES/EN toggle and cross-page nav resolve hrefs from here.
export const marketingRoutes = {
  home: { es: '/', en: '/en' },
  howItWorks: { es: '/como-funciona', en: '/en/how-it-works' },
  forBusiness: { es: '/para-negocios', en: '/en/for-business' },
} as const

export type MarketingRoute = keyof typeof marketingRoutes

export function route(name: MarketingRoute, lang: Lang): string {
  return marketingRoutes[name][lang]
}

export interface LandingDict {
  nav: {
    home: string
    howItWorks: string
    forBusiness: string
    download: string
  }
  hero: {
    eyebrow: string
    // title is split so the accented fragment can be wrapped in <em>
    titleBefore: string
    titleAccent: string
    titleAfter: string
    lede: string
    storeSubApple: string
    storeBigApple: string
    storeSubGoogle: string
    storeBigGoogle: string
    ratingNote: string
    chipNegotiatingLabel: string
    chipNegotiatingValue: string
    chipConfirmedLabel: string
    chipConfirmedValue: string
  }
  trust: {
    label: string
  }
  paths: {
    eyebrow: string
    title: string
    explorerTag: string
    explorerTitle: string
    explorerBody: string
    localTag: string
    localTitle: string
    localBody: string
    cta: string
  }
  how: {
    eyebrow: string
    title: string
    lede: string
    step1Label: string
    step1Title: string
    step1Body: string
    step2Label: string
    step2Title: string
    step2Body: string
    step3Label: string
    step3Title: string
    step3Body: string
    cta: string
  }
  magic: {
    eyebrow: string
    title: string
    lede: string
    s1Label: string
    s1Msg: string
    s1Sub: string
    s2Label: string
    s2Msg: string
    s2Sub: string
    s3Label: string
    s3Msg: string
    s3Sub: string
  }
  modes: {
    eyebrow: string
    title: string
    explorerBadge: string
    explorerTitle: string
    explorerBody: string
    vecinoBadge: string
    vecinoTitle: string
    vecinoBody: string
  }
  rove: {
    eyebrow: string
    title: string
    body: string
    pill1: string
    pill2: string
    pill3: string
    points: string
    reward1Title: string
    reward1Sub: string
    reward2Title: string
    reward2Sub: string
  }
  testimonials: {
    eyebrow: string
    title: string
    q1: string
    q1Role: string
    q2: string
    q2Role: string
    q3: string
    q3Role: string
  }
  business: {
    eyebrow: string
    title: string
    lede: string
    cta: string
  }
  faq: {
    eyebrow: string
    title: string
    items: { q: string; a: string }[]
  }
  finalCta: {
    title: string
    lede: string
  }
  footer: {
    tagline: string
    productTitle: string
    productLinks: { label: string; href: string }[]
    businessTitle: string
    businessLinks: { label: string; href: string }[]
    companyTitle: string
    companyLinks: { label: string; href: string }[]
    copyright: string
  }
}

const es: LandingDict = {
  nav: {
    home: 'Inicio',
    howItWorks: 'Cómo funciona',
    forBusiness: 'Para negocios',
    download: 'Descargar',
  },
  hero: {
    eyebrow: 'Concierge local de IA · Los Cabos',
    titleBefore: 'Un amigo local muy ',
    titleAccent: 'bien conectado',
    titleAfter: ', en tu bolsillo.',
    lede: 'Dile a Reva qué se te antoja y ella lo resuelve — encuentra el lugar, negocia con el negocio y deja la reserva lista. Sin llamadas, sin filas, sin hablar español si no quieres.',
    storeSubApple: 'Descarga en el',
    storeBigApple: 'App Store',
    storeSubGoogle: 'Consíguelo en',
    storeBigGoogle: 'Google Play',
    ratingNote: 'Curado por locales de Los Cabos',
    chipNegotiatingLabel: 'Reva negociando',
    chipNegotiatingValue: 'Mesa para 2 · 20:30',
    chipConfirmedLabel: 'Confirmado',
    chipConfirmedValue: 'Te esperan a las 20:30',
  },
  trust: {
    label: 'Reserva en los lugares favoritos de los locales',
  },
  paths: {
    eyebrow: 'Una app, dos formas de vivirla',
    title: '¿Cómo quieres que aparezca Reva?',
    explorerTag: 'Modo Explorer · Visitas',
    explorerTitle: 'Vive Los Cabos como local',
    explorerBody: 'Recomendaciones curadas, en inglés, sin clichés de playa. Reva reserva por ti aunque no hables español.',
    localTag: 'Modo Vecino · Locales',
    localTitle: 'Resuélvelo en dos toques',
    localBody: '“Resérvame lo de siempre”, boletos Reva+ y tus lugares de cabecera, siempre a la mano.',
    cta: 'Descargar la app',
  },
  how: {
    eyebrow: 'Cómo funciona',
    title: 'De un antojo a una reserva confirmada.',
    lede: 'Tú hablas en lenguaje normal. Reva hace el trabajo pesado por detrás.',
    step1Label: 'Paso 01',
    step1Title: 'Dile qué se te antoja',
    step1Body: '“Tacos donde van los locales”, “masaje en pareja mañana”, “algo para la noche”. Escribe o habla, en inglés o español.',
    step2Label: 'Paso 02',
    step2Title: 'Reva negocia por ti',
    step2Body: 'Contacta al negocio agente a agente, checa disponibilidad y acuerda la hora, la mesa y los extras — en vivo.',
    step3Label: 'Paso 03',
    step3Title: 'Listo, sin que muevas un dedo',
    step3Body: 'Recibes la confirmación con todos los detalles. Pago seguro y cancelación clara, siempre a la vista.',
    cta: 'Ver el momento mágico',
  },
  magic: {
    eyebrow: 'El momento mágico',
    title: 'Reva habla con el negocio. Tú solo ves “listo”.',
    lede: 'Hacemos visible la negociación agente a agente, para que la espera nunca se sienta muerta.',
    s1Label: 'Paso 1 · consultando',
    s1Msg: 'Reva está hablando con La Lupita…',
    s1Sub: 'Checando terraza para 2, hoy',
    s2Label: 'Paso 2 · en vivo',
    s2Msg: 'Confirmando mesa para 2 a las 20:30',
    s2Sub: 'Mesa tranquila en la terraza ✓',
    s3Label: 'Paso 3 · éxito',
    s3Msg: '¡Reservado! Te esperan a las 20:30',
    s3Sub: 'Cancelación gratis hasta 2 h antes',
  },
  modes: {
    eyebrow: 'Dos modos, un solo Reva',
    title: 'El mismo motor. Tu idioma, tu ritmo.',
    explorerBadge: 'Modo Explorer',
    explorerTitle: 'Para quien está de visita',
    explorerBody: 'Inglés, curaduría y confianza: reseñas de locales, cancelación clara y pago seguro, siempre a la vista.',
    vecinoBadge: 'Modo Vecino',
    vecinoTitle: 'Para quien ya es de aquí',
    vecinoBody: 'Español, velocidad y lo de siempre: tus lugares de cabecera, boletos Reva+ y “resérvame lo de siempre”.',
  },
  rove: {
    eyebrow: 'Reva+ · recompensas locales',
    title: 'Cada reserva suma. Canjéala por lo bueno.',
    body: 'Reva+ convierte tus salidas en boletos: cenas, mezcal, sunsets y experiencias que solo conocen los de aquí. Más usas Reva, mejor te trata Los Cabos.',
    pill1: '🎟 Boletos canjeables',
    pill2: '★ Perks de locales',
    pill3: '∞ Sin caducidad sorpresa',
    points: 'puntos',
    reward1Title: 'Mezcal flight · La Lupita',
    reward1Sub: 'Cata de 5 mezcales',
    reward2Title: 'Sunset Sail · Cabo Azul',
    reward2Sub: 'Champaña a bordo',
  },
  testimonials: {
    eyebrow: 'Lo que dicen',
    title: 'Turistas y locales, de acuerdo en algo.',
    q1: '“Llegué sin plan y sin hablar español. Le pedí ‘cena romántica esta noche’ y a los dos minutos tenía mesa en un lugar que jamás habría encontrado.”',
    q1Role: 'Explorer · San Diego',
    q2: '“Como local, lo uso para lo de siempre: ‘resérvame los tacos del jueves’. Dos toques y ya. Y los boletos Reva+ son un golazo.”',
    q2Role: 'Vecino · San José del Cabo',
    q3: '“Le dije ‘masaje en pareja con vista al mar’ y negoció hasta la cabaña. Sentí que tenía un concierge de hotel cinco estrellas en el bolsillo.”',
    q3Role: 'Explorer · Seattle',
  },
  business: {
    eyebrow: 'Para negocios',
    title: '¿Tienes un negocio local?',
    lede: 'Reva te trae clientes que ya quieren reservar — turistas y locales — y negocia con tu agente, no con tu recepción. Tú solo apruebas y llenas.',
    cta: 'Más información',
  },
  faq: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Lo que todos preguntan',
    items: [
      { q: '¿Reva es gratis?', a: 'Sí. Descargar y usar Reva no cuesta nada para ti. Solo pagas lo que reservas — y muchas veces sin depósito.' },
      { q: '¿Tengo que hablar español?', a: 'No. En modo Explorer todo funciona en inglés y Reva negocia en español por ti. En modo Vecino todo está en español.' },
      { q: '¿Cómo reserva Reva por mí?', a: 'Reva se comunica con el sistema del negocio agente a agente: checa disponibilidad real, acuerda hora y detalles, y te devuelve la confirmación. Nada de listas de espera falsas.' },
      { q: '¿Qué es Reva+?', a: 'Reva+ es el programa de recompensas. Cada reserva suma puntos que canjeas por experiencias y perks de negocios locales.' },
      { q: '¿Lo destacado es publicidad disfrazada?', a: 'No. Cuando un negocio paga por aparecer, lo verás marcado claramente como "Destacado". Nunca disfrazamos lo pagado de recomendación orgánica.' },
    ],
  },
  finalCta: {
    title: 'Tu próxima salida empieza con una frase.',
    lede: 'Descarga Reva y deja que Los Cabos te trate como local.',
  },
  footer: {
    tagline: 'Tu concierge local de IA. Hecho aquí, para los de aquí y para quien nos visita.',
    productTitle: 'Producto',
    productLinks: [
      { label: 'Inicio', href: '/' },
      { label: 'Cómo funciona', href: '/como-funciona' },
      { label: 'Descargar app', href: '#descargar' },
      { label: 'Reva+', href: '/como-funciona#rove' },
    ],
    businessTitle: 'Negocios',
    businessLinks: [
      { label: 'Para negocios', href: '/para-negocios' },
      { label: 'Planes', href: '/para-negocios#precios' },
      { label: 'Registrar negocio', href: '/biz/register' },
    ],
    companyTitle: 'Reva',
    companyLinks: [
      { label: 'Sobre nosotros', href: '#' },
      { label: 'Privacidad', href: '/privacidad' },
      { label: 'Términos', href: '/terminos' },
      { label: 'Contacto', href: '#' },
    ],
    copyright: '© 2026 Reva',
  },
}

const en: LandingDict = {
  nav: {
    home: 'Home',
    howItWorks: 'How it works',
    forBusiness: 'For business',
    download: 'Download',
  },
  hero: {
    eyebrow: 'AI local concierge · Los Cabos',
    titleBefore: 'A very ',
    titleAccent: 'well-connected',
    titleAfter: ' local friend, in your pocket.',
    lede: 'Tell Reva what you’re in the mood for and she sorts it out — finds the spot, negotiates with the business and gets your booking done. No calls, no lines, no need to speak Spanish unless you want to.',
    storeSubApple: 'Download on the',
    storeBigApple: 'App Store',
    storeSubGoogle: 'Get it on',
    storeBigGoogle: 'Google Play',
    ratingNote: 'Curated by Los Cabos locals',
    chipNegotiatingLabel: 'Reva negotiating',
    chipNegotiatingValue: 'Table for 2 · 8:30 PM',
    chipConfirmedLabel: 'Confirmed',
    chipConfirmedValue: 'They’re expecting you at 8:30',
  },
  trust: {
    label: 'Book the places locals love',
  },
  paths: {
    eyebrow: 'One app, two ways to live it',
    title: 'How do you want Reva to show up?',
    explorerTag: 'Explorer Mode · Visitors',
    explorerTitle: 'Experience Los Cabos like a local',
    explorerBody: 'Curated recommendations, in English, no beach clichés. Reva books for you even if you don’t speak Spanish.',
    localTag: 'Neighbor Mode · Locals',
    localTitle: 'Sort it out in two taps',
    localBody: '“Book me the usual,” Reva+ tickets and your go-to spots, always within reach.',
    cta: 'Download the app',
  },
  how: {
    eyebrow: 'How it works',
    title: 'From a craving to a confirmed booking.',
    lede: 'You speak in plain language. Reva does the heavy lifting behind the scenes.',
    step1Label: 'Step 01',
    step1Title: 'Tell it what you’re craving',
    step1Body: '“Tacos where the locals go,” “couples massage tomorrow,” “something for tonight.” Type or talk, in English or Spanish.',
    step2Label: 'Step 02',
    step2Title: 'Reva negotiates for you',
    step2Body: 'It reaches the business agent to agent, checks availability and locks in the time, the table and the extras — live.',
    step3Label: 'Step 03',
    step3Title: 'Done, without lifting a finger',
    step3Body: 'You get the confirmation with every detail. Secure payment and clear cancellation, always in plain sight.',
    cta: 'See the magic moment',
  },
  magic: {
    eyebrow: 'The magic moment',
    title: 'Reva talks to the business. You just see “done.”',
    lede: 'We make the agent-to-agent negotiation visible, so the wait never feels dead.',
    s1Label: 'Step 1 · checking',
    s1Msg: 'Reva is talking to La Lupita…',
    s1Sub: 'Checking the terrace for 2, today',
    s2Label: 'Step 2 · live',
    s2Msg: 'Confirming a table for 2 at 8:30 PM',
    s2Sub: 'Quiet table on the terrace ✓',
    s3Label: 'Step 3 · success',
    s3Msg: 'Booked! They’re expecting you at 8:30',
    s3Sub: 'Free cancellation up to 2 h before',
  },
  modes: {
    eyebrow: 'Two modes, one Reva',
    title: 'Same engine. Your language, your pace.',
    explorerBadge: 'Explorer Mode',
    explorerTitle: 'For those just visiting',
    explorerBody: 'English, curation and trust: local reviews, clear cancellation and secure payment, always in plain sight.',
    vecinoBadge: 'Neighbor Mode',
    vecinoTitle: 'For those already from here',
    vecinoBody: 'Spanish, speed and the usual: your go-to spots, Reva+ tickets and “book me the usual.”',
  },
  rove: {
    eyebrow: 'Reva+ · local rewards',
    title: 'Every booking adds up. Redeem it for the good stuff.',
    body: 'Reva+ turns your outings into tickets: dinners, mezcal, sunsets and experiences only the locals know. The more you use Reva, the better Los Cabos treats you.',
    pill1: '🎟 Redeemable tickets',
    pill2: '★ Local perks',
    pill3: '∞ No surprise expiration',
    points: 'points',
    reward1Title: 'Mezcal flight · La Lupita',
    reward1Sub: 'Tasting of 5 mezcals',
    reward2Title: 'Sunset Sail · Cabo Azul',
    reward2Sub: 'Champagne on board',
  },
  testimonials: {
    eyebrow: 'What they say',
    title: 'Tourists and locals, agreeing on something.',
    q1: '“I showed up with no plan and no Spanish. I asked for a ‘romantic dinner tonight’ and two minutes later I had a table at a place I’d never have found.”',
    q1Role: 'Explorer · San Diego',
    q2: '“As a local, I use it for the usual: ‘book me the Thursday tacos.’ Two taps and done. And the Reva+ tickets are a total win.”',
    q2Role: 'Neighbor · San José del Cabo',
    q3: '“I said ‘couples massage with an ocean view’ and it negotiated all the way to the cabana. Felt like I had a five-star hotel concierge in my pocket.”',
    q3Role: 'Explorer · Seattle',
  },
  business: {
    eyebrow: 'For business',
    title: 'Run a local business?',
    lede: 'Reva brings you customers who already want to book — tourists and locals — and negotiates with your agent, not your front desk. You just approve and fill up.',
    cta: 'Learn more',
  },
  faq: {
    eyebrow: 'Frequently asked',
    title: 'What everyone asks',
    items: [
      { q: 'Is Reva free?', a: 'Yes. Downloading and using Reva costs you nothing. You only pay for what you book — and often with no deposit.' },
      { q: 'Do I have to speak Spanish?', a: 'No. In Explorer Mode everything works in English and Reva negotiates in Spanish for you. In Neighbor Mode everything is in Spanish.' },
      { q: 'How does Reva book for me?', a: 'Reva talks to the business system agent to agent: it checks real availability, agrees on time and details, and hands you back the confirmation. No fake waitlists.' },
      { q: 'What is Reva+?', a: 'Reva+ is the rewards program. Every booking earns points you redeem for experiences and perks from local businesses.' },
      { q: 'Are featured spots ads in disguise?', a: 'No. When a business pays to appear, you’ll see it clearly marked as “Featured.” We never disguise paid placement as an organic recommendation.' },
    ],
  },
  finalCta: {
    title: 'Your next outing starts with one sentence.',
    lede: 'Download Reva and let Los Cabos treat you like a local.',
  },
  footer: {
    tagline: 'Your AI local concierge. Made here, for those from here and those visiting.',
    productTitle: 'Product',
    productLinks: [
      { label: 'Home', href: '/en' },
      { label: 'How it works', href: '/en/how-it-works' },
      { label: 'Download app', href: '#descargar' },
      { label: 'Reva+', href: '/en/how-it-works#rove' },
    ],
    businessTitle: 'Business',
    businessLinks: [
      { label: 'For business', href: '/en/for-business' },
      { label: 'Plans', href: '/en/for-business#precios' },
      { label: 'Register business', href: '/biz/register' },
    ],
    companyTitle: 'Reva',
    companyLinks: [
      { label: 'About us', href: '#' },
      { label: 'Privacy', href: '/en/privacy' },
      { label: 'Terms', href: '/en/terms' },
      { label: 'Contact', href: '#' },
    ],
    copyright: '© 2026 Reva',
  },
}

export const dictionaries: Record<Lang, LandingDict> = { es, en }

export function getLandingDict(lang: Lang): LandingDict {
  return dictionaries[lang]
}
