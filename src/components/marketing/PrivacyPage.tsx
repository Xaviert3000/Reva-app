import Link from 'next/link'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { RevaMark } from '@/components/ui/RevaMark'
import { Btn } from '@/components/ui/Btn'
import { route, type Lang } from '@/i18n/landing'

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'sub'; text: string }
  | { type: 'callout'; title?: string; text: string }

type Section = { n: string; title: string; blocks: Block[] }

const SECTIONS: Section[] = [
  {
    n: '1',
    title: 'Responsable del Tratamiento de los Datos',
    blocks: [
      { type: 'p', text: 'El responsable del tratamiento de tus datos personales es Reva, con domicilio en Los Cabos, Baja California Sur, México. Para cualquier asunto relacionado con el tratamiento de tus datos personales, puedes contactarnos en:' },
      { type: 'ul', items: [
        'Correo electrónico: privacidad@reva.mx',
        'A través de la sección "Ayuda" dentro de la Aplicación.',
        'Sitio web: reva-app-ten.vercel.app',
      ] },
    ],
  },
  {
    n: '2',
    title: 'Datos Personales que Recopilamos',
    blocks: [
      { type: 'p', text: 'Dependiendo del modo de uso y las funcionalidades que utilices, Reva puede recopilar las siguientes categorías de datos personales:' },
      { type: 'sub', text: '2.1 Datos que nos proporcionas directamente' },
      { type: 'ul', items: [
        'Nombre completo.',
        'Correo electrónico y número de teléfono.',
        'Idioma de preferencia (inglés o español).',
        'Información de perfil, incluyendo foto opcional.',
        'Preferencias de experiencias y tipos de negocios favoritos.',
        'Historial de reservaciones y establecimientos favoritos (Modo Vecino).',
      ] },
      { type: 'sub', text: '2.2 Datos generados por el uso de la Aplicación' },
      { type: 'ul', items: [
        'Historial de búsquedas e interacciones con el agente de IA Reva.',
        'Conversaciones y mensajes intercambiados con el agente de IA de Reva, los cuales pueden contener de forma implícita información sobre preferencias personales, rutinas, establecimientos visitados u otros datos asociados al Usuario.',
        'Reservaciones realizadas, canceladas o completadas.',
        'Puntos Reva+ acumulados y canjeados.',
        'Valoraciones y comentarios sobre negocios visitados.',
        'Registros de acceso, tiempo de uso y funcionalidades utilizadas.',
      ] },
      { type: 'p', text: 'Con respecto a las conversaciones con el agente de IA, el Usuario acepta expresamente que Reva podrá utilizar dichas conversaciones, previa anonimización que elimine cualquier dato identificable, para los siguientes fines: (i) mejora continua del modelo de inteligencia artificial y sus capacidades de recomendación; (ii) análisis estadístico de patrones de uso; y (iii) entrenamiento y optimización de sistemas de IA. En ningún caso se utilizarán conversaciones con datos personales identificables sin consentimiento adicional del Usuario. El Usuario puede solicitar la exclusión de sus conversaciones de estos procesos enviando una solicitud a privacidad@reva.mx, lo cual no afectará su acceso a la Aplicación.' },
      { type: 'sub', text: '2.3 Datos técnicos y de dispositivo' },
      { type: 'ul', items: [
        'Dirección IP y tipo de dispositivo.',
        'Sistema operativo y versión de la Aplicación.',
        'Identificadores únicos de dispositivo.',
        'Datos de uso y rendimiento de la Aplicación (logs de errores, eventos).',
      ] },
      { type: 'sub', text: '2.4 Datos de ubicación' },
      { type: 'ul', items: [
        'Ubicación geográfica aproximada o precisa, cuando el Usuario otorgue permiso explícito, con el fin de ofrecer recomendaciones y reservaciones relevantes en Los Cabos.',
      ] },
      { type: 'p', text: 'La recopilación de datos de ubicación es opcional. En caso de no otorgar dicho permiso, algunas funcionalidades de la Aplicación podrían estar limitadas.' },
      { type: 'sub', text: '2.5 Datos de terceros proporcionados por el Usuario' },
      { type: 'p', text: 'En caso de que el Usuario proporcione datos personales de terceros (por ejemplo, al realizar una reservación en nombre de un grupo o acompañantes), el Usuario declara y garantiza que cuenta con el consentimiento previo de dichos terceros para compartir su información con Reva, y que dicha información es veraz y actualizada. Reva queda expresamente liberada de toda responsabilidad derivada de datos de terceros proporcionados por el Usuario sin el consentimiento correspondiente. El Usuario asume plena responsabilidad por las consecuencias legales que pudieran derivarse de dicha conducta.' },
      { type: 'sub', text: '2.6 Datos sensibles' },
      { type: 'p', text: 'Reva no recopila, de manera ordinaria, datos personales sensibles (como datos de salud, biométricos, religión u origen racial). En caso de que alguna funcionalidad futura requiera datos sensibles, se solicitará tu consentimiento expreso previo. Reva no asume responsabilidad alguna si el Usuario voluntariamente comparte datos sensibles en campos o interacciones no diseñados para ello.' },
    ],
  },
  {
    n: '3',
    title: 'Finalidades del Tratamiento de Datos',
    blocks: [
      { type: 'p', text: 'Los datos personales que recopilamos son utilizados para las siguientes finalidades:' },
      { type: 'sub', text: '3.1 Finalidades primarias (necesarias para la prestación del servicio)' },
      { type: 'ul', items: [
        'Crear y administrar tu cuenta de usuario en la Aplicación.',
        'Procesar y confirmar reservaciones en negocios locales.',
        'Operar el programa de recompensas Reva+ (acumulación y canje de puntos).',
        'Personalizar las recomendaciones de negocios y experiencias locales en Los Cabos.',
        'Facilitar la comunicación entre el agente de IA Reva y los negocios locales para gestionar reservaciones.',
        'Brindar soporte técnico y atención al cliente.',
        'Cumplir con obligaciones legales y fiscales aplicables.',
      ] },
      { type: 'sub', text: '3.2 Finalidades secundarias (puedes negarte sin afectar el servicio principal)' },
      { type: 'ul', items: [
        'Enviarte comunicaciones de marketing, promociones y novedades de Reva y negocios asociados.',
        'Realizar estudios de mercado y análisis estadísticos del comportamiento de uso.',
        'Compartir contenido relevante sobre Los Cabos, incluyendo eventos y experiencias locales.',
      ] },
      { type: 'p', text: 'Si no deseas que tus datos sean tratados para estas finalidades secundarias, puedes manifestarlo enviando un correo a privacidad@reva.mx o a través de la sección de configuración de tu cuenta en la Aplicación, sin que ello afecte el acceso a las funcionalidades principales de Reva.' },
    ],
  },
  {
    n: '4',
    title: 'Base Legal del Tratamiento',
    blocks: [
      { type: 'p', text: 'El tratamiento de tus datos personales se realiza con base en:' },
      { type: 'ul', items: [
        'Tu consentimiento expreso, manifestado al aceptar esta Política y los Términos y Condiciones al registrarte en la Aplicación.',
        'La ejecución del contrato de servicios entre tú y Reva.',
        'El cumplimiento de obligaciones legales aplicables a Reva.',
        'El interés legítimo de Reva para mejorar sus servicios, prevenir fraudes y garantizar la seguridad de la plataforma.',
      ] },
    ],
  },
  {
    n: '5',
    title: 'Compartición de Datos con Terceros',
    blocks: [
      { type: 'p', text: 'Reva puede compartir tus datos personales con terceros únicamente en los siguientes supuestos:' },
      { type: 'sub', text: '5.1 Negocios locales asociados' },
      { type: 'p', text: 'Para gestionar tu reservación, Reva comparte con el negocio local correspondiente la información estrictamente necesaria: nombre, número de contacto, cantidad de personas y detalles de la reservación.' },
      { type: 'callout', title: 'Descargo por tratamiento de datos por parte de negocios locales', text: 'Una vez que Reva transmite los datos de reservación al negocio local, dicho negocio actúa como responsable independiente del tratamiento de esa información. Reva no controla, supervisa ni es responsable del uso que el negocio local haga de los datos del Usuario una vez recibidos. Cada negocio local está obligado, bajo el Acuerdo de Membresía con Reva, a tratar los datos del Usuario conforme a la LFPDPPP y a no utilizarlos para fines distintos a los de la reservación. Sin embargo, Reva no asume responsabilidad solidaria por incumplimientos del negocio en materia de protección de datos. En caso de uso indebido de datos por parte de un negocio, el Usuario deberá dirigir su reclamación directamente al negocio o ante el INAI.' },
      { type: 'sub', text: '5.2 Proveedores de servicios tecnológicos' },
      { type: 'p', text: 'Reva puede contratar proveedores de servicios de tecnología (como servicios de nube, análisis de datos, procesamiento de pagos o infraestructura de IA) que pueden tener acceso a tus datos como encargados del tratamiento. Dichos proveedores están contractualmente obligados a tratar tus datos únicamente según las instrucciones de Reva y a implementar medidas de seguridad adecuadas. Reva realiza una debida diligencia sobre sus proveedores, pero no asume responsabilidad por incumplimientos de dichos proveedores que escapen al control razonable de Reva.' },
      { type: 'sub', text: '5.3 Requerimientos legales' },
      { type: 'p', text: 'Reva puede divulgar tus datos personales cuando sea requerido por autoridades competentes en cumplimiento de una obligación legal, resolución judicial o para proteger derechos, seguridad o propiedad de Reva, sus usuarios o terceros. Dicha divulgación no constituirá violación a esta Política ni generará responsabilidad alguna para Reva.' },
      { type: 'sub', text: '5.4 Transferencias internacionales' },
      { type: 'p', text: 'En caso de que algún proveedor de servicios tecnológicos tenga sus servidores fuera de México, tus datos podrían ser transferidos internacionalmente. En dichos casos, Reva procurará que dichos proveedores cuenten con niveles de protección equivalentes a los requeridos por la LFPDPPP, pero no puede garantizar que las leyes del país destino sean equivalentes a la legislación mexicana. Al aceptar esta Política, el Usuario consiente expresamente la posibilidad de dichas transferencias internacionales en los términos aquí descritos.' },
      { type: 'p', text: 'Reva no vende, arrienda ni comercializa tus datos personales a terceros con fines publicitarios.' },
      { type: 'sub', text: '5.5 Datos proporcionados por negocios locales sobre usuarios' },
      { type: 'p', text: 'Los negocios locales que participan en la plataforma Reva pueden, en el contexto de la gestión de reservaciones, proporcionar a Reva información adicional sobre el Usuario (como preferencias especiales, alergias o historial de visitas). Reva no verifica la exactitud de dicha información y no asume responsabilidad por datos incorrectos, incompletos o desactualizados proporcionados por los negocios. El Usuario tiene derecho a solicitar la rectificación o eliminación de dicha información a través de los canales descritos en la Sección 7.' },
    ],
  },
  {
    n: '6',
    title: 'Conservación de los Datos',
    blocks: [
      { type: 'p', text: 'Tus datos personales serán conservados durante el tiempo que mantengas una cuenta activa en Reva y mientras sea necesario para cumplir con las finalidades descritas en esta Política. Una vez que elimines tu cuenta, procederemos a eliminar o anonimizar tus datos en un plazo máximo de 30 días hábiles, salvo que existan obligaciones legales que requieran su conservación por un período mayor.' },
      { type: 'p', text: 'Reva se reserva el derecho de conservar datos anonimizados o agregados (que no permitan identificar al Usuario) de forma indefinida para fines estadísticos, de mejora del servicio y de entrenamiento de sistemas de IA, sin que ello constituya tratamiento de datos personales en términos de la LFPDPPP.' },
    ],
  },
  {
    n: '7',
    title: 'Derechos ARCO y Cómo Ejercerlos',
    blocks: [
      { type: 'p', text: 'De conformidad con la LFPDPPP, tienes derecho a:' },
      { type: 'ul', items: [
        'Acceso: conocer qué datos personales tenemos sobre ti y cómo los tratamos.',
        'Rectificación: solicitar la corrección de tus datos cuando sean inexactos o incompletos.',
        'Cancelación: solicitar la eliminación de tus datos cuando consideres que no son necesarios para las finalidades para las que fueron recopilados o cuando hayas retirado tu consentimiento.',
        'Oposición: oponerte al tratamiento de tus datos para finalidades específicas, en particular para las finalidades secundarias descritas en la Sección 3.2.',
      ] },
      { type: 'p', text: 'Para ejercer cualquiera de estos derechos, puedes enviar una solicitud a privacidad@reva.mx indicando: (i) nombre completo y dirección de correo electrónico registrada; (ii) descripción clara del derecho que deseas ejercer; y (iii) cualquier documento que acredite tu identidad. Reva responderá a tu solicitud en un plazo máximo de 20 días hábiles conforme lo establece la LFPDPPP.' },
      { type: 'p', text: 'El ejercicio de los derechos ARCO no afectará las obligaciones contractuales vigentes entre el Usuario y Reva, ni las obligaciones de conservación de datos establecidas por la legislación aplicable. Reva podrá negar el ejercicio de dichos derechos únicamente en los supuestos expresamente permitidos por la LFPDPPP.' },
      { type: 'p', text: 'Asimismo, tienes derecho a presentar una queja ante el Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI) en caso de considerar que tu derecho a la protección de datos ha sido vulnerado.' },
    ],
  },
  {
    n: '8',
    title: 'Seguridad de los Datos y Limitación de Responsabilidad',
    blocks: [
      { type: 'p', text: 'Reva implementa medidas técnicas, administrativas y físicas razonables para proteger tus datos personales contra acceso no autorizado, pérdida, alteración, divulgación o destrucción. Entre estas medidas se incluyen:' },
      { type: 'ul', items: [
        'Cifrado de datos en tránsito mediante protocolos HTTPS/TLS.',
        'Almacenamiento seguro en servidores con controles de acceso restringido.',
        'Revisiones periódicas de seguridad y pruebas de vulnerabilidades.',
        'Capacitación de personal en prácticas de protección de datos.',
      ] },
      { type: 'callout', title: 'Limitación de responsabilidad en materia de seguridad de datos', text: 'A pesar de las medidas implementadas, ningún sistema de seguridad es completamente infalible. Reva no garantiza la seguridad absoluta de los datos personales del Usuario.' },
      { type: 'sub', text: '8.1 Descargo por ataques de terceros y fuerza mayor' },
      { type: 'p', text: 'REVA QUEDA EXPRESAMENTE LIBERADA DE TODA RESPONSABILIDAD POR DAÑOS, PÉRDIDAS O PERJUICIOS DERIVADOS DE:' },
      { type: 'ul', items: [
        'Ataques cibernéticos, hackeos, intrusiones no autorizadas o acciones maliciosas de terceros que no sean atribuibles a negligencia grave o dolo de Reva.',
        'Brechas de seguridad causadas por vulnerabilidades en software, sistemas operativos o infraestructura de terceros proveedores fuera del control directo de Reva.',
        'Interceptación de datos en tránsito por actores externos, incluyendo ataques man-in-the-middle en redes inseguras utilizadas por el propio Usuario.',
        'Pérdida, robo o daño de dispositivos del Usuario que contengan datos de sesión o credenciales de acceso a Reva.',
        'Acceso no autorizado a la cuenta del Usuario derivado de negligencia del propio Usuario en la protección de sus credenciales.',
        'Casos fortuitos, fuerza mayor, desastres naturales, fallas en infraestructura de telecomunicaciones o acciones gubernamentales que afecten la seguridad de los datos.',
      ] },
      { type: 'sub', text: '8.2 Descargo por exactitud de datos procesados por IA' },
      { type: 'p', text: 'Los datos procesados, analizados o generados por los sistemas de inteligencia artificial de Reva (incluyendo recomendaciones personalizadas, historial inferido de preferencias y análisis de comportamiento) se proporcionan "tal como están" y pueden contener imprecisiones inherentes al procesamiento algorítmico. Reva no asume responsabilidad por decisiones tomadas por el Usuario con base en dichos datos procesados.' },
      { type: 'sub', text: '8.3 Notificación de brechas de seguridad' },
      { type: 'p', text: 'En caso de una brecha de seguridad que afecte significativamente los derechos del Usuario, Reva te notificará de manera oportuna conforme lo exige la legislación aplicable. Dicha notificación no implica reconocimiento de responsabilidad por parte de Reva, y el remedio disponible para el Usuario se limitará a lo establecido en los Términos y Condiciones de Uso.' },
    ],
  },
  {
    n: '9',
    title: 'Cookies y Tecnologías de Rastreo',
    blocks: [
      { type: 'p', text: 'La Aplicación Reva puede utilizar cookies, píxeles y otras tecnologías de seguimiento para mejorar tu experiencia de uso, analizar el comportamiento dentro de la Aplicación y personalizar el contenido. Estas tecnologías pueden recopilar información como páginas visitadas, tiempo de sesión y preferencias de navegación.' },
      { type: 'p', text: 'Puedes configurar tu dispositivo para rechazar el uso de ciertas tecnologías de seguimiento, aunque ello puede limitar algunas funcionalidades de la Aplicación. Reva no se responsabiliza por cookies o tecnologías de rastreo implementadas por sitios web de terceros a los que el Usuario acceda desde enlaces dentro de la Aplicación. Para mayor información, consulta nuestra Política de Cookies disponible en reva-app-ten.vercel.app/cookies.' },
    ],
  },
  {
    n: '10',
    title: 'Menores de Edad',
    blocks: [
      { type: 'p', text: 'La Aplicación Reva no está dirigida a menores de 13 años. Reva no recopila intencionalmente datos personales de menores de 13 años. Si descubrimos que hemos recopilado datos personales de un menor sin el consentimiento verificable de sus padres o tutores, procederemos a eliminar dichos datos de inmediato. Reva no asume responsabilidad por el registro de menores que hayan proporcionado información falsa sobre su edad al crear una cuenta.' },
      { type: 'p', text: 'Para usuarios entre 13 y 18 años, el uso de la Aplicación debe contar con el consentimiento de sus padres o tutores legales. Al registrarse, el usuario entre 13 y 18 años declara contar con dicho consentimiento, y Reva queda liberada de responsabilidad si dicha declaración resulta falsa.' },
    ],
  },
  {
    n: '11',
    title: 'Indemnización del Usuario en Materia de Datos',
    blocks: [
      { type: 'p', text: 'El Usuario acepta indemnizar, defender y mantener indemne a Reva, sus directivos, empleados y socios, de y contra cualquier reclamación, responsabilidad, daño, multa o gasto (incluyendo honorarios razonables de abogados) que surja de o en relación con:' },
      { type: 'ul', items: [
        'La provisión de datos personales falsos, incorrectos o de terceros sin consentimiento al registrarse o al usar la Aplicación.',
        'El uso no autorizado de las credenciales de acceso del Usuario por negligencia propia.',
        'La violación de esta Política de Privacidad por parte del Usuario.',
        'Reclamaciones de terceros cuyos datos hayan sido compartidos por el Usuario sin autorización.',
        'Cualquier daño causado a Reva o a terceros derivado de información falsa o incompleta proporcionada por el Usuario.',
      ] },
    ],
  },
  {
    n: '12',
    title: 'Modificaciones a esta Política',
    blocks: [
      { type: 'p', text: 'Reva se reserva el derecho de modificar esta Política de Privacidad en cualquier momento. Se distinguen dos tipos de modificaciones:' },
      { type: 'ul', items: [
        'Modificaciones no materiales (correcciones, aclaraciones de redacción o ajustes menores que no afecten derechos del Usuario): entrarán en vigor inmediatamente al publicarse, sin notificación previa.',
        'Modificaciones materiales (cambios en las finalidades de tratamiento, nuevas categorías de datos recopilados, nuevos terceros con acceso a datos, o cambios en los derechos ARCO): Reva notificará al Usuario con al menos 5 días naturales de anticipación mediante notificación push, correo electrónico registrado o aviso destacado en la Aplicación.',
      ] },
      { type: 'p', text: 'En ambos casos, el uso continuado de la Aplicación tras la entrada en vigor de las modificaciones constituirá aceptación de la Política actualizada. Si el Usuario no acepta los cambios materiales, deberá solicitar la cancelación de su cuenta y la eliminación de sus datos antes de la fecha de entrada en vigor de dichos cambios.' },
    ],
  },
  {
    n: '13',
    title: 'Transferencia de Negocio',
    blocks: [
      { type: 'p', text: 'En caso de fusión, adquisición, venta de activos u otra transacción corporativa que involucre a Reva, los datos personales de los usuarios podrán ser transferidos al nuevo propietario o entidad resultante como parte de los activos del negocio. En dicho caso, Reva notificará a los usuarios con al menos 15 días de anticipación a través de la Aplicación o por correo electrónico registrado. La entidad receptora quedará obligada a respetar los términos de esta Política respecto a los datos transferidos.' },
    ],
  },
  {
    n: '14',
    title: 'Legislación Aplicable y Jurisdicción',
    blocks: [
      { type: 'p', text: 'Esta Política de Privacidad se rige por las leyes de los Estados Unidos Mexicanos, en particular por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento. Para cualquier controversia relacionada con la interpretación o aplicación de esta Política, las partes se someten a la jurisdicción exclusiva de los tribunales competentes de Los Cabos, Baja California Sur, México, renunciando a cualquier otro fuero que pudiera corresponderles.' },
      { type: 'p', text: 'Esta Política se interpreta de forma complementaria a los Términos y Condiciones de Uso de Reva (disponibles en reva-app-ten.vercel.app/terminos). En caso de conflicto entre ambos documentos en materia de privacidad y protección de datos, prevalecerá lo dispuesto en esta Política. Para cualquier otra materia, prevalecerán los Términos y Condiciones.' },
    ],
  },
  {
    n: '15',
    title: 'Contacto y Consultas sobre Privacidad',
    blocks: [
      { type: 'p', text: 'Si tienes preguntas, dudas o comentarios sobre esta Política de Privacidad, o si deseas ejercer tus derechos ARCO, puedes contactarnos a través de:' },
      { type: 'ul', items: [
        'Correo electrónico: privacidad@reva.mx',
        'Sección de Ayuda dentro de la Aplicación Reva.',
        'Sitio web oficial: reva-app-ten.vercel.app',
        'WhatsApp oficial (disponible en el sitio web).',
      ] },
      { type: 'p', text: 'Nos comprometemos a responderte en un plazo no mayor a 20 días hábiles a partir de la recepción de tu solicitud, conforme lo establece la LFPDPPP.' },
    ],
  },
]

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return <p className="text-[15px] leading-[1.75] text-ink-soft mb-4">{block.text}</p>
    case 'sub':
      return (
        <h3 className="font-extrabold text-[17px] text-ink mt-6 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          {block.text}
        </h3>
      )
    case 'ul':
      return (
        <ul className="mb-4 flex flex-col gap-2.5">
          {block.items.map((it, i) => (
            <li key={i} className="relative pl-5 text-[15px] leading-[1.7] text-ink-soft">
              <span className="absolute left-0 top-[10px] w-1.5 h-1.5 rounded-full" style={{ background: '#E8505B' }} />
              {it}
            </li>
          ))}
        </ul>
      )
    case 'callout':
      return (
        <div className="my-5 rounded-2xl border p-5" style={{ background: 'rgba(232,80,91,0.06)', borderColor: 'rgba(232,80,91,0.25)' }}>
          {block.title && (
            <p className="font-bold text-[12px] tracking-widest uppercase text-coral mb-2">{block.title}</p>
          )}
          <p className="text-[14px] leading-[1.7] text-ink">{block.text}</p>
        </div>
      )
  }
}

