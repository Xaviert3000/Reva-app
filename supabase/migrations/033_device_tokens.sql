-- Tokens de dispositivo para push notifications (APNs iOS / FCM Android).
-- La app nativa registra su token aquí al iniciar sesión; el backend los usa
-- para enviar avisos de pedido ("listo" / "en camino") vía APNs/FCM.
create table if not exists device_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  token       text not null unique,
  platform    text not null default 'ios',   -- ios | android
  updated_at  timestamptz default now(),
  created_at  timestamptz default now()
);

create index if not exists device_tokens_user_idx on device_tokens (user_id);

alter table device_tokens enable row level security;

-- El usuario administra solo sus propios tokens (upsert por token).
drop policy if exists "Users manage own device tokens" on device_tokens;
create policy "Users manage own device tokens" on device_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
