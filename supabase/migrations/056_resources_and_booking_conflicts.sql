-- Recursos agendables (profesionales / sillones) + anti-conflicto de reservas.
--
-- Contexto: hasta ahora una reserva se insertaba a ciegas — sin duración, sin
-- asignación a nadie y SIN detección de solapamientos. La disponibilidad que veía
-- el cliente salía de una agenda demo hardcodeada, así que en producción ningún
-- horario se marcaba como ocupado y dos clientes podían reservar la misma hora con
-- el mismo dentista. Esta migración introduce el modelo correcto:
--
--   • Se agenda contra un RECURSO (la persona/sillón que sólo hace una cosa a la
--     vez), no contra el servicio. Todos los servicios comparten la línea de
--     tiempo del recurso; la DURACIÓN los separa.
--   • Un negocio sin recursos definidos = 1 recurso "Principal" (creado aquí). El
--     dentista solo nunca necesita tocar la UI de Profesionales.
--   • Un consultorio con varios dentistas = varios recursos; cada servicio declara
--     qué recursos lo realizan (service_resources).
--
-- El exclusion constraint (btree_gist) hace imposible, a nivel BD y a prueba de
-- carreras, doblar una reserva sobre el mismo recurso.

-- Rangos con operador && sobre columnas escalares (resource_id) requieren btree_gist.
create extension if not exists btree_gist;

-- ── Recursos: profesionales o estaciones agendables ──────────────────────────
create table if not exists resources (
  id         uuid primary key default gen_random_uuid(),
  biz_id     text not null references businesses(id) on delete cascade,
  name       text not null,
  kind       text not null default 'person',   -- person | station
  active     boolean not null default true,
  hours_json jsonb,                             -- horario propio; null = hereda el del negocio
  sort_order int default 0,
  created_at timestamptz default now()
);
create index if not exists resources_biz_idx on resources (biz_id);

-- ── Qué recursos pueden realizar cada servicio (N:N) ─────────────────────────
-- Sin filas para un servicio = lo puede dar CUALQUIER recurso activo del negocio.
create table if not exists service_resources (
  service_id  uuid not null references services(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  primary key (service_id, resource_id)
);
create index if not exists service_resources_service_idx  on service_resources (service_id);
create index if not exists service_resources_resource_idx on service_resources (resource_id);

-- ── Reservas: asignación a recurso + duración (snapshot) ─────────────────────
alter table reservations add column if not exists resource_id  uuid references resources(id) on delete set null;
alter table reservations add column if not exists duration_min int;

-- Rango [inicio, inicio+duración) calculado, base del anti-solapamiento.
alter table reservations add column if not exists slot_range tstzrange
  generated always as (
    case
      when slot is not null and duration_min is not null
        then tstzrange(slot, slot + make_interval(mins => duration_min))
    end
  ) stored;

-- ── Recurso "Principal" por defecto para cada negocio existente ──────────────
-- Toma el nombre del negocio (o "Principal"); así el dentista solo ya tiene su
-- recurso listo sin configurar nada.
insert into resources (biz_id, name, kind, sort_order)
select b.id, coalesce(nullif(b.full_name, ''), nullif(b.name, ''), 'Principal'), 'person', 0
from businesses b
where not exists (select 1 from resources r where r.biz_id = b.id);

-- ── Backfill de duración para reservas históricas (sólo para mostrar) ─────────
update reservations rz
set duration_min = coalesce(s.duration_min, 60)
from services s
where rz.service_id = s.id and rz.duration_min is null and rz.slot is not null;

update reservations rz
set duration_min = 60
where rz.duration_min is null and rz.slot is not null;

-- OJO: a propósito NO asignamos resource_id a las reservas históricas. Durante el
-- periodo sin validación pudieron crearse solapamientos reales; asignarlas a un
-- recurso haría fallar el exclusion constraint de abajo. Se quedan con
-- resource_id = null (quedan fuera del constraint) — sólo las nuevas se blindan.

-- ── Anti-conflicto: un recurso no puede tener dos reservas activas que se ─────
-- solapen en el tiempo. Parcial: ignora históricas sin recurso y las canceladas.
alter table reservations drop constraint if exists reservations_no_overlap;
alter table reservations add constraint reservations_no_overlap
  exclude using gist (
    resource_id with =,
    slot_range with &&
  )
  where (resource_id is not null and slot_range is not null and status not in ('cancelled', 'no_show'));

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Los recursos son públicos de lectura (el cliente necesita saber la
-- disponibilidad); la escritura va por el server (service role) tras verificar
-- que quien edita es dueño/admin del negocio.
alter table resources enable row level security;
drop policy if exists "Resources public read" on resources;
create policy "Resources public read" on resources for select using (true);

alter table service_resources enable row level security;
drop policy if exists "Service resources public read" on service_resources;
create policy "Service resources public read" on service_resources for select using (true);
