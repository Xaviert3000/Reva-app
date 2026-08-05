-- App del repartidor + seguimiento del pedido.
-- Añade lo que necesitan la app nativa de repartidor y la vista de seguimiento
-- del cliente:
--   1) ETA: hora estimada de llegada que fija el repartidor al salir.
--   2) Contacto del repartidor desnormalizado en el pedido, para que el CLIENTE
--      pueda ver nombre/teléfono (no puede leer la tabla `couriers` por RLS).
--   3) Chat pedido↔repartidor (order_messages) con RLS + realtime.
--   4) Aviso (notifications) al recibir un mensaje → reusa el push server-side.

-- ─────────────────────────────────────────────────────────────
-- 1) ETA de entrega.
-- ─────────────────────────────────────────────────────────────
alter table orders add column if not exists eta_at timestamptz;

-- ─────────────────────────────────────────────────────────────
-- 2) Contacto del repartidor visible al cliente. Lo llena un trigger cuando se
--    asigna/cambia `courier_id`. Así el cliente puede llamar/WhatsApp al
--    repartidor sin darle acceso RLS a la tabla `couriers`.
-- ─────────────────────────────────────────────────────────────
alter table orders add column if not exists courier_name  text;
alter table orders add column if not exists courier_phone text;

create or replace function public.fill_courier_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.courier_id is distinct from old.courier_id then
    if new.courier_id is null then
      new.courier_name  := null;
      new.courier_phone := null;
    else
      select c.name, c.phone
        into new.courier_name, new.courier_phone
        from public.couriers c
       where c.user_id = new.courier_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_fill_courier_contact on orders;
create trigger orders_fill_courier_contact
  before update of courier_id on orders
  for each row execute function public.fill_courier_contact();

-- Backfill para pedidos ya asignados.
update orders o
   set courier_name = c.name, courier_phone = c.phone
  from couriers c
 where o.courier_id = c.user_id
   and o.courier_id is not null;

-- ─────────────────────────────────────────────────────────────
-- 3) Chat del pedido. Sólo entre el CLIENTE dueño del pedido y el REPARTIDOR
--    asignado. Mensajes en tiempo real (realtime) para ambas apps.
-- ─────────────────────────────────────────────────────────────
create table if not exists order_messages (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  sender_id   uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('customer','courier')),
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);
create index if not exists order_messages_order_idx on order_messages (order_id, created_at);

alter table order_messages enable row level security;

-- Leer: los dos participantes del pedido (dueño + repartidor asignado).
drop policy if exists "Participants read order messages" on order_messages;
create policy "Participants read order messages" on order_messages
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_messages.order_id
        and (o.user_id = auth.uid() or o.courier_id = auth.uid())
    )
  );

-- Enviar: sólo como uno mismo (sender_id = auth.uid()) y siendo participante.
drop policy if exists "Participants send order messages" on order_messages;
create policy "Participants send order messages" on order_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from orders o
      where o.id = order_messages.order_id
        and (o.user_id = auth.uid() or o.courier_id = auth.uid())
    )
  );

-- Marcar leído: cualquiera de los participantes puede fijar read_at.
drop policy if exists "Participants update order messages" on order_messages;
create policy "Participants update order messages" on order_messages
  for update using (
    exists (
      select 1 from orders o
      where o.id = order_messages.order_id
        and (o.user_id = auth.uid() or o.courier_id = auth.uid())
    )
  );

-- Realtime: ambas apps reciben los mensajes al instante (RLS aplica al canal).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_messages'
  ) then
    alter publication supabase_realtime add table order_messages;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 4) Aviso al recibir un mensaje. Inserta en `notifications` para el OTRO
--    participante, lo que a su vez dispara el push server-side (migración 034)
--    y lo muestra en el panel de avisos de la app. Una sola tubería.
-- ─────────────────────────────────────────────────────────────
create or replace function public.notify_order_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id    uuid;
  v_courier_id uuid;
  v_biz_id     text;
  v_biz_name   text;
  v_recipient  uuid;
  v_title      text;
begin
  select o.user_id, o.courier_id, o.biz_id
    into v_user_id, v_courier_id, v_biz_id
    from public.orders o
   where o.id = new.order_id;

  -- El destinatario es el participante contrario al que envió.
  if new.sender_role = 'customer' then
    v_recipient := v_courier_id;
    v_title     := 'Mensaje del cliente';
  else
    v_recipient := v_user_id;
    v_title     := 'Mensaje del repartidor';
  end if;

  if v_recipient is null then return new; end if;

  select b.name into v_biz_name from public.businesses b where b.id = v_biz_id;

  insert into public.notifications (user_id, type, title, body, biz_name, order_id)
  values (v_recipient, 'order_message', v_title, left(new.body, 140), v_biz_name, new.order_id);

  return new;
end;
$$;

drop trigger if exists order_messages_notify on order_messages;
create trigger order_messages_notify
  after insert on order_messages
  for each row execute function public.notify_order_message();
