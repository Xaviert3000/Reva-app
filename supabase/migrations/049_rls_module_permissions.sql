-- Fase 4 del sistema de empleados: enforcement por MÓDULO también a nivel RLS.
--
-- Catálogo, Inventario y Punto de venta escriben directo a Supabase desde el
-- navegador (no pasan por /api/biz/*), así que el guard server-side por módulo
-- no los cubre: hasta ahora sus policies solo exigían ser miembro del negocio.
-- Esta migración las hace respetar biz_members.permissions (migración 048), para
-- que un cajero no pueda, p. ej., editar el catálogo aunque conozca el camino.
--
-- Equivalente SQL de canAccessModule (src/lib/biz-roles.ts):
--   owner/admin (y el legado 'staff') ven todo; el resto necesita que alguno de
--   los módulos pedidos esté en permissions.modules.

create or replace function has_biz_module(p_biz_id text, p_modules text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from biz_members m
    where m.biz_id = p_biz_id
      and m.user_id = auth.uid()
      and (
        m.role in ('owner', 'admin', 'staff')          -- acceso total (bypass)
        or (m.permissions -> 'modules') ?| p_modules   -- o el módulo está permitido
      )
  );
$$;

grant execute on function has_biz_module(text, text[]) to authenticated;

-- ── services (Catálogo + Inventario) ──────────────────────────────
-- La lectura sigue siendo por membresía (POS necesita leer el catálogo). La
-- escritura se separa: crear/borrar productos = Catálogo; editar (incluye ajustar
-- stock) = Catálogo o Inventario. El descuento de stock al vender usa el RPC
-- SECURITY DEFINER (decrement_service_stock), que valida membresía y no depende
-- de esta policy.
drop policy if exists "Biz members manage their services" on services;

drop policy if exists "Catalog members create services" on services;
create policy "Catalog members create services" on services
  for insert
  with check (has_biz_module(services.biz_id, array['catalog']));

drop policy if exists "Catalog or inventory members edit services" on services;
create policy "Catalog or inventory members edit services" on services
  for update
  using (has_biz_module(services.biz_id, array['catalog', 'inventory']))
  with check (has_biz_module(services.biz_id, array['catalog', 'inventory']));

drop policy if exists "Catalog members delete services" on services;
create policy "Catalog members delete services" on services
  for delete
  using (has_biz_module(services.biz_id, array['catalog']));

-- ── pos_sales / pos_sale_items (Punto de venta / Autoservicio / Ventas) ──
-- Tocar ventas desde el cliente exige Punto de venta, Autoservicio o Ventas.
-- (El historial y anular/reembolsar en /api/biz/sales usan el admin client y no
-- dependen de RLS; el registro de una venta desde POS/kiosk sí pasa por aquí.)
drop policy if exists "Biz members manage their sales" on pos_sales;
create policy "Sales-module members manage their sales" on pos_sales
  for all
  using (has_biz_module(pos_sales.biz_id, array['pos', 'kiosk', 'sales']))
  with check (has_biz_module(pos_sales.biz_id, array['pos', 'kiosk', 'sales']));

drop policy if exists "Biz members manage their sale items" on pos_sale_items;
create policy "Sales-module members manage their sale items" on pos_sale_items
  for all
  using (exists (
    select 1 from pos_sales s
    where s.id = pos_sale_items.sale_id
      and has_biz_module(s.biz_id, array['pos', 'kiosk', 'sales'])
  ))
  with check (exists (
    select 1 from pos_sales s
    where s.id = pos_sale_items.sale_id
      and has_biz_module(s.biz_id, array['pos', 'kiosk', 'sales'])
  ));
