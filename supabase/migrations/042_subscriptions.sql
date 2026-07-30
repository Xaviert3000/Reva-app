-- Suscripción mensual del negocio a Reva ($300/mes) con 15 días de prueba.
--
-- Modelo:
--  · Al crearse un negocio empieza su prueba: trial_ends_at = now() + 15 días y
--    plan_status = 'trialing'. Durante la prueba el panel funciona completo y no
--    se cobra nada.
--  · Cuando el dueño "activa el plan", Stripe crea una suscripción (mode:
--    subscription) que respeta lo que quede de prueba (trial_period_days) y luego
--    cobra $300/mes. El webhook sincroniza estado, próximo cobro y facturas.
--  · Cada factura mensual de Stripe se refleja en la tabla `invoices` para que el
--    super admin vea los cobros aplicados y la próxima factura de cada negocio.

-- ── Columnas de suscripción en businesses ─────────────────────────────────
alter table businesses
  add column if not exists stripe_customer_id       text,
  add column if not exists stripe_subscription_id   text,
  -- trialing | active | past_due | canceled | none
  add column if not exists plan_status              text default 'trialing',
  -- Fin de la prueba gratis. Default: 15 días desde el alta (se evalúa al insertar).
  add column if not exists trial_ends_at            timestamptz default (now() + interval '15 days'),
  -- Fin del periodo pagado en curso = fecha del próximo cobro.
  add column if not exists current_period_end       timestamptz,
  -- Precio mensual del plan en la moneda base (MXN). Configurable por si cambia.
  add column if not exists plan_amount              numeric default 300,
  -- El dueño canceló pero sigue activo hasta terminar el periodo pagado.
  add column if not exists plan_cancel_at_period_end boolean default false;

-- Negocios que ya existían arrancan su prueba desde su fecha de alta.
update businesses
   set trial_ends_at = created_at + interval '15 days'
 where trial_ends_at is null;

update businesses
   set plan_status = 'trialing'
 where plan_status is null;

-- ── Facturas (espejo de las invoices de Stripe) ───────────────────────────
-- Una fila por factura mensual generada por Stripe para la suscripción de un
-- negocio. El webhook la inserta/actualiza en cada evento invoice.*.
create table if not exists invoices (
  id                   text primary key,           -- id de la invoice en Stripe
  biz_id               text references businesses(id) on delete cascade,
  stripe_subscription_id text,
  amount               numeric not null default 0, -- monto de la factura (MXN)
  currency             text default 'mxn',
  -- draft | open | paid | uncollectible | void
  status               text default 'open',
  period_start         timestamptz,
  period_end           timestamptz,
  due_date             timestamptz,
  paid_at              timestamptz,
  hosted_invoice_url   text,
  created_at           timestamptz default now()
);

create index if not exists invoices_biz_idx on invoices (biz_id);
create index if not exists invoices_status_idx on invoices (status);

-- RLS: el dueño puede ver las facturas de su propio negocio. El super admin y el
-- webhook usan la service role, que ignora RLS.
alter table invoices enable row level security;
create policy "Owners see their invoices" on invoices
  for select using (
    exists (
      select 1 from biz_members m
      where m.biz_id = invoices.biz_id and m.user_id = auth.uid()
    )
  );
