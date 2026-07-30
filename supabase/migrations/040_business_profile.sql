-- 040 — Perfil del negocio: descripción y logo/foto.
-- El formulario "Perfil del negocio" en Ajustes captura nombre, descripción y una
-- foto/logo, pero sólo `name`/`full_name` existían como columna: la descripción y la
-- imagen no tenían dónde guardarse (por eso "no se guardaban los cambios").
--
-- `description` = texto libre del negocio. `logo_url` = URL pública de la foto/logo
-- (Supabase Storage, bucket service-images). Ambas opcionales / NULL.
alter table businesses add column if not exists description text;
alter table businesses add column if not exists logo_url text;
