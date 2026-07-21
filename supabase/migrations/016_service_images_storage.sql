-- 016 — Almacenamiento de imágenes del catálogo (Supabase Storage).
-- Las imágenes de cada servicio se guardan en el bucket público
-- `service-images`, bajo una carpeta por negocio: `<biz_id>/<archivo>`.
-- La columna `services.image_url` (creada en 003) guarda la URL pública.

-- 1. Bucket público: lectura anónima (lo consume `/app` y el panel), la
--    escritura la restringen las políticas de abajo.
insert into storage.buckets (id, name, public)
values ('service-images', 'service-images', true)
on conflict (id) do nothing;

-- 2. RLS de storage.objects para este bucket.
--    - Lectura pública.
--    - Subir/actualizar/borrar sólo para miembros del negocio dueño de la
--      carpeta (primer segmento de la ruta = biz_id).

drop policy if exists "Public reads service images" on storage.objects;
create policy "Public reads service images" on storage.objects
  for select
  using (bucket_id = 'service-images');

drop policy if exists "Biz members upload service images" on storage.objects;
create policy "Biz members upload service images" on storage.objects
  for insert
  with check (
    bucket_id = 'service-images'
    and exists (
      select 1 from biz_members m
      where m.biz_id = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Biz members update service images" on storage.objects;
create policy "Biz members update service images" on storage.objects
  for update
  using (
    bucket_id = 'service-images'
    and exists (
      select 1 from biz_members m
      where m.biz_id = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Biz members delete service images" on storage.objects;
create policy "Biz members delete service images" on storage.objects
  for delete
  using (
    bucket_id = 'service-images'
    and exists (
      select 1 from biz_members m
      where m.biz_id = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
    )
  );
