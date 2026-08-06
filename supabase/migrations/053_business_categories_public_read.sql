-- Las categorías de negocio (business_categories) solo alimentaban el desplegable
-- de "Agregar negocio" en el super admin; el filtro de Explorar en la app y la web
-- usaba una lista fija de 5 categorías legacy, desconectada de esta tabla. Para que
-- Explorar refleje las categorías reales que administra el super admin, la app
-- (cliente, con anon key) y la web necesitan LEER la tabla.
--
-- La escritura sigue siendo solo del super admin vía las API routes con service
-- role (bypassa RLS); no agregamos política de escritura, así que anon no puede
-- insertar/borrar. Solo abrimos lectura pública, igual que platform_config.
drop policy if exists "Anyone can read business categories" on business_categories;
create policy "Anyone can read business categories"
  on business_categories for select using (true);
