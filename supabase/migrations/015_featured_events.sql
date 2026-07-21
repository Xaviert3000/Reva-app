-- Fase — Tracking real del espacio "Destacado".
-- Hasta ahora el módulo Informes → Destacado mostraba impresiones/clics ficticios.
-- Esta tabla registra los eventos reales del espacio destacado en el app cliente:
--   kind='impression' → el negocio se mostró en el hero/franja de destacados.
--   kind='click'      → el usuario abrió la ficha de un negocio destacado.
-- La vista featured_events_daily agrega por día para el panel (como pos_sales_daily).

create table if not exists featured_events (
  id         uuid primary key default gen_random_uuid(),
  biz_id     text not null references businesses(id) on delete cascade,
  kind       text not null,            -- 'impression' | 'click'
  user_id    uuid references auth.users(id) on delete set null,  -- opcional (invitado sin sesión)
  surface    text,                     -- 'hero' | 'strip' | 'detail'
  created_at timestamptz default now()
);
create index if not exists featured_events_biz_idx on featured_events (biz_id, created_at desc);

alter table featured_events enable row level security;

-- El dueño (miembro del negocio) LEE los eventos de su negocio.
-- Las escrituras las hace el servidor con service-role (ruta /api/featured/track),
-- que salta RLS; no se abren políticas de INSERT a clientes para evitar inflar métricas.
drop policy if exists "Biz members read their featured events" on featured_events;
create policy "Biz members read their featured events" on featured_events
  for select using (public.is_biz_member(biz_id));

-- Agregado diario para Informes: impresiones y clics por negocio/día.
create or replace view featured_events_daily as
  select biz_id,
         date_trunc('day', created_at) as day,
         count(*) filter (where kind = 'impression') as impressions,
         count(*) filter (where kind = 'click')      as clicks
  from featured_events
  group by biz_id, date_trunc('day', created_at);
