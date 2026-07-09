-- Reparación: la migración 007 quedó aplicada a medias en producción.
-- La columna `tier` sí se creó, pero `featured_until` NO existe en la tabla
-- `businesses` (probablemente 007 abortó en el paso del constraint/backfill
-- antes de llegar al paso 4). Como /app pide `featured_until` en su SELECT
-- (src/lib/business-data.ts → fetchCityData), la consulta falla con
-- "column businesses.featured_until does not exist" y fetchCityData devuelve
-- lista vacía para cualquier municipio real (Loreto se veía vacío; Los Cabos
-- lo enmascaraba porque cae al demo curado cuando la consulta falla).
--
-- Esta migración re-aplica de forma idempotente los pasos faltantes de 007.

-- Nivel de visibilidad (por si tampoco quedó en algún entorno).
alter table businesses add column if not exists tier text
  check (tier is null or tier in ('premium', 'destacado'));

-- Coherencia tier/featured.
alter table businesses drop constraint if exists businesses_tier_requires_featured;
alter table businesses add constraint businesses_tier_requires_featured
  check (tier is null or featured is true);

-- Backfill de los ya destacados.
update businesses set tier = 'destacado'
  where featured is true and tier is null;

-- La columna que faltaba: vigencia del plan comprado. NULL = sin expiración.
alter table businesses add column if not exists featured_until timestamptz;

-- Índice por nivel.
create index if not exists idx_businesses_tier on businesses (municipio, tier)
  where tier is not null;
