-- Categorías de negocio editables por el super admin
-- (/admin → Ajustes → Categorías de negocio). Aparecen al dar de alta un negocio
-- (Negocios → Agregar negocio). Antes vivían solo en el estado de la UI: al
-- recargar volvían a los valores por defecto y no se compartían entre admins.
--
-- Ahora se persisten como filas reales. La escritura se hace desde las API routes
-- del admin con el service role (bypassa RLS). No exponemos acceso público.

create table if not exists business_categories (
  id         bigint generated always as identity primary key,
  label      text        not null,
  emoji      text        not null default '🏷️',
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

-- Sin duplicados por nombre (case-insensitive).
create unique index if not exists business_categories_label_key
  on business_categories (lower(label));

-- Seed inicial (solo si la tabla está vacía) — mismos valores que el arranque
-- original de la UI.
insert into business_categories (label, emoji, sort_order)
select * from (values
  ('Restaurantes',        '🍽️', 0),
  ('Bar / Vida nocturna', '🍸', 1),
  ('Spa & Bienestar',     '💆', 2),
  ('Médico / Clínica',    '🏥', 3),
  ('Dentista',            '🦷', 4),
  ('Despacho legal',      '⚖️', 5),
  ('Inmobiliaria',        '🏠', 6),
  ('Salón / Barbería',    '✂️', 7),
  ('Tours & Experiencias','🚣', 8),
  ('Gimnasio / Estudio',  '💪', 9)
) as seed(label, emoji, sort_order)
where not exists (select 1 from business_categories);

alter table business_categories enable row level security;
