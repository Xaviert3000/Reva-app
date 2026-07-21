-- 017 — Etiqueta de precio libre para el catálogo.
-- `services.price` es numeric (se usa para cálculos, POS y filtros). Pero el dueño
-- puede escribir precios no numéricos ("Sin depósito", "Desde $200", "Cotización").
-- `price_label` guarda ese texto tal cual para mostrarlo; si es null se cae al
-- numérico (`$<price>`) o a "Cotización".
alter table services add column if not exists price_label text;
