-- 028 — Ofertas con programación e imagen.
-- Las ofertas (promotions.kind='oferta') ya podían tener título, descripción
-- (body), tipo (discount) y una vigencia en texto libre (cta). Esta migración
-- las lleva a un modelo estructurado, reutilizando columnas que ya usaban las
-- alertas y añadiendo las que faltaban:
--   • start_date / end_date  → ventana de vigencia (NULL/NULL = permanente).
--   • image_url              → foto de la promoción (bucket `service-images`).
--   • days, start_time, end_time (ya existían para alertas) → ahora también las
--     usan las ofertas: qué días aplica y en qué horario.
-- La imagen se guarda en el bucket público `service-images` (migración 016),
-- bajo la carpeta del negocio, así que no hacen falta nuevas políticas de storage.

alter table promotions add column if not exists start_date date;
alter table promotions add column if not exists end_date   date;
alter table promotions add column if not exists image_url  text;
