// Fuente de verdad (server-side) de la configuración de IA de la plataforma:
// modelo, modelos de respaldo, prompts y toggles de funciones. Vive en Supabase
// (tabla platform_config, fila singleton id=1) y la editan las API routes del
// admin. Las rutas /api/* la leen con caché corta por instancia + fallback a
// variables de entorno / defaults, de modo que la app SIEMPRE funciona aunque
// Supabase no esté configurado o no responda.
//
// Las API keys NO viven aquí: siguen en variables de entorno (OPENROUTER_API_KEY).

import { createServerClient } from '@supabase/ssr'
import { DEFAULT_PROMPTS, type PromptId } from './ai-prompts'

export interface PlatformConfig {
  model: string
  fallbackModels: string[]
  prompts: Record<PromptId, string>
  options: Record<string, boolean>
}

const DEFAULT_OPTIONS: Record<string, boolean> = {
  concierge: true, negotiation: true, bizagent: true, translation: false,
}

function envDefaults(): PlatformConfig {
  return {
    model: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
    fallbackModels: (process.env.OPENROUTER_FALLBACK_MODELS ?? '')
      .split(',').map(s => s.trim()).filter(Boolean),
    prompts: { ...DEFAULT_PROMPTS },
    options: { ...DEFAULT_OPTIONS },
  }
}

// Caché por instancia serverless (TTL corto). Al guardar, se refresca en esta
// instancia; otras instancias la verán al expirar el TTL.
let cache: { value: PlatformConfig; at: number } | null = null
const TTL_MS = 30_000

// Cliente con service role (solo server). Bypassa RLS. null si faltan o son
// inválidas las credenciales (nunca lanza).
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    return createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => {} } })
  } catch {
    return null
  }
}

export async function loadPlatformConfig(force = false): Promise<PlatformConfig> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.value
  const base = envDefaults()
  try {
    const db = adminClient()
    if (db) {
      const { data, error } = await db.from('platform_config').select('*').eq('id', 1).single()
      if (!error && data) {
        const value: PlatformConfig = {
          model: data.model || base.model,
          fallbackModels: Array.isArray(data.fallback_models) && data.fallback_models.length ? data.fallback_models : base.fallbackModels,
          prompts: { ...base.prompts, ...(data.prompts ?? {}) },
          options: { ...base.options, ...(data.options ?? {}) },
        }
        cache = { value, at: Date.now() }
        return value
      }
    }
  } catch {
    // Fallback resiliente: cualquier fallo de Supabase → env/defaults.
  }
  cache = { value: base, at: Date.now() }
  return base
}

export async function savePlatformConfig(patch: Partial<PlatformConfig>): Promise<PlatformConfig> {
  const current = await loadPlatformConfig(true)
  const next: PlatformConfig = {
    model: patch.model ?? current.model,
    fallbackModels: patch.fallbackModels ?? current.fallbackModels,
    prompts: { ...current.prompts, ...(patch.prompts ?? {}) },
    options: { ...current.options, ...(patch.options ?? {}) },
  }
  try {
    const db = adminClient()
    if (db) {
      await db.from('platform_config').upsert({
        id: 1,
        model: next.model,
        fallback_models: next.fallbackModels,
        prompts: next.prompts,
        options: next.options,
        updated_at: new Date().toISOString(),
      })
    }
  } catch {
    // Si Supabase no está disponible, mantenemos el cambio en caché de esta instancia.
  }
  cache = { value: next, at: Date.now() }
  return next
}

// Resuelve el prompt para un id (config → default).
export function resolvedPrompt(cfg: PlatformConfig, id: PromptId): string {
  return cfg.prompts[id] || DEFAULT_PROMPTS[id]
}

// Construye las opciones de modelo para openrouterChat: principal + respaldos.
export function modelChain(cfg: PlatformConfig): { model: string; models?: string[] } {
  return {
    model: cfg.model,
    models: cfg.fallbackModels.length ? [cfg.model, ...cfg.fallbackModels] : undefined,
  }
}
