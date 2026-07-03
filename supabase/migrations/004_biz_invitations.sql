-- Business invitations sent from super-admin panel

create table if not exists biz_invitations (
  id          uuid primary key default gen_random_uuid(),
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  biz_name    text not null,
  email       text not null,
  cat         text,
  estado      text,
  municipio   text,
  plan        text default 'Arranca',
  status      text default 'pending',  -- pending | accepted | expired
  invited_by  text,                    -- email del super admin que invitó
  created_at  timestamptz default now(),
  expires_at  timestamptz default now() + interval '7 days'
);

-- Index for token lookups (registration flow)
create index if not exists biz_invitations_token_idx on biz_invitations (token);
create index if not exists biz_invitations_email_idx on biz_invitations (email);

-- Only service role can read/write invitations
alter table biz_invitations enable row level security;
