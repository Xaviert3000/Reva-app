-- Fase 0 — Fundaciones para migrar toda la plataforma a datos reales.
-- Añade el RLS que faltaba para que el dueño lea/gestione lo de su negocio,
-- columnas de negocio que la app ya espera, la tabla de promociones/alertas,
-- RLS de reseñas y las tablas reales de Rove (hoy en memoria).

-- ─────────────────────────────────────────────────────────────
-- Helper: ¿el usuario con sesión es miembro de este negocio?
-- SECURITY DEFINER + search_path fijo para poder usarlo en políticas RLS
-- sin recursión ni fugas de esquema.
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_biz_member(p_biz_id text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.biz_members m
    where m.biz_id = p_biz_id and m.user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Reservas: el dueño debe poder VER y GESTIONAR las de su negocio.
-- Las políticas del huésped (ver/crear las propias) ya existen (001).
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Businesses see their reservations" on reservations;
create policy "Businesses see their reservations" on reservations
  for select using (public.is_biz_member(biz_id));

drop policy if exists "Businesses update their reservations" on reservations;
create policy "Businesses update their reservations" on reservations
  for update using (public.is_biz_member(biz_id));

-- ─────────────────────────────────────────────────────────────
-- Mensajes: el dueño ve y responde los de su negocio (además de las
-- políticas del huésped ya existentes en 001).
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Businesses see their messages" on messages;
create policy "Businesses see their messages" on messages
  for select using (public.is_biz_member(biz_id));

drop policy if exists "Businesses send their messages" on messages;
create policy "Businesses send their messages" on messages
  for insert with check (public.is_biz_member(biz_id));

-- ─────────────────────────────────────────────────────────────
-- Reseñas: lectura pública, alta por el propio autor.
-- ─────────────────────────────────────────────────────────────
alter table reviews enable row level security;

drop policy if exists "Public reads reviews" on reviews;
create policy "Public reads reviews" on reviews
  for select using (true);

drop policy if exists "Users create own reviews" on reviews;
create policy "Users create own reviews" on reviews
  for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Columnas de negocio que la app ya espera / persistirá:
--  - rfc/address/phone: datos fiscales del ticket (los lee biz-session.ts).
--  - agent_config: config del Agente IA (reemplaza el localStorage).
--  - tax_mode: manejo de IVA en el punto de venta ('added' | 'included').
-- ─────────────────────────────────────────────────────────────
alter table businesses add column if not exists rfc          text;
alter table businesses add column if not exists address      text;
alter table businesses add column if not exists phone        text;
alter table businesses add column if not exists agent_config jsonb;
alter table businesses add column if not exists tax_mode     text default 'added';

-- services.scheduled: false = producto/cotización sin calendario (no genera
-- horarios de reserva). La app cliente lo usa vía isScheduled().
alter table services add column if not exists scheduled boolean default true;

-- reviews.author/lang: preservan el nombre mostrado y el idioma de la reseña
-- (la app cliente pinta {who, txt, es}).
alter table reviews add column if not exists author text;
alter table reviews add column if not exists lang   text default 'es';

-- ─────────────────────────────────────────────────────────────
-- Promociones y alertas proactivas.
--  kind='oferta'  → promoción del negocio (panel Promociones).
--  kind='alerta'  → alerta en vivo que la app cliente muestra en la ficha
--                   (happy hour, últimos lugares, evento…) con ventana horaria.
-- ─────────────────────────────────────────────────────────────
create table if not exists promotions (
  id          uuid primary key default gen_random_uuid(),
  biz_id      text references businesses(id) on delete cascade,
  kind        text not null default 'oferta',   -- oferta | alerta
  alert_type  text,                              -- happy_hour | evento | promo | ultimos_lugares
  title       text not null,
  body        text,
  cta         text,
  discount    text,                              -- ej. '15%' / '2x1' (texto libre)
  start_time  text,                              -- 'HH:MM' (para alertas con ventana)
  end_time    text,                              -- 'HH:MM'
  days        integer[],                         -- 0=Dom..6=Sáb ; NULL = todos los días
  active      boolean default true,
  created_at  timestamptz default now()
);
create index if not exists promotions_biz_idx on promotions (biz_id);

alter table promotions enable row level security;

drop policy if exists "Public reads active promotions" on promotions;
create policy "Public reads active promotions" on promotions
  for select using (active = true or public.is_biz_member(biz_id));

drop policy if exists "Biz members manage promotions" on promotions;
create policy "Biz members manage promotions" on promotions
  for all using (public.is_biz_member(biz_id)) with check (public.is_biz_member(biz_id));

-- ─────────────────────────────────────────────────────────────
-- Rove: recompensas, saldo (ledger), canjes y referidos — reales.
-- ─────────────────────────────────────────────────────────────

-- Ledger de tickets: el saldo es la suma de deltas del usuario.
create table if not exists rove_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  delta       integer not null,          -- + gana, - gasta
  reason      text,                       -- reserva | reseña | referido | canje | ajuste
  ref_id      text,
  created_at  timestamptz default now()
);
create index if not exists rove_tickets_user_idx on rove_tickets (user_id);