export default function PrivacyPage({ lang = 'es' }: { lang?: Lang }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={route('home', lang)} className="flex items-center gap-2.5">
            <RevaMark size={34} />
            <span className="font-extrabold text-[18px] text-ink" style={{ fontFamily: 'var(--font-display)' }}>Reva</span>
          </Link>
          <Link href="/app"><Btn size="sm">Abrir Reva</Btn></Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-14 pb-8">
        <span className="text-[12px] font-bold tracking-widest uppercase text-coral mb-3 block">Privacidad · Los Cabos</span>
        <h1 className="font-extrabold text-[40px] leading-[1.06] tracking-[-0.03em] text-ink mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Política de Privacidad
        </h1>
        <p className="text-[14px] text-ink-soft">Versión 4.0 — Julio 2026</p>

        <div className="mt-6 rounded-2xl border p-5" style={{ background: 'rgba(231,163,60,0.08)', borderColor: 'rgba(231,163,60,0.35)' }}>
          <p className="text-[13.5px] leading-[1.7] text-ink font-medium">
            AVISO IMPORTANTE: Al registrarse o usar Reva, usted acepta expresamente esta Política de Privacidad en su
            totalidad, incluyendo las cláusulas de limitación de responsabilidad en materia de datos. Si no está de
            acuerdo, no utilice la Aplicación.
          </p>
        </div>

        <div className="mt-5 text-[15px] leading-[1.75] text-ink-soft">
          <p className="mb-4">
            En Reva, tu privacidad es una prioridad fundamental. La presente Política de Privacidad describe cómo
            recopilamos, usamos, almacenamos, protegemos y compartimos tu información personal cuando utilizas nuestra
            aplicación móvil y servicios relacionados. Te recomendamos leerla detenidamente junto con los{' '}
            <Link href="/terminos" className="text-coral font-semibold underline underline-offset-2">Términos y Condiciones de Uso</Link>{' '}
            de Reva, los cuales se incorporan por referencia a este documento.
          </p>
          <p className="mb-4">
            Esta Política está elaborada en cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión
            de los Particulares (LFPDPPP) de los Estados Unidos Mexicanos y su Reglamento, así como de los Lineamientos
            del Aviso de Privacidad emitidos por el INAI.
          </p>
        </div>

        <div className="my-5 rounded-2xl border p-5" style={{ background: 'rgba(232,80,91,0.06)', borderColor: 'rgba(232,80,91,0.25)' }}>
          <p className="font-bold text-[12px] tracking-widest uppercase text-coral mb-2">Mecanismo de aceptación digital</p>
          <p className="text-[14px] leading-[1.7] text-ink">
            La aceptación de esta Política se formaliza mediante el acto de marcar la casilla de aceptación
            ("checkbox") presentada durante el proceso de registro en la Aplicación, conjuntamente con los Términos y
            Condiciones de Uso. Dicha acción constituye una manifestación de voluntad electrónica con plena validez
            jurídica conforme al Código de Comercio de los Estados Unidos Mexicanos y a la LFPDPPP. Reva registrará
            automáticamente la fecha, hora, dirección IP y versión del documento aceptado como constancia de dicho
            consentimiento. Sin la marcación de la casilla de aceptación, el Usuario no podrá completar el registro ni
            acceder a la Aplicación.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-16">
        {SECTIONS.map((s) => (
          <div key={s.n} className="mb-12 scroll-mt-24" id={`seccion-${s.n}`}>
            <h2 className="font-extrabold text-[24px] leading-tight tracking-[-0.02em] text-ink mb-4 flex gap-3 items-baseline" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-coral">{s.n}.</span>
              <span>{s.title}</span>
            </h2>
            {s.blocks.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}
          </div>
        ))}

        <div className="pt-6 border-t border-line text-[13px] text-ink-soft">
          Versión 4.0 · Última actualización: Julio 2026 · Reva — Tu concierge local · Los Cabos, B.C.S., México
        </div>
      </section>

      <SiteFooter lang={lang} />
    </div>
  )
}
