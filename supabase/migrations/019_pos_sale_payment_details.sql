-- 019 — Datos de la transacción en cada venta del Punto de venta.
-- Al cobrar con Tarjeta o Transferencia el dueño ahora captura el comprobante de
-- la operación. Antes esos datos sólo se imprimían en el ticket y se perdían: no
-- quedaban en la base para conciliación / informes / auditoría. Aquí se persisten
-- junto al encabezado de la venta (`pos_sales`, migración 003).
--
--   auth_code  — Tarjeta: código de autorización que devuelve la terminal.
--   card_last4 — Tarjeta: últimos 4 dígitos de la tarjeta (nunca el número completo).
--   reference  — Transferencia: folio / referencia del comprobante.
--
-- Todas opcionales: Efectivo no las usa y el dueño puede no tenerlas a la mano.
alter table pos_sales add column if not exists auth_code  text;
alter table pos_sales add column if not exists card_last4 text;
alter table pos_sales add column if not exists reference  text;
