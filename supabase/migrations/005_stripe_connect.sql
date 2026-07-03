-- Stripe Connect (Express) — campos por negocio para el reparto de pagos
-- La plataforma cobra al cliente y transfiere al negocio descontando una comisión.

alter table businesses
  add column if not exists stripe_account_id      text unique,   -- acct_... del negocio conectado
  add column if not exists stripe_charges_enabled  boolean default false, -- puede recibir cobros
  add column if not exists stripe_payouts_enabled  boolean default false, -- puede recibir depósitos a su banco
  add column if not exists stripe_details_submitted boolean default false; -- terminó el onboarding

create index if not exists businesses_stripe_account_idx on businesses (stripe_account_id);
