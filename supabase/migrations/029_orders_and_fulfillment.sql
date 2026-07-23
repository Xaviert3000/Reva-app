-- Pedidos ecommerce + cumplimiento (pickup / delivery) + repartidor.
-- Un negocio puede hacer reservas (services.scheduled=true → flujo Booking) y/o
-- pedidos de productos (services.scheduled=false → carrito + pago Stripe).
-- El toggle `does_orders` habilita el flujo de pedidos en la app cliente.

-- ─────────────────────────────────────────────────────────────
-- Capacidades del negocio.
-- ─────────────────────────────────────────────────────────────
alter table businesses add column if not exists does_reservations boolean default true;
alter table businesses add column if not exists does_orders       boolean default false;
alter table businesses add column if not exists pickup_enabled     boolean default true;
alter table businesses add column if not exists delivery_enabled   boolean default false;
alter table businesses add column if not exists delivery_fee       numeric default 0;

-- ─────────────────────────────────────────────────────────────
-- Pedidos. Ciclo de vida:
--   pending_payment → paid → preparing → ready
--     → (delivery) out_for_delivery → delivered
--     → (pickup)   delivered
--   cualquier punto → cancelled | refunded
-- ─────────────────────────────────────────────────────────────
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  biz_id          text references businesses(id) on delete cascade,
  status          text not null default 'pending_payment',
  fulfillment     text not null default 'pickup',   -- pickup | delivery
  customer_name   text,
  customer_phone  text,
  address         text,                              -- sólo delivery
  notes           text,
  subtotal        numeric not null default 0,
  delivery_fee    numeric not null default 0,
  total           numeric not null default 0,
  courier_id      uuid references auth.users(id) on delete set null,
  stripe_session_id text unique,
  paid_at         timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in (
  'pending_payment','paid','preparing','ready','out_for_delivery','delivered','cancelled','refunded'
));
alter table orders drop constraint if exists orders_fulfillment_check;
alter table orders add constraint orders_fulfillment_check check (fulfillment in ('pickup','delivery'));

create index if not exists orders_biz_idx     on orders (biz_id, created_at desc);
create index if not exists orders_user_idx    on orders (user_id, created_at desc);
create index if not exists orders_courier_idx on orders (courier_id) where courier_id is not null;

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete cascade,
  service_id  uuid references services(id) on delete set null,
  name        text not null,
  unit_price  numeric not null default 0,
  qty         integer not null default 1,
  line_total  numeric not null default 0
);
create index if not exists order_items_order_idx on order_items (order_id);

-- ─────────────────────────────────────────────────────────────
-- Repartidores. Un usuario (auth.users) ligado a un negocio para entregas.
-- Deliberadamente NO se mete a biz_members: is_biz_member() daría acceso RLS
-- a todo el negocio. El repartidor sólo ve/actualiza sus pedidos asignados.
-- ─────────────────────────────────────────────────────────────
create table if not exists couriers (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  biz_id     text references businesses(id) on delete cascade,
  name       text,
  phone      text,
  active     boolean default true,
  created_at timestamptz default now()
);
create index if not exists couriers_biz_idx on couriers (biz_id);

-- Helper: ¿el usuario con sesión es repartidor de este negocio?
create or replace function public.is_courier(p_biz_id text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.couriers c
    where c.biz_id = p_biz_id and c.user_id = auth.uid() and c.active
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table orders enable row level security;

drop policy if exists "Users see own orders" on orders;
create policy "Users see own orders" on orders
  for select using (auth.uid() = user_id);

drop policy if exists "Businesses see their orders" on orders;
create policy "Businesses see their orders" on orders
  for select using (public.is_biz_member(biz_id));

drop policy if exists "Businesses update their orders" on orders;
create policy "Businesses update their orders" on orders
  for update using (public.is_biz_member(biz_id));

drop policy if exists "Couriers see assigned orders" on orders;
create policy "Couriers see assigned orders" on orders
  for select using (auth.uid() = courier_id);

drop policy if exists "Couriers update assigned orders" on orders;
create policy "Couriers update assigned orders" on orders
  for update using (auth.uid() = courier_id);

alter table order_items enable row level security;

drop policy if exists "See items of visible orders" on order_items;
create policy "See items of visible orders" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_biz_member(o.biz_id) or o.courier_id = auth.uid())
    )
  );

alter table couriers enable row level security;

drop policy if exists "Business manages its couriers" on couriers;
create policy "Business manages its couriers" on couriers
  for select using (public.is_biz_member(biz_id));

drop policy if exists "Courier sees own row" on couriers;
create policy "Courier sees own row" on couriers
  for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Realtime: el panel del negocio y el del repartidor se refrescan solos.
-- Idempotente: sólo agrega la tabla si aún no está en la publicación.
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table orders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reservations') then
    alter publication supabase_realtime add table reservations;
  end if;
end $$;

-- Mantén updated_at fresco en cada cambio de estado.
create or replace function public.touch_order_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists orders_touch_updated_at on orders;
create trigger orders_touch_updated_at before update on orders
  for each row execute procedure public.touch_order_updated_at();
