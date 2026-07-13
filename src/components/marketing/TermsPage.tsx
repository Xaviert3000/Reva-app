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
    title: 'Aceptación de los Términos',
    blocks: [
      { type: 'p', text: 'Al descargar, instalar, registrarse o utilizar la aplicación móvil Reva y/o cualquiera de sus servicios relacionados (en adelante, "Reva", "la Aplicación" o "el Servicio"), usted ("Usuario") acepta quedar vinculado de manera irrevocable por los presentes Términos y Condiciones de Uso ("Términos").' },
      { type: 'p', text: 'Estos Términos constituyen un acuerdo legal vinculante entre el Usuario y Reva (operado por su empresa desarrolladora con domicilio en Los Cabos, Baja California Sur, México). El uso continuado de la Aplicación después de cualquier modificación a estos Términos implica la aceptación plena e incondicional de dichas modificaciones.' },
      { type: 'p', text: 'Si usted actúa en representación de una empresa, negocio o persona moral, declara y garantiza que cuenta con la autoridad necesaria para obligar a dicha entidad a estos Términos, y en tal caso, "Usuario" incluirá a dicha entidad.' },
      { type: 'callout', title: 'Mecanismo de aceptación digital', text: 'La aceptación de estos Términos se formaliza mediante el acto de marcar la casilla de aceptación ("checkbox") presentada durante el proceso de registro en la Aplicación, inmediatamente antes de crear la cuenta de usuario. Dicha acción constituye una manifestación de voluntad electrónica con plena validez jurídica conforme al Código de Comercio de los Estados Unidos Mexicanos (Art. 89 y siguientes) y a la Ley de Firma Electrónica Avanzada. Reva registrará automáticamente: (i) la fecha y hora exacta de aceptación; (ii) la dirección IP del dispositivo; (iii) la versión de los Términos aceptada; y (iv) el identificador único del dispositivo. Dicho registro constituye prueba suficiente de la aceptación por parte del Usuario. Sin la marcación de dicha casilla, el Usuario no podrá completar el registro ni acceder a la Aplicación.' },
    ],
  },
  {
    n: '2',
    title: 'Naturaleza del Servicio — Reva como Intermediario Tecnológico',
    blocks: [
      { type: 'p', text: 'Reva es una plataforma tecnológica de concierge local impulsada por inteligencia artificial, diseñada para facilitar la búsqueda, descubrimiento y reservación de negocios y experiencias locales en Los Cabos, Baja California Sur, México. El Servicio opera bajo dos modalidades:' },
      { type: 'ul', items: [
        'Modo Explorer: dirigido a turistas y visitantes, disponible en idioma inglés, con recomendaciones curadas y funcionalidades de reservación agente a agente.',
        'Modo Vecino: dirigido a residentes locales, disponible en español, con acceso a lugares habituales, reservaciones rápidas y el programa de recompensas Reva+.',
      ] },
      { type: 'callout', title: 'Declaración esencial de intermediación', text: 'Reva actúa EXCLUSIVAMENTE como intermediario tecnológico entre el Usuario y los negocios locales. Reva NO es propietaria, franquiciante, empleadora, operadora, agente, ni responsable solidaria de ningún negocio listado en la plataforma, ni de los bienes, servicios, experiencias o actividades ofrecidos por dichos negocios. La relación contractual por los servicios reservados se establece directa y únicamente entre el Usuario y el negocio local correspondiente.' },
      { type: 'p', text: 'Los negocios que aparecen en la Aplicación son entidades independientes con plena autonomía operativa y jurídica. Reva no ejerce control, supervisión ni dirección sobre las operaciones, personal, instalaciones, precios, políticas internas ni prácticas de ningún negocio listado.' },
      { type: 'sub', text: 'Vinculación de negocios locales con estos Términos' },
      { type: 'p', text: 'Los negocios locales que se registren y participen en la plataforma Reva lo hacen mediante la aceptación del Acuerdo de Membresía para Negocios ("Acuerdo de Membresía"), el cual constituye un contrato independiente y vinculante entre Reva y cada negocio participante. Dicho Acuerdo de Membresía incorpora expresamente por referencia los presentes Términos y Condiciones de Uso, de modo que las obligaciones, descargos e indemnizaciones establecidos en estos Términos son igualmente oponibles a los negocios locales participantes en todo aquello que les resulte aplicable, incluyendo sin limitación las obligaciones de indemnización previstas en la Sección 12.2 y los descargos de responsabilidad de la Sección 11.' },
      { type: 'p', text: 'El Usuario reconoce y acepta que, al realizar una reservación a través de Reva, el negocio local correspondiente ha aceptado previamente el Acuerdo de Membresía y, por ende, conoce y está vinculado por las condiciones de operación de la plataforma aquí descritas. La existencia de dicho Acuerdo de Membresía no crea responsabilidad solidaria de Reva respecto a las obligaciones del negocio frente al Usuario.' },
    ],
  },
  {
    n: '3',
    title: 'Descargo de Responsabilidad — Servicios de Negocios Locales',
    blocks: [
      { type: 'p', text: 'Reva no asume responsabilidad alguna por actos, omisiones, negligencia, dolo o incumplimientos de los negocios locales listados en la plataforma.' },
      { type: 'p', text: 'Sin limitar lo anterior, Reva queda expresamente liberada de toda responsabilidad respecto a:' },
      { type: 'ul', items: [
        'La calidad, seguridad, idoneidad, exactitud o legalidad de los bienes, servicios, experiencias o actividades ofrecidos por cualquier negocio listado.',
        'El incumplimiento, cancelación, modificación unilateral o cumplimiento defectuoso de una reservación por parte del negocio local.',
        'Lesiones corporales, daños a la salud, daños materiales, daños psicológicos o cualquier otro daño sufrido por el Usuario o terceros como resultado de la asistencia a, o uso de, cualquier negocio o servicio encontrado a través de Reva.',
        'La veracidad, exactitud o actualización de la información, fotos, reseñas, precios, horarios, menús y descripciones proporcionadas por los negocios locales.',
        'La higiene, sanidad, seguridad alimentaria, condiciones de infraestructura o estándares de atención al cliente de cualquier negocio.',
        'Disputas entre el Usuario y un negocio local relacionadas con precios, calidad, disponibilidad, políticas de cancelación o cualquier otro aspecto del servicio prestado.',
        'Fraudes, engaños, cobros indebidos o conductas ilícitas llevadas a cabo por negocios locales o su personal.',
        'Daños derivados de actividades de alto riesgo (tours de aventura, deportes acuáticos, excursiones, actividades al aire libre, etc.) que el Usuario haya reservado o descubierto a través de la Aplicación.',
        'La solvencia financiera, vigencia de permisos, licencias o habilitaciones legales de los negocios listados.',
      ] },
      { type: 'p', text: 'El Usuario reconoce que utiliza la información de la Aplicación y realiza reservaciones bajo su propio riesgo y juicio. Reva recomienda al Usuario verificar directamente con el negocio cualquier información relevante antes de confirmar una reservación o asistir a un establecimiento.' },
    ],
  },
  {
    n: '4',
    title: 'Descargo de Responsabilidad — Inteligencia Artificial y Recomendaciones',
    blocks: [
      { type: 'p', text: 'Las recomendaciones, respuestas, sugerencias y cualquier contenido generado por el agente de inteligencia artificial de Reva son de carácter meramente informativo y orientativo.' },
      { type: 'p', text: 'El Usuario reconoce y acepta expresamente que:' },
      { type: 'ul', items: [
        'El agente de IA de Reva puede cometer errores, proporcionar información desactualizada, imprecisa o incompleta.',
        'Las recomendaciones generadas por IA no sustituyen el juicio personal del Usuario ni la verificación directa de información con los negocios.',
        'Reva no garantiza que las recomendaciones del agente de IA sean apropiadas, seguras o idóneas para las necesidades específicas de cada Usuario.',
        'La disponibilidad, precios y condiciones de negocios mencionados por el agente de IA pueden no reflejar la situación actual del negocio en tiempo real.',
        'Reva no es responsable por decisiones que el Usuario tome con base en las recomendaciones del agente de IA.',
      ] },
      { type: 'p', text: 'Reva se esfuerza por mantener la calidad de su sistema de IA, pero no garantiza su funcionamiento ininterrumpido, libre de errores, ni la idoneidad de sus respuestas para todos los casos de uso.' },
    ],
  },
  {
    n: '5',
    title: 'Registro y Cuenta de Usuario',
    blocks: [
      { type: 'p', text: 'Para acceder a ciertas funcionalidades de Reva, es necesario crear una cuenta de usuario. Al registrarse, usted se compromete a:' },
      { type: 'ul', items: [
        'Proporcionar información veraz, precisa, actual y completa.',
        'Mantener y actualizar dicha información para que permanezca exacta y vigente.',
        'Mantener la confidencialidad de su contraseña y ser el único responsable de todas las actividades realizadas desde su cuenta.',
        'Notificar inmediatamente a Reva sobre cualquier uso no autorizado de su cuenta o brecha de seguridad que detecte.',
      ] },
      { type: 'p', text: 'Reva no será responsable por pérdidas o daños derivados del acceso no autorizado a la cuenta del Usuario cuando dicho acceso sea resultado de la negligencia del Usuario en la protección de sus credenciales. Reva se reserva el derecho de suspender o cancelar cuentas sin previo aviso cuando detecte violaciones a estos Términos, actividad fraudulenta o conducta perjudicial para la plataforma o sus usuarios.' },
    ],
  },
  {
    n: '6',
    title: 'Uso Aceptable de la Plataforma',
    blocks: [
      { type: 'sub', text: '6.1 Usos permitidos' },
      { type: 'p', text: 'El Usuario podrá utilizar Reva únicamente para los fines legítimos previstos: descubrir negocios, realizar reservaciones, acumular y canjear puntos Reva+, y comunicarse con los servicios de atención al cliente de la Aplicación.' },
      { type: 'sub', text: '6.2 Usos prohibidos' },
      { type: 'p', text: 'El Usuario se compromete a no:' },
      { type: 'ul', items: [
        'Utilizar la Aplicación para fines ilícitos o contrarios a estos Términos o a la legislación aplicable.',
        'Interferir con el funcionamiento de la Aplicación, sus servidores o redes asociadas.',
        'Intentar acceder sin autorización a sistemas, datos o cuentas de otros usuarios.',
        'Publicar, transmitir o compartir contenido falso, difamatorio, abusivo, engañoso, obsceno o que infrinja derechos de terceros.',
        'Realizar ingeniería inversa, descompilar o desensamblar cualquier componente de la Aplicación.',
        'Utilizar robots, scrapers, crawlers u otros medios automatizados para extraer datos de la Aplicación sin autorización previa y por escrito de Reva.',
        'Crear múltiples cuentas con el fin de eludir suspensiones, restricciones o para obtener beneficios fraudulentos del programa Reva+.',
        'Hacer un uso indebido del sistema de recompensas Reva+ mediante fraude, abuso, manipulación de datos o cualquier conducta que tergiverse el funcionamiento del programa.',
        'Suplantar la identidad de otra persona o entidad.',
        'Transmitir virus, malware u otro código malicioso a través de la Aplicación.',
      ] },
      { type: 'p', text: 'El incumplimiento de esta sección facultará a Reva para suspender o cancelar la cuenta del Usuario de forma inmediata y sin responsabilidad, además de ejercer las acciones legales correspondientes.' },
    ],
  },
  {
    n: '7',
    title: 'Reservaciones y Transacciones',
    blocks: [
      { type: 'p', text: 'Reva actúa exclusivamente como canal tecnológico de reservación y no asume responsabilidad por el cumplimiento o incumplimiento de los servicios reservados.' },
      { type: 'p', text: 'Al realizar una reservación a través de Reva, el Usuario entiende y acepta expresamente que:' },
      { type: 'ul', items: [
        'La relación contractual por el servicio reservado se establece únicamente entre el Usuario y el negocio local. Reva no es parte de dicho contrato.',
        'La confirmación de disponibilidad y las condiciones específicas de cada reservación dependen exclusivamente del negocio local correspondiente, quien podrá rechazar, modificar o cancelar la reservación bajo sus propias políticas.',
        'Reva no garantiza la disponibilidad, puntualidad, calidad ni cumplimiento de ningún servicio, negocio o experiencia reservada a través de la plataforma.',
        'Los precios mostrados en la Aplicación son informativos y pueden variar según el negocio local, temporada o cualquier otro factor ajeno a Reva.',
        'Reva no es responsable por cargos adicionales, cobros no autorizados o variaciones de precio aplicados por los negocios locales.',
        'Las políticas de cancelación, reembolso y modificación son determinadas exclusivamente por cada negocio local. Cualquier disputa sobre cancelaciones o reembolsos debe gestionarse directamente con el negocio.',
        'El pago de los servicios reservados puede realizarse directamente al negocio o a través de los métodos de pago disponibles en la Aplicación, según aplique. Reva no se responsabiliza por problemas de pago atribuibles a los negocios o a procesadores de pago externos.',
        'En caso de no presentarse ("no-show") a una reservación confirmada, el Usuario podrá ser sujeto a las penalizaciones establecidas por el negocio local, sin que Reva sea responsable de dichos cargos.',
      ] },
    ],
  },
  {
    n: '8',
    title: 'Contenido de Terceros, Reseñas, Negocios Asociados y Modelo de Negocio',
    blocks: [
      { type: 'p', text: 'Reva puede incluir listados, reseñas, fotos, calificaciones y otra información proporcionada por negocios locales, usuarios o terceros. Con respecto a dicho contenido, el Usuario reconoce expresamente que:' },
      { type: 'ul', items: [
        'Reva no verifica, edita, respalda, certifica ni garantiza la exactitud, integridad, legalidad, veracidad o actualidad de ningún contenido de terceros publicado en la plataforma.',
        'Las reseñas y calificaciones de negocios reflejan la opinión de usuarios individuales y no constituyen endoso de Reva hacia ningún negocio.',
        'Los negocios marcados como "Destacado", "Patrocinado" o "Recomendado" pueden corresponder a contenido publicitario, claramente identificado como tal cuando aplique.',
        'Reva no es responsable por decisiones del Usuario basadas en contenido de terceros, incluyendo reseñas, calificaciones o descripciones de negocios.',
        'Los horarios, precios, menús, servicios y características de negocios mostrados en la Aplicación pueden no estar actualizados y deben verificarse directamente con el negocio.',
      ] },
      { type: 'callout', title: 'Modelo de negocio y comisión por procesamiento de pagos', text: 'En aras de la transparencia, Reva informa al Usuario que su modelo de negocio incluye el cobro de una comisión del 2% (dos por ciento) sobre el valor de cada transacción procesada a través de la pasarela de pagos integrada en la Aplicación. Dicha comisión es cargada al negocio local como parte del Acuerdo de Membresía y no representa un cargo adicional al precio que el Usuario paga por el servicio reservado. Esta comisión no genera conflicto de interés en las recomendaciones orgánicas de Reva, las cuales se basan en criterios de calidad, relevancia y preferencias del Usuario, y no en el volumen de transacciones generadas por cada negocio. Los negocios con contenido patrocinado son identificados expresamente como tales en la plataforma.' },
    ],
  },
  {
    n: '9',
    title: 'Programa de Recompensas Reva+',
    blocks: [
      { type: 'p', text: 'El programa de recompensas Reva+ permite a los usuarios acumular puntos por reservaciones realizadas a través de la Aplicación y canjearlos por experiencias, descuentos y beneficios exclusivos en negocios locales participantes.' },
      { type: 'sub', text: '9.1 Acumulación de puntos' },
      { type: 'ul', items: [
        'Los puntos se acreditan una vez confirmada y completada la reservación, sujeto a verificación por parte de Reva.',
        'Reva se reserva el derecho de modificar, reducir, ajustar o eliminar los criterios y tasas de acumulación de puntos, notificando al Usuario con al menos 15 días de anticipación.',
        'Reva se reserva el derecho de anular puntos obtenidos mediante fraude, abuso o violación de estos Términos, sin previo aviso y sin responsabilidad.',
      ] },
      { type: 'sub', text: '9.2 Canje de puntos' },
      { type: 'ul', items: [
        'Los puntos Reva+ son personales, intransferibles y no heredables.',
        'Los puntos no tienen valor monetario, no son canjeables por dinero en efectivo, no constituyen un depósito, saldo o activo financiero de ningún tipo.',
        'Reva se reserva el derecho de modificar, reducir o eliminar el catálogo de beneficios canjeables en cualquier momento, con o sin previo aviso.',
        'El canje de puntos está sujeto a disponibilidad y a las condiciones específicas de cada beneficio o negocio participante.',
      ] },
      { type: 'sub', text: '9.3 Limitación de responsabilidad del programa' },
      { type: 'p', text: 'Reva no será responsable por la calidad o disponibilidad de los beneficios canjeados, los cuales dependen de los negocios locales participantes. En caso de fallo técnico, error de acreditación o discrepancia en el saldo de puntos, el remedio exclusivo del Usuario será solicitar la corrección del saldo a través del soporte de Reva.' },
      { type: 'sub', text: '9.4 Cancelación del programa' },
      { type: 'p', text: 'Reva se reserva el derecho de suspender, modificar o cancelar el programa Reva+ en cualquier momento, con un aviso previo de 30 días, durante los cuales los usuarios podrán canjear sus puntos acumulados. Transcurrido dicho plazo, los puntos no canjeados quedarán sin efecto y el Usuario no tendrá derecho a compensación alguna.' },
    ],
  },
  {
    n: '10',
    title: 'Propiedad Intelectual',
    blocks: [
      { type: 'p', text: 'Todos los derechos de propiedad intelectual sobre la Aplicación, incluyendo pero no limitado a su diseño, interfaz, código fuente, logotipos, marcas comerciales, nombre comercial "Reva", contenido curado, bases de datos y algoritmos de recomendación e inteligencia artificial, son propiedad exclusiva de Reva o de sus licenciantes y están protegidos por las leyes de propiedad intelectual de México y tratados internacionales aplicables.' },
      { type: 'p', text: 'Se concede al Usuario una licencia limitada, personal, no exclusiva, intransferible, no sublicenciable y revocable para usar la Aplicación exclusivamente para los fines personales y no comerciales previstos en estos Términos. Queda estrictamente prohibida cualquier reproducción, distribución, modificación, explotación comercial, sublicenciamiento o uso no autorizado de los contenidos, marcas o tecnología de Reva.' },
    ],
  },
  {
    n: '11',
    title: 'Limitación de Responsabilidad — Cláusula Central',
    blocks: [
      { type: 'callout', text: 'ESTA CLÁUSULA LIMITA SIGNIFICATIVAMENTE LOS DERECHOS DEL USUARIO. LEA CUIDADOSAMENTE.' },
      { type: 'sub', text: '11.1 Descargo general' },
      { type: 'p', text: 'EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEGISLACIÓN APLICABLE, REVA, SUS DIRECTIVOS, EMPLEADOS, AGENTES, SOCIOS, LICENCIANTES Y PROVEEDORES DE SERVICIOS QUEDAN EXPRESAMENTE LIBERADOS DE TODA RESPONSABILIDAD POR:' },
      { type: 'ul', items: [
        'Cualquier daño directo, indirecto, incidental, especial, consecuente, ejemplar o punitivo de cualquier naturaleza, incluyendo pérdida de ingresos, pérdida de datos, pérdida de oportunidades de negocio, daño a la reputación o cualquier pérdida intangible, derivada del uso o imposibilidad de uso de la Aplicación.',
        'La calidad, seguridad, legalidad, idoneidad o desempeño de los bienes, servicios o experiencias ofrecidos por cualquier negocio local accedido a través de la Aplicación.',
        'Pérdida de datos del Usuario, interrupciones del servicio, errores técnicos, fallas de servidores, ataques cibernéticos o cualquier interrupción tecnológica fuera del control de Reva.',
        'Actos, omisiones, negligencia, dolo o incumplimientos de negocios locales, proveedores externos, otros usuarios o cualquier tercero vinculado o no vinculado a la plataforma.',
        'Daños personales, lesiones corporales, enfermedades, accidentes o fallecimiento resultantes de actividades, servicios o experiencias reservadas o descubiertas a través de la Aplicación.',
        'Daños derivados de fuerza mayor, caso fortuito, desastres naturales, pandemias, fallas en infraestructura de telecomunicaciones, acciones gubernamentales, huelgas u otros eventos fuera del control razonable de Reva.',
        'Decisiones comerciales, personales o de cualquier naturaleza tomadas por el Usuario con base en información, recomendaciones o contenidos obtenidos a través de la Aplicación o del agente de IA.',
        'El cierre, insolvencia, suspensión de actividades o modificación de condiciones de cualquier negocio listado en la plataforma.',
        'Daños derivados del acceso no autorizado a la cuenta del Usuario causado por negligencia del propio Usuario.',
      ] },
      { type: 'sub', text: '11.2 Responsabilidad frente a Negocios Locales' },
      { type: 'p', text: 'Reva no asume responsabilidad alguna frente a los negocios locales listados en la plataforma por:' },
      { type: 'ul', items: [
        'La conducta, actos u omisiones de los Usuarios dentro de los establecimientos.',
        'Reservaciones no presentadas ("no-show") por parte de los Usuarios.',
        'Información incorrecta proporcionada por el Usuario al momento de la reservación.',
        'Disputas o conflictos entre Usuarios y negocios locales.',
        'Pérdida de ingresos del negocio derivada de reservaciones canceladas, modificadas o no completadas por el Usuario.',
        'Reseñas, calificaciones o comentarios negativos publicados por Usuarios sobre el negocio en la plataforma.',
      ] },
      { type: 'sub', text: '11.3 Tope máximo de responsabilidad' },
      { type: 'p', text: 'En caso de que Reva sea declarada responsable por algún concepto no excluido expresamente por ley, la responsabilidad total y agregada de Reva frente al Usuario no excederá el menor de los siguientes montos: (i) el total de las tarifas de servicio efectivamente pagadas por el Usuario directamente a Reva en los 6 meses anteriores al evento que originó la reclamación; o (ii) $1,000 MXN (un mil pesos mexicanos). Esta limitación aplica independientemente de la naturaleza de la reclamación (contractual, extracontractual, cuasicontractual o de cualquier otra índole).' },
      { type: 'sub', text: '11.4 Servicio "tal como está" (As-Is)' },
      { type: 'p', text: 'LA APLICACIÓN SE PROPORCIONA "TAL COMO ESTÁ" Y "SEGÚN DISPONIBILIDAD", SIN GARANTÍAS DE NINGÚN TIPO, EXPRESAS O IMPLÍCITAS, INCLUYENDO PERO SIN LIMITARSE A GARANTÍAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR, NO INFRACCIÓN, EXACTITUD, CONFIABILIDAD O CONTINUIDAD DEL SERVICIO. REVA NO GARANTIZA QUE LA APLICACIÓN SEA ININTERRUMPIDA, LIBRE DE ERRORES, VIRUS O COMPONENTES DAÑINOS.' },
    ],
  },
  {
    n: '12',
    title: 'Indemnización',
    blocks: [
      { type: 'sub', text: '12.1 Indemnización del Usuario a favor de Reva' },
      { type: 'p', text: 'El Usuario acepta indemnizar, defender y mantener indemne a Reva, sus empresas afiliadas, directivos, empleados, agentes, contratistas, licenciantes y socios, de y contra cualquier reclamación, demanda, procedimiento, responsabilidad, daño, multa, pérdida, penalización y gasto (incluyendo honorarios razonables de abogados y costas procesales) que surja de o en relación con:' },
      { type: 'ul', items: [
        'El uso de la Aplicación en violación de estos Términos o de cualquier ley aplicable.',
        'Información falsa, imprecisa o engañosa proporcionada por el Usuario al registrarse, al realizar una reservación o en cualquier interacción con la plataforma.',
        'La violación de derechos de propiedad intelectual, privacidad u otros derechos de terceros por parte del Usuario.',
        'Cualquier contenido publicado, transmitido o compartido por el Usuario a través de la Aplicación.',
        'Disputas del Usuario con negocios locales o con otros usuarios de la plataforma.',
        'Conducta negligente, dolosa o ilícita del Usuario en conexión con el uso de la Aplicación o de los servicios de negocios locales.',
        'Reclamaciones de terceros derivadas de acciones u omisiones del Usuario en el contexto del uso de la Aplicación.',
      ] },
      { type: 'sub', text: '12.2 Indemnización de Negocios Locales a favor de Reva' },
      { type: 'p', text: 'Los negocios locales que se integren a la plataforma Reva aceptan, como condición de su participación, indemnizar y mantener indemne a Reva de cualquier reclamación, responsabilidad o daño derivado de:' },
      { type: 'ul', items: [
        'Los bienes, servicios o experiencias que ofrezcan a través de la plataforma.',
        'Incumplimiento de sus obligaciones frente a Usuarios.',
        'Violaciones a la legislación aplicable en materia de consumidor, sanidad, seguridad o cualquier otra regulación.',
        'Información falsa o engañosa proporcionada a Reva para su publicación en la plataforma.',
      ] },
    ],
  },
  {
    n: '13',
    title: 'Resolución de Disputas entre Usuario y Negocio',
    blocks: [
      { type: 'p', text: 'En caso de disputa, conflicto o reclamación entre el Usuario y un negocio local, Reva podrá, a su entera discreción y sin obligación alguna, actuar como facilitador de comunicación entre las partes. Sin embargo, Reva no está obligada a intervenir, mediar ni resolver dichas disputas, y su participación no implica responsabilidad alguna sobre el resultado.' },
      { type: 'p', text: 'El Usuario renuncia expresamente a reclamar a Reva cualquier daño o pérdida derivada de disputas con negocios locales. Toda reclamación relacionada con la prestación de servicios por parte de un negocio deberá dirigirse directamente al negocio correspondiente o a las instancias de protección al consumidor competentes (como PROFECO).' },
    ],
  },
  {
    n: '14',
    title: 'Modificaciones al Servicio y a los Términos',
    blocks: [
      { type: 'p', text: 'Reva se reserva el derecho de modificar, suspender, restringir o discontinuar cualquier aspecto de la Aplicación, incluyendo funcionalidades, contenidos, precios de suscripción y disponibilidad, en cualquier momento y sin previo aviso, sin que ello genere responsabilidad alguna frente al Usuario.' },
      { type: 'p', text: 'Asimismo, Reva puede modificar estos Términos en cualquier momento. Se distinguen dos tipos de modificaciones:' },
      { type: 'ul', items: [
        'Modificaciones no materiales (correcciones ortográficas, aclaraciones de redacción, reorganización de secciones sin cambio de fondo): entrarán en vigor inmediatamente al publicarse en la Aplicación o en el sitio web oficial, sin notificación previa.',
        'Modificaciones materiales (cambios que afecten derechos del Usuario, tarifas, limitaciones de responsabilidad, programa Reva+ o jurisdicción aplicable): Reva notificará al Usuario con al menos 5 días naturales de anticipación mediante notificación push, correo electrónico registrado o aviso destacado en la Aplicación. Transcurrido dicho plazo, los cambios entrarán en vigor automáticamente.',
      ] },
      { type: 'p', text: 'En ambos casos, el uso continuado de la Aplicación tras la entrada en vigor de las modificaciones constituye aceptación automática e irrevocable de los Términos actualizados. Si el Usuario no acepta los Términos modificados, su único recurso disponible es dejar de usar la Aplicación y solicitar la eliminación de su cuenta antes de la fecha de entrada en vigor de los cambios materiales.' },
    ],
  },
  {
    n: '15',
    title: 'Suspensión y Terminación',
    blocks: [
      { type: 'p', text: 'Reva se reserva el derecho de suspender o terminar el acceso del Usuario a la Aplicación, con o sin causa y con o sin previo aviso, sin que ello genere responsabilidad de Reva frente al Usuario. Las causas que pueden motivar la suspensión o terminación incluyen, sin limitarse a: (i) violación de estos Términos; (ii) conducta fraudulenta o abusiva; (iii) riesgo para la seguridad de la plataforma o de otros usuarios; (iv) requerimiento de autoridad competente; o (v) cierre de operaciones de Reva.' },
      { type: 'p', text: 'La terminación de la cuenta no libera al Usuario de las obligaciones adquiridas bajo estos Términos, incluyendo las de indemnización. Las cláusulas que por su naturaleza deban sobrevivir a la terminación (incluyendo limitación de responsabilidad, indemnización, propiedad intelectual y legislación aplicable) continuarán en vigor indefinidamente.' },
    ],
  },
  {
    n: '16',
    title: 'Legislación Aplicable y Jurisdicción',
    blocks: [
      { type: 'p', text: 'Estos Términos se rigen e interpretan de conformidad con las leyes de los Estados Unidos Mexicanos, sin dar efecto a ningún principio de conflicto de leyes. Para cualquier controversia derivada de estos Términos o del uso de la Aplicación, las partes se someten expresamente a la jurisdicción y competencia exclusiva de los tribunales competentes de Los Cabos, Baja California Sur, México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros o por cualquier otra causa.' },
      { type: 'p', text: 'Antes de iniciar cualquier procedimiento judicial, las partes se comprometen a intentar resolver cualquier disputa mediante negociación de buena fe durante un período de 30 días a partir de la notificación escrita de la disputa.' },
    ],
  },
  {
    n: '17',
    title: 'Disposiciones Generales',
    blocks: [
      { type: 'ul', items: [
        'Integralidad: Estos Términos, junto con la Política de Privacidad y cualquier otro documento incorporado por referencia, constituyen el acuerdo completo entre el Usuario y Reva respecto al uso de la Aplicación, sustituyendo cualquier acuerdo previo, verbal o escrito.',
        'Divisibilidad: Si alguna disposición de estos Términos se considera inválida, ilegal o inaplicable por un tribunal competente, las demás disposiciones continuarán en plena vigencia, y la disposición inválida será reemplazada por una disposición válida que más se acerque al objetivo original.',
        'Renuncia: La falta de ejercicio de cualquier derecho previsto en estos Términos por parte de Reva no constituirá renuncia a dicho derecho ni impedirá su ejercicio posterior.',
        'Cesión: El Usuario no podrá ceder sus derechos u obligaciones bajo estos Términos sin el consentimiento previo y por escrito de Reva. Reva podrá ceder sus derechos y obligaciones a cualquier afiliada, sucesora o adquirente sin restricción ni notificación previa.',
        'Encabezados: Los títulos de sección son únicamente para facilitar la lectura y no afectan la interpretación de estos Términos.',
        'Idioma: En caso de conflicto entre versiones de estos Términos en distintos idiomas, prevalecerá la versión en español.',
      ] },
    ],
  },
  {
    n: '18',
    title: 'Contacto',
    blocks: [
      { type: 'p', text: 'Para cualquier duda, aclaración o notificación relacionada con estos Términos y Condiciones, puede contactarnos a través de:' },
      { type: 'ul', items: [
        'Aplicación Reva: sección de Ayuda y Soporte.',
        'Sitio web: reva-app-ten.vercel.app',
        'Correo electrónico: legal@reva.mx',
        'WhatsApp oficial de Reva (disponible en el sitio web).',
      ] },
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

export default function TermsPage({ lang = 'es' }: { lang?: Lang }) {
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
        <span className="text-[12px] font-bold tracking-widest uppercase text-coral mb-3 block">Legal · Los Cabos</span>
        <h1 className="font-extrabold text-[40px] leading-[1.06] tracking-[-0.03em] text-ink mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Términos y Condiciones de Uso
        </h1>
        <p className="text-[14px] text-ink-soft">Versión 4.0 — Julio 2026</p>

        <div className="mt-6 rounded-2xl border p-5" style={{ background: 'rgba(231,163,60,0.08)', borderColor: 'rgba(231,163,60,0.35)' }}>
          <p className="text-[13.5px] leading-[1.7] text-ink font-medium">
            AVISO IMPORTANTE: Lea estos Términos detenidamente antes de usar la Aplicación. Al registrarse o usar
            Reva, usted acepta expresamente estos Términos en su totalidad, incluyendo las cláusulas de limitación de
            responsabilidad y descargo. Si no está de acuerdo, no utilice la Aplicación.
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
