-- Fase 1 — Semilla de Los Cabos (generado desde lib/data.ts).
-- Inserta los 9 negocios demo como filas reales + servicios, reseñas y
-- alertas. Idempotente (on conflict do nothing). Ids conservados.

insert into businesses (id, name, full_name, type, kind, hood, municipio, estado, hours, capacity, rating, local_fav, featured, tier, grad_from, grad_to, mono, onboarded) values
  ('lupita', 'La Lupita Taco & Mezcal', 'La Lupita Taco & Mezcal', 'Mexicana · Tacos', 'Comer', 'San José del Cabo', 'Los Cabos', 'Baja California Sur', '13:00 – 23:00', 50, 4.8, true, false, null, '#E27A52', '#B5472F', 'L', true),
  ('huerta', 'Huerta del Mar', 'Huerta del Mar', 'Farm-to-table · $$$', 'Comer', 'Ánimas Bajas', 'Los Cabos', 'Baja California Sur', '18:00 – 22:30', 50, 4.9, true, true, 'premium', '#7FA36B', '#3F6B49', 'H', true),
  ('sereno', 'Sereno Spa & Temazcal', 'Sereno Spa & Temazcal', 'Bienestar · Masaje', 'Spa', 'Corredor Turístico', 'Los Cabos', 'Baja California Sur', '09:00 – 20:00', 50, 4.9, false, false, null, '#C9A2B4', '#6E4A63', 'S', true),
  ('azul', 'Cabo Azul Sunset Sail', 'Cabo Azul Sunset Sail', 'Catamarán · 2.5 h', 'Tours', 'Marina Cabo San Lucas', 'Los Cabos', 'Baja California Sur', 'Zarpa 17:30', 50, 4.7, false, true, 'destacado', '#E9A24A', '#C25C3C', 'A', true),
  ('comal', 'Comal Costero', 'Comal Costero', 'Mariscos · Playa', 'Comer', 'Playa El Médano', 'Los Cabos', 'Baja California Sur', '12:00 – 21:00', 50, 4.6, true, false, null, '#5FA6B0', '#2E6E78', 'C', true),
  ('mirador', 'Mirador Mezcalería', 'Mirador Mezcalería', 'Bar · Rooftop', 'Vida nocturna', 'Centro, San José', 'Los Cabos', 'Baja California Sur', '18:00 – 01:00', 50, 4.7, true, false, null, '#8B6CB0', '#4A3370', 'M', true),
  ('aqua', 'Aqua Wellness', 'Aqua Wellness', 'Bienestar · Masaje', 'Spa', 'Corredor Turístico', 'Los Cabos', 'Baja California Sur', '10:00 – 21:00', 50, 4.7, false, false, null, '#5FA6B0', '#2E6E78', 'A', true),
  ('jade', 'Jade Spa Cabo', 'Jade Spa Cabo', 'Bienestar · Masaje', 'Spa', 'Cabo San Lucas', 'Los Cabos', 'Baja California Sur', '09:00 – 19:00', 50, 4.6, true, false, null, '#7FA36B', '#3F6B49', 'J', true),
  ('origen', 'Origen Holístico', 'Origen Holístico', 'Bienestar · Holístico', 'Spa', 'San José del Cabo', 'Los Cabos', 'Baja California Sur', '08:00 – 20:00', 50, 4.8, false, false, null, '#C9A2B4', '#6E4A63', 'O', true)
on conflict (id) do nothing;

