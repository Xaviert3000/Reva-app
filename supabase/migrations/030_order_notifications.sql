-- Notificaciones para el cliente cuando su pedido cambia de estatus.
-- El disparo ocurre en un trigger sobre `orders`, no en las rutas API, para que
-- la notificación se cree sin importar quién mueva el pedido: el dueño desde el
-- panel (drag&drop / "Marcar entregado" vía /api/biz/orders) o el repartidor
-- (vía /api/courier/orders). Una sola fuente de verdad.
--
-- Estatus que notifican al cliente:
--   ready            → "Listo para recoger" (pickup) / "Pedido listo" (delivery)
--   out_for_delivery → "Pedido en camino"

-- ─────────────────────────────────────────────────────────────
-- Tabla de notificaciones. Genérica (type + title/body) para poder alojar más
-- tipos en el futuro (reservas, promos, mensajes); hoy la llena el trigger de
-- pedidos. `biz_name` se guarda desnormalizado para pintar sin joins.
-- ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,                 -- order_ready | order_out_for_delivery | ...
  title      text not null,
  body       text,
  biz_name   text,
  order_id   uuid references orders(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- RLS: cada usuario ve y marca como leídas SOLO sus notificaciones.
-- No hay política de INSERT para usuarios: las inserta el trigger (security
-- definer), nunca el cliente.
-- ─────────────────────────────────────────────────────────────
alter table notifications enable row level security;

drop policy if exists "Users see own notifications" on notifications;
create policy "Users see own notifications" on notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on notifications;
create policy "Users update own notifications" on notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Realtime: la app cliente recibe la notificación al instante. RLS aplica al
-- canal, así que cada quien recibe solo las suyas.
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Trigger: al pasar un pedido a `ready` u `out_for_delivery`, inserta la
-- notificación para el dueño del pedido. Idempotente por transición: solo
-- dispara cuando el estatus realmente cambió a uno de esos valores.
-- ─────────────────────────────────────────────────────────────
create or replace function public.notify_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_biz_name text;
  v_type     text;
  v_title    text;
  v_body     text;
begin
  -- Sin dueño (checkout anónimo) o estatus sin cambiar → nada que notificar.
  if new.user_id is null then return new; end if;
  if new.status is not distinct from old.status then return new; end if;
  if new.status not in ('ready', 'out_for_delivery') then return new; end if;

  select b.name into v_biz_name from public.businesses b where b.id = new.biz_id;

  if new.status = 'ready' then
    v_type := 'order_ready';
    if new.fulfillment = 'delivery' then
      v_title := 'Pedido listo';
      v_body  := coalesce(v_biz_name, 'El negocio') || ' terminó tu pedido. Va en camino en breve.';
    else
      v_title := 'Listo para recoger';
      v_body  := 'Tu pedido en ' || coalesce(v_biz_name, 'el negocio') || ' ya está listo para recoger.';
    end if;
  else
    v_type := 'order_out_for_delivery';
    v_title := 'Pedido en camino';
    v_body  := 'Tu pedido de ' || coalesce(v_biz_name, 'el negocio') || ' va en camino.';
  end if;

  insert into public.notifications (user_id, type, title, body, biz_name, order_id)
  values (new.user_id, v_type, v_title, v_body, v_biz_name, new.id);

  return new;
end;
$$;

drop trigger if exists orders_notify_status on orders;
create trigger orders_notify_status after update on orders
  for each row execute procedure public.notify_order_status();
