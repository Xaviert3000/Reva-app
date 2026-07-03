-- Inventario de productos/servicios
-- Agrega seguimiento de existencias al catálogo (`services`, creado en 001).
-- `stock` NULL = disponibilidad ilimitada (sin seguimiento).
-- `stock` numérico (incl. 0) = con seguimiento; 0 = agotado.
-- Cada venta en el Punto de venta descuenta de aquí de forma atómica, de modo
-- que el mismo número queda disponible para la app del cliente (`/app`), que lee
-- el catálogo real desde esta tabla.

-- 1. Columna de existencias.
alter table services add column if not exists stock integer
  check (stock is null or stock >= 0);

-- Índice para listar rápido lo que tiene poco/nada de inventario.
create index if not exists idx_services_biz_stock on services (biz_id, stock);

-- 2. RLS del catálogo. Antes `services` estaba sin RLS (abierta). Ahora que el
--    panel del negocio escribe existencias, la aseguramos: lectura pública del
--    catálogo activo (lo que consume `/app`) y administración sólo para los
--    miembros del negocio (biz_members).
alter table services enable row level security;

drop policy if exists "Public reads active services" on services;
create policy "Public reads active services" on services
  for select
  using (active is true);

drop policy if exists "Biz members read their services" on services;
create policy "Biz members read their services" on services
  for select
  using (exists (
    select 1 from biz_members m
    where m.biz_id = services.biz_id and m.user_id = auth.uid()
  ));

drop policy if exists "Biz members manage their services" on services;
create policy "Biz members manage their services" on services
  for all
  using (exists (
    select 1 from biz_members m
    where m.biz_id = services.biz_id and m.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from biz_members m
    where m.biz_id = services.biz_id and m.user_id = auth.uid()
  ));

-- 3. Descuento atómico de inventario al vender.
--    Recibe [{ "service_id": "<uuid>", "qty": <int> }, ...]; sólo toca renglones
--    con seguimiento (stock not null), nunca baja de 0, e ignora productos
--    ilimitados. Devuelve el stock resultante de cada servicio tocado.
--    SECURITY DEFINER para poder ejecutarse dentro de la venta; valida que quien
--    llama sea miembro del negocio dueño de cada servicio.
create or replace function decrement_service_stock(p_biz_id text, p_items jsonb)
returns table (service_id uuid, stock integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  is_member boolean;
begin
  select exists (
    select 1 from biz_members m
    where m.biz_id = p_biz_id and m.user_id = auth.uid()
  ) into is_member;

  if not is_member then
    raise exception 'not a member of business %', p_biz_id;
  end if;

  return query
  update services s
     set stock = greatest(0, s.stock - (i.qty)::int)
    from (
      select (elem->>'service_id')::uuid as service_id,
             (elem->>'qty')::int         as qty
      from jsonb_array_elements(p_items) as elem
    ) i
   where s.id = i.service_id
     and s.biz_id = p_biz_id
     and s.stock is not null          -- sólo productos con seguimiento
   returning s.id, s.stock;
end;
$$;

revoke all on function decrement_service_stock(text, jsonb) from public;
grant execute on function decrement_service_stock(text, jsonb) to authenticated;