delete from services where biz_id in ('lupita', 'huerta', 'sereno', 'azul', 'comal', 'mirador', 'aqua', 'jade', 'origen');
insert into services (biz_id, name, description, price, duration_min, stock, scheduled, active) values
  ('lupita', 'Mesa estándar', '2–4 personas · Salón', null, null, null, true, true),
  ('lupita', 'Mesa terraza', '2–6 personas · Vista', 200, null, null, true, true),
  ('lupita', 'Mezcal flight', 'Cata · 5 mezcales', 450, null, 8, false, true),
  ('lupita', 'Orden de tacos al pastor', 'Al carbón · 4 tacos', 180, null, null, false, true),
  ('lupita', 'Aguachile', 'Camarón · al gusto', 220, null, null, false, true),
  ('lupita', 'Tres leches', 'Postre de la casa', 120, null, null, false, true),
  ('lupita', 'Evento privado', 'Hasta 20 · Salón completo', null, null, 3, false, true),
  ('sereno', 'Masaje 80 min', 'Vista al mar', 2400, 80, null, true, true),
  ('sereno', 'Temazcal', 'Ceremonia · 90 min', 1800, 90, null, true, true),
  ('sereno', 'Masaje en pareja', 'Cabaña doble', 4600, 80, null, true, true),
  ('sereno', 'Ritual día completo', '4 servicios', 7900, 240, 2, true, true),
  ('huerta', 'Menú degustación', '7 tiempos · de la granja', 1950, 120, null, true, true),
  ('huerta', 'Mesa en el huerto', 'Al atardecer · 2–4', 200, null, null, true, true),
  ('huerta', 'Maridaje vino natural', '5 copas', 850, null, null, false, true),
  ('huerta', 'Cena privada', 'Hasta 10 personas', null, null, null, false, true),
  ('azul', 'Velero al atardecer', 'Grupo chico · 2.5 h', 1650, null, null, true, true),
  ('azul', 'Asiento premium', 'Zona delantera + barra', 2200, null, null, true, true),
  ('azul', 'Charter privado', 'Hasta 12 · barco completo', null, null, null, false, true),
  ('comal', 'Aguachile de camarón', 'Del día', 280, null, null, false, true),
  ('comal', 'Ceviche del día', 'Pescado fresco', 240, null, null, false, true),
  ('comal', 'Mesa en la playa', 'Pies en la arena', null, null, null, true, true),
  ('comal', 'Michelada', 'Clásica o clamato', 120, null, null, false, true),
  ('mirador', 'Mesa terraza', 'Azotea · vista', null, null, null, true, true),
  ('mirador', 'Flight de mezcal', 'Cata · 5 mezcales', 420, null, null, false, true),
  ('mirador', 'Reservado para grupo', '6–12 personas', 300, null, null, true, true),
  ('mirador', 'Servicio de botella', 'Mezcal o destilado', null, null, null, false, true),
  ('aqua', 'Masaje de tejido profundo', '60 min', 1900, 60, null, true, true),
  ('aqua', 'Masaje relajante', '90 min', 2300, 90, null, true, true),
  ('aqua', 'Circuito de hidroterapia', '120 min', 1200, 120, null, true, true),
  ('jade', 'Masaje sueco', '60 min', 1100, 60, null, true, true),
  ('jade', 'Masaje en pareja', '60 min · 2 personas', 2000, 60, null, true, true),
  ('jade', 'Reflexología', '45 min', 800, 45, null, true, true),
  ('origen', 'Masaje holístico', '80 min', 2200, 80, null, true, true),
  ('origen', 'Ritual maya', '120 min', 3400, 120, null, true, true),
  ('origen', 'Baño de sonido', '60 min', 950, 60, null, true, true);

delete from reviews where user_id is null and biz_id in ('lupita', 'huerta', 'sereno', 'azul', 'comal', 'mirador', 'aqua', 'jade', 'origen');
insert into reviews (biz_id, user_id, rating, body, author, lang, is_local) values
  ('lupita', null, 5, 'El pastor y el mezcal de la casa, sin falla.', 'Mariana, vecina', 'es', true),
  ('lupita', null, 5, 'Skip the marina spots, come here.', 'Local since ''09', 'en', true),
  ('huerta', null, 5, 'Pide la mesa del huerto al atardecer.', 'Daniela, vecina', 'es', true),
  ('huerta', null, 5, 'Worth the drive, book ahead.', 'Ricardo P.', 'en', false),
  ('sereno', null, 5, 'El temazcal con luna llena es otra cosa.', 'Ana, vecina', 'es', true),
  ('sereno', null, 5, 'Best massage of the whole trip.', 'Jess M.', 'en', false),
  ('azul', null, 5, 'The arch at sunset — unreal.', 'Tom & Lia', 'en', false),
  ('azul', null, 5, 'Grupo chico, nada turistero.', 'Sofía, vecina', 'es', true),
  ('comal', null, 5, 'El aguachile de camarón, siempre.', 'Beto, vecino', 'es', true),
  ('comal', null, 5, 'Lunch with toes in the sand. Yes.', 'Karen H.', 'en', false),
  ('mirador', null, 5, 'Happy hour 6–8, terraza increíble.', 'Pau, vecina', 'es', true),
  ('mirador', null, 5, 'Found my new favorite bar.', 'Marcus', 'en', false),
  ('aqua', null, 5, 'El masaje deportivo me dejó nueva.', 'Renata, vecina', 'es', true),
  ('aqua', null, 5, 'The hydro circuit alone is worth it.', 'Greg P.', 'en', false),
  ('jade', null, 5, 'Calidad-precio inmejorable, voy cada mes.', 'Lalo, vecino', 'es', true),
  ('jade', null, 5, 'Hidden gem, way better than the resort spa.', 'Amy R.', 'en', false),
  ('origen', null, 5, 'El baño de sonido es otro nivel.', 'Diana, vecina', 'es', true),
  ('origen', null, 5, 'Most unique spa day I have had anywhere.', 'Owen T.', 'en', false);

delete from promotions where kind = 'alerta' and biz_id in ('lupita', 'huerta', 'sereno', 'azul', 'comal', 'mirador', 'aqua', 'jade', 'origen');
insert into promotions (biz_id, kind, alert_type, title, body, cta, start_time, end_time, days, active) values
  ('mirador', 'alerta', 'happy_hour', 'Es happy hour a 2 min de ti — Mirador Mezcalería', 'Terraza de azotea, 6–8pm. ¿Te aparto antes de que se llene?', 'Échale un ojo', '00:00', '23:59', null, true);
