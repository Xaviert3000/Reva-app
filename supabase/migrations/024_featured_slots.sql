-- Cupos de Destacados por categoría × municipio. El módulo /admin → Destacados
-- muestra "ocupación de cupos": cuántos negocios Premium/Destacado caben por
-- categoría y municipio, y cuántos están vendidos. Los VENDIDOS se derivan en
-- vivo de `businesses` (tier + featured_until), pero la CAPACIDAD (cuántos cupos
-- existen) es una política que fija el super-admin: esta tabla la respalda.
--
-- Sin fila para una combinación categoría×municipio se usan los defaults
-- (premium 2 / destacado 8). El admin puede sobrescribirlos (upsert) desde el
-- panel. La "lista de espera" NO se guarda aquí: se deriva de los negocios
-- activos sin visibilidad pagada en esa categoría×municipio.

create table if not exists featured_slots (
  id            uuid primary key default gen_random_uuid(),
  categoria     text not null,
  municipio     text not null,
  premium_cap   integer not null default 2  check (premium_cap   >= 0),
  destacado_cap integer not null default 8  check (destacado_cap >= 0),
  updated_at    timestamptz default now(),
  unique (categoria, municipio)
);

-- Solo el super-admin (service role, que bypassa RLS) lee y escribe cupos.
-- RLS habilitado sin políticas = bloqueado para clientes anónimos/autenticados.
alter table featured_slots enable row level security;
