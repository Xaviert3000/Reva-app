-- 020 — Folio visible del ticket en cada venta del Punto de venta.
-- El folio que se imprime en el ticket (y que ve el cliente) se derivaba del
-- timestamp local al momento de imprimir y NUNCA se guardaba: por eso el dueño
-- no podía buscar un ticket por ese número para consultarlo, anularlo o
-- reembolsarlo. Aquí se persiste junto al encabezado de la venta (`pos_sales`,
-- migración 003) para que el historial de Ventas sea buscable por ese folio.
--
--   folio — número corto e imprimible del ticket (ej. "417890"). No es único a
--           nivel global; es el identificador legible que se muestra en el papel.
alter table pos_sales add column if not exists folio text;

-- Búsqueda rápida por folio dentro de un negocio (historial de Ventas).
create index if not exists idx_pos_sales_biz_folio on pos_sales (biz_id, folio);
