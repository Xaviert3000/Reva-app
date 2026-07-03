-- Configuración global de la plataforma: motor de IA (modelo + respaldos),
-- prompts editables y toggles de funciones. La edita el super admin (/admin →
-- Integraciones → OpenRouter) y la consumen las rutas /api/* server-side.
-- Singleton: una sola fila (id = 1). SIN secretos: las API keys viven en env.

create table if not exists platform_config (
  id              integer primary key default 1,
  model           text,
  fallback_models text[] default '{}',
  prompts         jsonb default '{}'::jsonb,
  options         jsonb default '{}'::jsonb,
  updated_at      timestamptz default now(),
  constraint platform_config_singleton check (id = 1)
);

-- Fila única inicial.
insert into platform_config (id) values (1) on conflict (id) do nothing;

-- Lectura pública (no hay secretos aquí). La escritura se hace solo desde las API
-- routes del admin usando el service role, que bypassa RLS.
alter table platform_config enable row level security;
drop policy if exists "Anyone can read platform config" on platform_config;
create policy "Anyone can read platform config" on platform_config for select using (true);
