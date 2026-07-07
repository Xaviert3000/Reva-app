-- Cola de moderación real (follow-up). Recibe contenido que el super-admin
-- revisa: negocios nuevos (al terminar onboarding) y promociones creadas.
-- Los miembros insertan lo de su negocio; solo el admin (service role) lee/actúa.

create table if not exists moderation_queue (
  id         uuid primary key default gen_random_uuid(),
  biz_id     text references businesses(id) on delete cascade,
  biz_name   text,
  mono       char(1),
  grad_from  text,
  grad_to    text,
  tipo       text not null,                         -- Negocio | Servicio | Promoción
  nivel      text,                                  -- Premium | Destacado | null
  que        text,                                  -- qué se revisa
  status     text not null default 'pending',       -- pending | approved | rejected
  created_at timestamptz default now()
);
create index if not exists moderation_queue_status_idx on moderation_queue (status);

alter table moderation_queue enable row level security;

drop policy if exists "Members submit moderation" on moderation_queue;
create policy "Members submit moderation" on moderation_queue
  for insert with check (public.is_biz_member(biz_id));
