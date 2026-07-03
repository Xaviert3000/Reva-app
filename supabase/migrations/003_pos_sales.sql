-- Punto de venta (POS)
-- El catálogo de productos/servicios ya vive en la tabla `services` (001).
-- Esta migración agrega lo que faltaba: registrar las ventas (tickets) que se
-- cobran desde el panel del negocio → Punto de venta, ligadas al catálogo.

-- 1. Imagen opcional del producto en el catálogo (el POS y el catálogo la usan).
alter table services add column if not exists image_url text;

-- Índice para listar el catálogo activo de un negocio rápido.
create index if not exists idx_services_biz_active on services (biz_id, active);

-- 2. Venta (encabezado del ticket). Precios con IVA 16% incluido, como en el app.
create table if not exists pos_sales (
  id             uuid primary key default gen_random_uuid(),
  biz_id         text not null references businesses(id) on delete cascade,
  cashier_id     uuid references auth.users(id),          -- quién cobró (owner/staff)
  subtotal       numeric not null default 0,              -- base sin IVA (total / 1.16)
  tax_amount     numeric not null default 0,              -- IVA incluido
  tax_rate       numeric not null default 0.16,
  total          numeric not null default 0,              -- lo que se cobró
  item_count     integer not null default 0,
  currency       text not null default 'mxn',
  payment_method text not null,                           -- efectivo | tarjeta | transferencia
  status         text not null default 'paid',            -- paid | refunded | void
  reservation_id uuid references reservations(id),        -- opcional: venta ligada a una reserva
  note           text,
  created_at     timestamptz default now()
);

-- 3. Renglones del ticket. Guardamos snapshot de nombre y precio al momento de la
--    venta (el precio del catálogo puede cambiar después). service_id liga al catálogo.
create table if not exists pos_sale_items (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references pos_sales(id) on delete cascade,
  service_id  uuid references services(id) on delete set null,  -- vínculo al catálogo
  name        text not null,                                    -- nombre al vender
  unit_price  numeric not null default 0,
  qty         integer not null default 1 check (qty > 0),
  line_total  numeric generated always as (unit_price * qty) stored
);

create index if not exists idx_pos_sales_biz       on pos_sales (biz_id, created_at desc);
create index if not exists idx_pos_sale_items_sale on pos_sale_items (sale_id);
create index if not exists idx_pos_sale_items_svc  on pos_sale_items (service_id);

-- 4. RLS: cada negocio (sus miembros en biz_members) ve y administra solo sus ventas.
alter table pos_sales enable row level security;
drop policy if exists "Biz members manage their sales" on pos_sales;
create policy "Biz members manage their sales" on pos_sales
  for all
  using (exists (
    select 1 from biz_members m
    where m.biz_id = pos_sales.biz_id and m.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from biz_members m
    where m.biz_id = pos_sales.biz_id and m.user_id = auth.uid()
  ));

alter table pos_sale_items enable row level security;
drop policy if exists "Biz members manage their sale items" on pos_sale_items;
create policy "Biz members manage their sale items" on pos_sale_items
  for all
  using (exists (
    select 1 from pos_sales s
    join biz_members m on m.biz_id = s.biz_id
    where s.id = pos_sale_items.sale_id and m.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from pos_sales s
    join biz_members m on m.biz_id = s.biz_id
    where s.id = pos_sale_items.sale_id and m.user_id = auth.uid()
  ));

-- 5. (Opcional) Vista de ventas por día — útil para Métricas.
create or replace view pos_sales_daily as
  select biz_id,
         date_trunc('day', created_at) as day,
         count(*)        as tickets,
         sum(total)      as revenue,
         sum(item_count) as items
  from pos_sales
  where status = 'paid'
  group by biz_id, date_trunc('day', created_at);