-- Catálogo de recompensas (marketplace). biz_id NULL = recompensa de plataforma.
create table if not exists rove_rewards (
  id           uuid primary key default gen_random_uuid(),
  biz_id       text references businesses(id) on delete cascade,
  title        text not null,
  description  text,
  cost         integer not null default 0,     -- tickets requeridos
  category     text,
  status       text not null default 'pending', -- pending | active | paused | rejected
  reject_reason text,
  created_at   timestamptz default now()
);
create index if not exists rove_rewards_status_idx on rove_rewards (status);

-- Canjes realizados por usuarios.
create table if not exists rove_redemptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  reward_id   uuid references rove_rewards(id) on delete set null,
  biz_id      text references businesses(id) on delete set null,
  code        text unique not null,
  status      text not null default 'pending',  -- pending | used | expired
  cost        integer,
  created_at  timestamptz default now(),
  expires_at  timestamptz,
  used_at     timestamptz
);
create index if not exists rove_redemptions_user_idx on rove_redemptions (user_id);

-- Referidos.
create table if not exists rove_referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid references auth.users(id) on delete cascade,
  referred_id  uuid references auth.users(id) on delete set null,
  code         text,
  status       text not null default 'pending',  -- pending | completed
  created_at   timestamptz default now(),
  completed_at timestamptz
);
create index if not exists rove_referrals_referrer_idx on rove_referrals (referrer_id);

alter table rove_tickets     enable row level security;
alter table rove_rewards     enable row level security;
alter table rove_redemptions enable row level security;
alter table rove_referrals   enable row level security;

-- El usuario ve su propio saldo/canjes/referidos.
drop policy if exists "Users see own tickets" on rove_tickets;
create policy "Users see own tickets" on rove_tickets
  for select using (auth.uid() = user_id);

drop policy if exists "Users see own redemptions" on rove_redemptions;
create policy "Users see own redemptions" on rove_redemptions
  for select using (auth.uid() = user_id);

drop policy if exists "Users see own referrals" on rove_referrals;
create policy "Users see own referrals" on rove_referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- Recompensas activas visibles para todos; los miembros gestionan las suyas.
drop policy if exists "Public reads active rewards" on rove_rewards;
create policy "Public reads active rewards" on rove_rewards
  for select using (status = 'active' or biz_id is null or public.is_biz_member(biz_id));

drop policy if exists "Biz members manage rewards" on rove_rewards;
create policy "Biz members manage rewards" on rove_rewards
  for all using (biz_id is not null and public.is_biz_member(biz_id))
  with check (biz_id is not null and public.is_biz_member(biz_id));

-- Las escrituras de saldo/canjes/validación las hace el servidor con el
-- service-role (rutas /api/rove/*), que salta RLS. No se abren políticas de
-- INSERT/UPDATE a los clientes para no dejar que se auto-otorguen tickets.
