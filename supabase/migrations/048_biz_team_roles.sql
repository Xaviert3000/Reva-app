-- Sistema de empleados del negocio (roles + permisos por módulo).
--
-- Hasta ahora el panel "Empleados" de /biz era una maqueta: las invitaciones
-- vivían solo en el estado de la UI (se perdían al recargar, sin correo, sin
-- acceso real) y `biz_members.role` solo tenía 'owner'. Esta migración lo
-- respalda de verdad, calcando el patrón del equipo Reva (admin_team, 025).
--
-- Roles: owner | admin | encargado | caja | repartidor.
--  - owner/admin ven todo (bypass de permisos).
--  - encargado/caja ven solo los submódulos de `permissions.modules`.
--  - repartidor NO entra al panel del negocio: usa el panel /courier.

-- Permisos por empleado: lista blanca de submódulos (vistas) a los que entra.
-- NULL = usar el default del rol (ver src/lib/biz-roles.ts). owner/admin lo ignoran.
alter table biz_members
  add column if not exists permissions jsonb;

-- Invitaciones de empleados (pendientes). Al aceptar (con token) se crea la
-- cuenta y la fila en biz_members; la invitación pasa a 'activo'.
create table if not exists biz_invites (
  id          uuid primary key default gen_random_uuid(),
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  biz_id      text not null references businesses(id) on delete cascade,
  email       text not null,
  role        text not null default 'caja',       -- admin | encargado | caja | repartidor
  permissions jsonb,                                -- lista blanca de submódulos (null = default del rol)
  status      text not null default 'invitado',    -- invitado | activo
  invited_by  text,                                 -- correo de quien invitó
  created_at  timestamptz default now(),
  expires_at  timestamptz default now() + interval '7 days',
  -- Un correo, una invitación viva por negocio (permite reinvitar tras aceptar).
  unique (biz_id, email)
);

create index if not exists biz_invites_biz_idx on biz_invites (biz_id);
create index if not exists biz_invites_email_idx on biz_invites (email);

-- Solo el service role (server-side, tras verificar que quien invita es
-- dueño/admin del negocio) lee/escribe. RLS on, sin policies públicas ⇒ el
-- navegador no puede tocar la tabla directamente.
alter table biz_invites enable row level security;
