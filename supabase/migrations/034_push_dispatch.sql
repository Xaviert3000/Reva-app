-- Envío de push server-side: al insertarse una notificación (el trigger de la
-- migración 030 lo hace cuando un pedido pasa a `ready` / `out_for_delivery`),
-- llamamos a la ruta `/api/push/send` en Vercel, que lee `device_tokens` y
-- notifica por APNs (iOS) y FCM (Android).
--
-- Usa la extensión `pg_net` (disponible en Supabase). El endpoint y el secreto
-- se leen de settings de la base para no hardcodear el dominio aquí:
--
--   alter database postgres set app.push_endpoint = 'https://TU-DOMINIO/api/push/send';
--   alter database postgres set app.push_secret   = 'UN-SECRETO-LARGO';
--
-- (Corre esos ALTER una vez en el SQL Editor de Supabase; deben coincidir con
-- PUSH_WEBHOOK_SECRET en Vercel.) Si `app.push_endpoint` no está configurado, el
-- trigger no hace nada — así no rompe entornos sin push.

create extension if not exists pg_net;

create or replace function public.push_notification_dispatch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  endpoint text := current_setting('app.push_endpoint', true);
  secret   text := current_setting('app.push_secret', true);
begin
  if endpoint is null or endpoint = '' then
    return new;
  end if;

  perform net.http_post(
    url     := endpoint,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-push-secret', coalesce(secret, '')
               ),
    body    := jsonb_build_object(
                 'type', 'INSERT',
                 'table', 'notifications',
                 'record', to_jsonb(new)
               )
  );
  return new;
end;
$$;

drop trigger if exists notifications_push_dispatch on notifications;
create trigger notifications_push_dispatch
  after insert on notifications
  for each row execute function public.push_notification_dispatch();
