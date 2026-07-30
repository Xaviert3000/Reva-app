-- 039 — Evento destacado.
-- Además de destacar TODO el negocio o un PRODUCTO del catálogo (featured_service_id),
-- el negocio puede crear un EVENTO y destacarlo (una función, promoción con fecha,
-- noche especial…). El evento no vive en el catálogo: sus datos se guardan aquí.
--
-- Forma del jsonb:
--   { "title": "...", "date": "2026-08-15", "description": "...", "image_url": "..." }
-- Se llena al comprar el Destacado (draft antes de pagar; visible sólo cuando el
-- webhook pone featured=true). NULL = no se está destacando un evento.
--
-- Relación con featured_service_id (migración 022): son excluyentes. El webhook
-- deja uno u otro según `featured_kind`: evento → featured_event set, service null;
-- producto → service set, event null; todo el negocio → ambos null.
alter table businesses add column if not exists featured_event jsonb;

-- Evento "en borrador" mientras el pago está en curso. Se escribe al iniciar el
-- Checkout (antes de pagar) y el webhook lo promueve a `featured_event` SÓLO cuando
-- el pago se confirma. Así, si el dueño cancela el pago, el destacado activo actual
-- (p. ej. un producto ya pagado) NO se ve afectado.
alter table businesses add column if not exists featured_event_pending jsonb;
