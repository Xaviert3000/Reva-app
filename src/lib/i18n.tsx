'use client'
// ── Fundación i18n compartida ─────────────────────────────────────
// Sistema ligero de idioma para los paneles escritos a mano (admin, biz).
// Sigue el mismo patrón `en ? … : …` que ya usa la app cliente, pero
// expuesto como contexto reutilizable + helper `t('texto es', 'text en')`.
//
// Uso en un componente:
//   const t = useT()
//   <h1>{t('Ajustes', 'Settings')}</h1>
//
// Proveer el idioma en la raíz del panel:
//   <LangContext.Provider value={lang}> … </LangContext.Provider>

import { createContext, useContext } from 'react'

export type Lang = 'es' | 'en'

// Español es el default: si el contexto no está provisto, todo se ve en ES
// (comportamiento actual de los paneles).
export const LangContext = createContext<Lang>('es')

/** Idioma activo del panel. */
export const useLang = (): Lang => useContext(LangContext)

/** Devuelve `true` cuando el panel está en inglés. */
export const useEn = (): boolean => useContext(LangContext) === 'en'

/**
 * Helper de traducción. Devuelve el texto en inglés si el panel está en
 * inglés, de lo contrario el español. Pensado para uso inline:
 *   const t = useT()
 *   t('Guardar cambios', 'Save changes')
 */
export function useT(): (es: string, en: string) => string {
  const lang = useContext(LangContext)
  return (es: string, en: string) => (lang === 'en' ? en : es)
}

/**
 * Variante sin hook, para lugares donde ya tienes el idioma a mano
 * (por ejemplo dentro de funciones puras o mapeos de datos).
 */
export function tr(lang: Lang, es: string, en: string): string {
  return lang === 'en' ? en : es
}
