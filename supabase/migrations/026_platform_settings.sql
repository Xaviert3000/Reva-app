-- Ajustes generales de la plataforma editables por el super admin
-- (/admin → Ajustes → Plataforma / Notificaciones / Seguridad). Antes estos
-- valores vivían solo en el estado de la UI y el botón "Guardar cambios" no
-- persistía nada: al recargar volvían a los valores por defecto.
--
-- Se guardan como un blob jsonb en una fila singleton (id = 1) para no tener que
-- migrar el esquema cada vez que se agrega un campo de configuración. SIN
-- secretos: las API keys viven en variables de entorno.

create table if not exists platform_settings (
  id         integer primary key default 1,
  data       jsonb   not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  constraint platform_settings_singleton check (id = 1)
);

-- Fila única inicial.
insert into platform_settings (id) values (1) on conflict (id) do nothing;

-- La escritura se hace solo desde las API routes del admin usando el service
-- role, que bypassa RLS. No exponemos lectura pública (puede contener correos
-- de notificación); el panel la lee vía la ruta server-side.
alter table platform_settings enable row level security;
