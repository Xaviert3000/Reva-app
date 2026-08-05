-- Persistencia de las tarjetas de pedido del chat cliente↔negocio. Cuando el
-- agente de IA del negocio propone un pedido, su respuesta trae líneas
-- {serviceId, qty} que la app pinta como tarjetas "Agregar". Antes solo viajaban
-- en la respuesta del POST (transitorias): al recargar el chat desaparecían.
-- Guardarlas en la propia fila del mensaje deja que reaparezcan al recargar, sin
-- ensuciar el texto visible (el `body` sigue limpio; el panel del negocio no ve
-- ningún marcador). Null/ausente = mensaje sin pedido (la app lo trata como []).
alter table messages add column if not exists order_items jsonb;
