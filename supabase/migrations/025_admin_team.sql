-- Equipo Reva (super-admin). Hasta ahora la lista de "Equipo Reva" en
-- /admin → Ajustes era demo hardcodeada en la UI: los invitados se perdían al
-- recargar y no se enviaba ningún correo. Esta tabla la respalda de verdad.
--
-- El Super Admin NO vive aquí: se muestra desde la sesión activa (allowlist
-- ADMIN_EMAILS). Esta tabla guarda a los operadores y analistas que el super
-- admin invita. El correo de invitación se envía vía la edge function
-- `send-team-invite` (Resend), igual que las invitaciones de negocio.

create table if not exists admin_team (
  id          uuid primary key default gen_random_uuid(),
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  email       text not null unique,
  name        text,
  role        text not null default 'operador',  -- operador | analista
  status      text not null default 'invitado',  -- invitado | activo
  invited_by  text,                                -- correo del super-admin que invitó
  created_at  timestamptz default now(),
  expires_at  timestamptz default now() + interval '7 days'
);

create index if not exists admin_team_email_idx on admin_team (email);

-- Solo el service role (super-admin server-side) lee/escribe. RLS on, sin
-- policies públicas ⇒ el navegador no puede tocar la tabla directamente.
alter table admin_team enable row level security;
