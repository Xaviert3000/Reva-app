-- 038 — Pago con tarjeta por QR en el Autoservicio (kiosk).
-- El cliente escanea un QR y paga en su teléfono vía Stripe Checkout. El registro
-- de la venta lo hace el SERVIDOR de forma idempotente (una sola vez), disparado
-- tanto por el sondeo del kiosko como por el webhook de Stripe — belt & suspenders.
--
-- `kiosk_checkouts` es una fila de staging creada al abrir el Checkout: guarda la
-- orden (items + totales + folio) para poder registrar la venta cuando Stripe
-- confirme el pago, sin depender del estado del navegador del kiosko. `finalized_at`
-- funciona como candado atómico: quien lo pone primero (sondeo o webhook) registra;
-- el otro es un no-op.
create table if not exists kiosk_checkouts (
  id                 uuid primary key default gen_random_uuid(),
  stripe_session_id  text unique not null,
  biz_id             text not null references businesses(id) on delete cascade,
  items              jsonb not null,          -- [{service_id,name,unit_price,qty}]
  subtotal           numeric not null,
  tax_amount         numeric not null default 0,
  tax_rate           numeric not null default 0,
  total              numeric not null,
  item_count         integer not null default 0,
  order_type         text,                    -- 'here' | 'togo' | null
  folio              text not null,
  lang               text,                    -- 'es' | 'en' (etiqueta de la venta)
  finalized_at       timestamptz,             -- candado: set al registrar la venta
  pos_sale_id        uuid,                    -- venta registrada (referencia)
  order_id           uuid,                    -- pedido creado (referencia)
  created_at         timestamptz not null default now()
);

-- Sólo el service role (rutas server-side y webhook) toca esta tabla. RLS activo
-- sin políticas = nadie con sesión de cliente puede leerla/escribirla.
alter table kiosk_checkouts enable row level security;

-- Enlaza la venta de POS con la sesión de Stripe que la originó, para idempotencia
-- y trazabilidad del cobro con tarjeta del kiosko. Null en ventas normales.
alter table pos_sales add column if not exists stripe_session_id text;
create unique index if not exists pos_sales_stripe_session_id_key
  on pos_sales (stripe_session_id) where stripe_session_id is not null;
