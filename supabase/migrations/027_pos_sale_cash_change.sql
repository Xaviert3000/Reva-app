-- 027 — Efectivo recibido y cambio devuelto en cada venta del Punto de venta.
-- Al cobrar en Efectivo el dueño ahora captura cuánto recibió y la app calcula el
-- cambio a devolver. Antes ese dato sólo se mostraba en el momento del cobro y se
-- perdía: no quedaba en la base ni aparecía al reimprimir el ticket desde Ventas.
-- Aquí se persiste junto al encabezado de la venta (`pos_sales`, migración 003),
-- igual que auth_code / card_last4 / reference (migración 019).
--
--   cash_received — Efectivo: monto en efectivo que entregó el cliente.
--   change_due    — Efectivo: cambio devuelto (cash_received - total; 0 si exacto).
--
-- Ambas opcionales: sólo se llenan al cobrar en Efectivo con monto capturado;
-- las ventas con Tarjeta / Transferencia y las anteriores a esta migración las
-- dejan en null.
alter table pos_sales add column if not exists cash_received numeric(12,2);
alter table pos_sales add column if not exists change_due    numeric(12,2);
