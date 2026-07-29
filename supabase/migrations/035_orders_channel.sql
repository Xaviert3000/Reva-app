-- Canal de origen de cada pedido, para que el tablero de Pedidos (elaboración +
-- entrega) reciba también las ventas hechas en el local:
--   ecommerce → pedido de la app cliente (carrito + pago Stripe)      [default]
--   pos       → venta cobrada en el Punto de venta
--   kiosk     → orden hecha por el cliente en el Autoservicio
--
-- Las ventas en el local ya se registran en `pos_sales` (ingresos/Informes). El
-- pedido en `orders` es SÓLO el flujo operativo de preparación/entrega, así que
-- no duplica ingresos (Métricas e Informes siguen leyendo de `pos_sales`).
--
-- Los pedidos en el local no tienen user_id (no hay cliente con sesión) ni
-- confirmation_code (nadie da un código al recoger en caja): el trigger de
-- notificaciones ya no-opera cuando user_id es NULL, y /api/biz/orders sólo exige
-- el código al marcar 'delivered' cuando el pedido tiene uno.

alter table orders
  add column if not exists channel text not null default 'ecommerce';

alter table orders drop constraint if exists orders_channel_check;
alter table orders add constraint orders_channel_check
  check (channel in ('ecommerce', 'pos', 'kiosk'));

create index if not exists orders_biz_channel_idx on orders (biz_id, channel, created_at desc);
