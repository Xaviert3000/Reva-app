-- Vincula cada reseña con el pedido o la reserva que la originó.
-- Así la app cliente puede saber, al recargar, qué pedidos/reservas ya reseñó
-- (antes el estado "Reseña publicada" vivía sólo en memoria y se perdía).
-- Ambas columnas son opcionales: una reseña proviene de un pedido O de una
-- reserva (o de ninguna, si se dejara desde la ficha del negocio).

alter table reviews add column if not exists order_id       uuid references orders(id)       on delete set null;
alter table reviews add column if not exists reservation_id uuid references reservations(id) on delete set null;

-- Un mismo cliente no debería reseñar dos veces el mismo pedido/reserva.
create unique index if not exists reviews_user_order_uidx
  on reviews (user_id, order_id) where order_id is not null;
create unique index if not exists reviews_user_reservation_uidx
  on reviews (user_id, reservation_id) where reservation_id is not null;

-- Índices para consultar "¿ya reseñé esto?" desde /api/reviews.
create index if not exists reviews_order_idx       on reviews (order_id);
create index if not exists reviews_reservation_idx  on reviews (reservation_id);
