-- Tickets de soporte reales. Hasta ahora el panel /admin → Soporte usaba datos
-- demo hardcodeados (TICKETS_INIT en la UI). Esta tabla los respalda de verdad:
-- los usuarios de la app (/app) abren tickets y el super-admin los lee, cambia
-- el estado y responde. El hilo de mensajes vive en `thread` (jsonb) para no
-- necesitar una tabla aparte por ahora.

-- Código legible incremental (SOP-001, SOP-002, …) para mostrar en el panel.
create sequence if not exists support_tickets_seq;

create table if not exists support_tickets (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique default ('SOP-' || lpad(nextval('support_tickets_seq')::text, 3, '0')),
  user_id    uuid references auth.users(id) on delete set null,
  user_name  text,                              -- snapshot del nombre (por si no hay perfil)
  email      text,
  phone      text,
  city       text,
  mode       text,                              -- explorer | vecino
  lang       text,
  issue      text not null,                     -- resumen del problema
  status     text not null default 'nuevo',      -- nuevo | en_progreso | resuelto
  thread     jsonb not null default '[]'::jsonb, -- [{ from: 'user'|'agent', txt, time }]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists support_tickets_status_idx on support_tickets (status);
create index if not exists support_tickets_created_idx on support_tickets (created_at desc);

alter table support_tickets enable row level security;

-- Los usuarios abren y leen sus propios tickets; el admin (service role) bypassa RLS.
drop policy if exists "Users open own tickets" on support_tickets;
create policy "Users open own tickets" on support_tickets
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users read own tickets" on support_tickets;
create policy "Users read own tickets" on support_tickets
  for select using (auth.uid() = user_id);
