-- 021 — Reposición de inventario al anular/reembolsar una venta.
-- Hermano de `decrement_service_stock` (migración 006): cuando el dueño anula o
-- reembolsa un ticket y decide devolver las unidades, este RPC vuelve a sumar al
-- inventario los productos con seguimiento (stock not null). Los productos sin
-- seguimiento (stock null = ilimitado) se ignoran.
--
-- Se llama SÓLO desde el servidor (ruta /api/biz/sales con service role), que ya
-- verificó que la venta pertenece a un negocio del dueño; por eso, a diferencia
-- del RPC de descuento, no revalida auth.uid() (el service role no tiene sesión).
-- Se revoca de public/authenticated para que ningún cliente pueda sumar stock
-- arbitrariamente; sólo el service role puede ejecutarlo.
create or replace function increment_service_stock(p_biz_id text, p_items jsonb)
returns table (service_id uuid, stock integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update services s
     set stock = s.stock + (i.qty)::int
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

revoke all on function increment_service_stock(text, jsonb) from public;
revoke all on function increment_service_stock(text, jsonb) from authenticated;
grant execute on function increment_service_stock(text, jsonb) to service_role;
