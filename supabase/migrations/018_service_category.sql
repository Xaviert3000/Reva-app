-- 018 — Categoría del catálogo por servicio.
-- El dueño agrupa su catálogo con categorías libres ("Comida", "Bebidas", "Mesas").
-- Antes vivían sólo en el estado local del panel y se perdían al recargar: todo
-- volvía a "General". Ahora se persisten aquí. Null / vacío = "General" al mostrar.
alter table services add column if not exists category text;
