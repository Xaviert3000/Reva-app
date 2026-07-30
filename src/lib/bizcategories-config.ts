// Constantes de las categorías de negocio del super admin. La persistencia es
// real: viven en la tabla `business_categories` y se leen/escriben vía
// /api/admin/categories. Aquí solo quedan el tipo, el seed por defecto (para
// pintar algo antes de que llegue la respuesta del servidor) y la paleta de
// iconos sugeridos para el selector.

export type BizCategory = { label: string; emoji: string }

export const BIZ_CATEGORIES_INIT: BizCategory[] = [
  { label: 'Restaurantes', emoji: '🍽️' },
  { label: 'Bar / Vida nocturna', emoji: '🍸' },
  { label: 'Spa & Bienestar', emoji: '💆' },
  { label: 'Médico / Clínica', emoji: '🏥' },
  { label: 'Dentista', emoji: '🦷' },
  { label: 'Despacho legal', emoji: '⚖️' },
  { label: 'Inmobiliaria', emoji: '🏠' },
  { label: 'Salón / Barbería', emoji: '✂️' },
  { label: 'Tours & Experiencias', emoji: '🚣' },
  { label: 'Gimnasio / Estudio', emoji: '💪' },
]

// Paleta de emojis sugeridos para elegir con un toque al crear una categoría.
export const CATEGORY_EMOJI_CHOICES: string[] = [
  '🏷️', '🍽️', '🍸', '☕', '🍰', '🛒', '💆', '💅', '✂️', '💇',
  '🏥', '🦷', '💊', '🩺', '⚖️', '🏠', '🔑', '💪', '🧘', '🚣',
  '🎨', '📷', '🎓', '🐾', '🚗', '🔧', '👗', '👟', '💎', '🎁',
  '🎉', '🎸', '⚽', '📚', '💻', '📱', '🌸', '🐶', '🏨', '✈️',
]
