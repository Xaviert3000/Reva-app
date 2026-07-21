-- 022 — Producto destacado del negocio.
-- Hasta ahora `businesses` solo sabía SI un negocio estaba destacado (featured +
-- tier + featured_until, migración 007), pero no CUÁL producto eligió destacar.
-- El panel (/biz → Destacado) deja elegir un servicio específico ("jamaica"),
-- así que guardamos su id para que /app pueda pintar su imagen en la tarjeta de
-- Discover en vez de la portada genérica del catálogo.
--
-- Relación con `featured`:
--   featured = false            → sin destacar; featured_service_id debe ser NULL.
--   featured = true, service NULL → destaca "Todo el negocio" (usa la portada).
--   featured = true, service set  → destaca ese producto (usa su imagen).
-- El webhook de Stripe lo escribe al confirmarse el pago; clearFeatured lo limpia
-- junto con featured/tier al pausar.

-- Si el servicio se borra, no queremos dejar un id colgando: cae a NULL y /app
-- vuelve a la portada del catálogo.
alter table businesses add column if not exists featured_service_id uuid
  references services(id) on delete set null;

-- Coherencia: no puede haber producto destacado sin que el negocio esté featured.
alter table businesses drop constraint if exists businesses_featured_service_requires_featured;
alter table businesses add constraint businesses_featured_service_requires_featured
  check (featured_service_id is null or featured is true);
