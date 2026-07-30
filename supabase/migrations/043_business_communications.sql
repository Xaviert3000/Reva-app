-- Comunicados a los negocios (super-admin → panel del negocio).
--
-- El super administrador escribe un comunicado desde /admin → Comunicados y lo
-- dirige a toda la red o a un segmento (por municipio, categoría, nivel de
-- destacado, o una selección puntual de negocios). Cada negocio lo ve en su
-- panel (/biz → Comunicados) y puede marcarlo como leído; el admin ve cuántos
-- lo recibieron y cuántos lo leyeron.
--
-- Igual que `admin_team`, estas tablas son server-only: RLS activo sin policies
-- públicas ⇒ solo el service role (rutas /api/admin/* y /api/biz/* que ya
-- validan la sesión) las lee/escribe. El navegador nunca las toca directo.

create table if not exists business_communications (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  -- normal | importante | urgente — controla el color/orden en el panel.
  priority     text not null default 'normal'
                 check (priority in ('normal', 'importante', 'urgente')),
  -- A quién va dirigido:
  --   all        → todos los negocios
  --   municipio  → audience_value = nombre del municipio
  --   category   → audience_value = kind del negocio
  --   tier       → audience_value = 'premium' | 'destacado'
  --   specific   → audience_ids = lista de ids de negocio
  audience      text not null default 'all'
                 check (audience in ('all', 'municipio', 'category', 'tier', 'specific')),
  audience_value text,
  audience_ids   text[] not null default '{}',
  sent_by        text,                 -- correo del super-admin que lo envió
  created_at     timestamptz default now()
);

create index if not exists business_communications_created_idx
  on business_communications (created_at desc);

-- Acuse de lectura: un renglón por (comunicado, negocio) que lo abrió/marcó.
create table if not exists business_communication_reads (
  id               uuid primary key default gen_random_uuid(),
  communication_id uuid not null references business_communications(id) on delete cascade,
  biz_id           text not null references businesses(id) on delete cascade,
  read_at          timestamptz default now(),
  unique (communication_id, biz_id)
);

create index if not exists business_communication_reads_comm_idx
  on business_communication_reads (communication_id);
create index if not exists business_communication_reads_biz_idx
  on business_communication_reads (biz_id);

alter table business_communications enable row level security;
alter table business_communication_reads enable row level security;
