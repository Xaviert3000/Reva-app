-- Nivel de visibilidad pagada del negocio (Destacado vs Premium)
-- El panel de negocios (/biz → Destacado) vende dos niveles: Premium (★, spot
-- #1, máx. visibilidad) y Destacado (✦, franja de destacados). Hasta ahora la
-- tabla `businesses` solo tenía el booleano `featured` (creado en 001), así que
-- la app cliente (/app) no podía distinguir un Premium de un Destacado y los
-- pintaba a todos como "Destacado". Esta columna cierra esa brecha.
--
-- Relación con `featured`:
--   featured = false           → no pagó visibilidad; tier debe ser NULL.
--   featured = true, tier NULL  → destacado por defecto (compatibilidad hacia atrás).
--   featured = true, tier set   → el nivel exacto que compró.
-- La app usa `featuredBadge()` (src/lib/data.ts), que solo pinta etiqueta si
-- featured=true, y elige ★/✦ según `tier`.
--
-- Vigencia: `featured_until` marca cuándo expira el plan comprado (7/15/30 días).
-- NULL = sin fecha de expiración (visibilidad manual, se apaga al pausar). La
-- lectura en /app trata como no destacado todo lo que ya venció.

-- 1. Columna de nivel. NULL = sin nivel (no destacado).
alter table businesses add column if not exists tier text
  check (tier is null or tier in ('premium', 'destacado'));

-- 2. Coherencia: no puede haber tier sin featured, ni featured sin nivel.
--    Un negocio marcado featured cae en 'destacado' salvo que sea 'premium'.
alter table businesses drop constraint if exists businesses_tier_requires_featured;
alter table businesses add constraint businesses_tier_requires_featured
  check (tier is null or featured is true);

-- 3. Backfill: los negocios ya destacados quedan como 'destacado' (mismo
--    default que aplicaba src/lib/business-data.ts antes de esta columna).
update businesses set tier = 'destacado'
  where featured is true and tier is null;

-- 4. Vigencia del plan comprado. NULL = sin expiración automática.
alter table businesses add column if not exists featured_until timestamptz;

-- 5. Índice para listar rápido por nivel (p. ej. traer los Premium de un cupo).
create index if not exists idx_businesses_tier on businesses (municipio, tier)
  where tier is not null;
