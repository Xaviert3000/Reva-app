-- Código de confirmación por pedido (capa de seguridad en la entrega).
-- El cliente ve un código de 4 dígitos en su pedido; al recibirlo (recoger en el
-- local o entrega a domicilio) el negocio o el repartidor se lo PIDE y lo captura.
-- El código NO se expone al operador ni al repartidor: las rutas API lo omiten al
-- listar y validan la coincidencia con el service role antes de marcar 'delivered'.
-- Así el que entrega debe pedírselo al cliente, y confirma que quien recibe es
-- quien lo pidió.

-- ─────────────────────────────────────────────────────────────
-- Columna + default. random() es volátil → se evalúa por fila, así que tanto el
-- default como el backfill generan un código distinto para cada pedido.
-- ─────────────────────────────────────────────────────────────
alter table orders
  add column if not exists confirmation_code text
  default lpad((floor(random() * 10000))::int::text, 4, '0');

-- Backfill de pedidos ya existentes (uno distinto por fila).
update orders
  set confirmation_code = lpad((floor(random() * 10000))::int::text, 4, '0')
  where confirmation_code is null;

-- ─────────────────────────────────────────────────────────────
-- El código viaja al cliente en la notificación de "listo"/"en camino" (además
-- de verse en su pedido). Se reescribe notify_order_status (de 030) para anexarlo
-- al cuerpo. La lógica de disparo es idéntica; sólo cambia el texto del body.
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
  v_code     text;
begin
  if new.user_id is null then return new; end if;
  if new.status is not distinct from old.status then return new; end if;
  if new.status not in ('ready', 'out_for_delivery') then return new; end if;

  select b.name into v_biz_name from public.businesses b where b.id = new.biz_id;
  v_code := new.confirmation_code;

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

  -- Anexa el código: el cliente lo da al recibir para confirmar el pedido.
  if v_code is not null then
    v_body := v_body || ' Código: ' || v_code || '.';
  end if;

  insert into public.notifications (user_id, type, title, body, biz_name, order_id)
  values (new.user_id, v_type, v_title, v_body, v_biz_name, new.id);

  return new;
end;
$$;
