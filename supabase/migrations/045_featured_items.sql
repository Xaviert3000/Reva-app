-- 045 — Varios Destacados simultáneos por negocio.
--
-- Hasta ahora un negocio solo podía tener UN destacado activo: el estado vivía
-- en columnas únicas de `businesses` (featured, tier, featured_until,
-- featured_service_id, featured_event) y cada compra sobreescribía la anterior
-- (webhook "excluyente"). Esta tabla permite que un negocio contrate varios a la
-- vez — p. ej. Premium para todo el negocio + un evento + un producto — cada uno
-- con su propio nivel y vencimiento.
--
-- COMPATIBILIDAD: las columnas de resumen en `businesses` se conservan y se
-- mantienen en sync por un trigger (reva_recompute_featured_summary), que elige
-- el destacado "primario" (Premium primero, luego el de vencimiento más lejano)
-- para que Discover (business-data.ts) y las apps nativas sigan funcionando sin
-- cambios. Mostrar varias tarjetas en Discover es un paso posterior.

create table if not exists featured_items (
  id                 uuid primary key default gen_random_uuid(),
  biz_id             text not null references businesses(id) on delete cascade,
  kind               text not null check (kind in ('event', 'service', 'business')),
  tier               text not null default 'destacado' check (tier in ('premium', 'destacado')),
  featured_until     timestamptz,                 -- null = sin expiración
  service_id         text,                        -- para kind='service'
  event              jsonb,                       -- para kind='event'
  stripe_session_id  text unique,                 -- idempotencia con el webhook
  status             text not null default 'pending' check (status in ('pending', 'active', 'paused')),
  created_at         timestamptz not null default now()
);

create index if not exists idx_featured_items_biz on featured_items (biz_id, status);

-- RLS: los miembros del negocio pueden ver y gestionar (pausar) sus destacados.
-- Los INSERT los hace el servidor (webhook/checkout con service role, que bypassa
-- RLS), así que la política cubre principalmente select/update/delete del dueño.
alter table featured_items enable row level security;

drop policy if exists featured_items_member_all on featured_items;
create policy featured_items_member_all on featured_items
  for all
  using (exists (select 1 from biz_members m where m.biz_id = featured_items.biz_id and m.user_id = auth.uid()))
  with check (exists (select 1 from biz_members m where m.biz_id = featured_items.biz_id and m.user_id = auth.uid()));

-- Recompone las columnas de resumen de `businesses` a partir de los destacados
-- activos y vigentes del negocio. Mantiene coherencia con el constraint
-- businesses_tier_requires_featured (tier null ⇔ featured false).
create or replace function reva_recompute_featured_summary(p_biz text)
returns void
language plpgsql
as $$
declare
  v_primary   featured_items%rowtype;
  v_max_until timestamptz;
  v_has_perma boolean;
  v_any       boolean;
begin
  select exists (
    select 1 from featured_items fi
    where fi.biz_id = p_biz and fi.status = 'active'
      and (fi.featured_until is null or fi.featured_until > now())
  ) into v_any;

  if not v_any then
    update businesses
      set featured = false, tier = null, featured_until = null,
          featured_service_id = null, featured_event = null
      where id = p_biz;
    return;
  end if;

  -- Item primario: Premium primero, luego el de vencimiento más lejano
  -- (null = permanente, se trata como el más lejano), luego el más reciente.
  select * into v_primary from featured_items fi
    where fi.biz_id = p_biz and fi.status = 'active'
      and (fi.featured_until is null or fi.featured_until > now())
    order by (fi.tier = 'premium') desc, fi.featured_until desc nulls first, fi.created_at desc
    limit 1;

  -- Vencimiento del badge = el más lejano entre los activos. Si algún activo no
  -- tiene expiración, el resumen queda sin expiración (null).
  select bool_or(fi.featured_until is null), max(fi.featured_until)
    into v_has_perma, v_max_until
    from featured_items fi
    where fi.biz_id = p_biz and fi.status = 'active'
      and (fi.featured_until is null or fi.featured_until > now());

  update businesses
    set featured = true,
        tier = coalesce(v_primary.tier, 'destacado'),
        featured_until = case when v_has_perma then null else v_max_until end,
        -- businesses.featured_service_id es uuid; featured_items.service_id es text.
        featured_service_id = case when v_primary.kind = 'service' then nullif(v_primary.service_id, '')::uuid else null end,
        featured_event = case when v_primary.kind = 'event' then v_primary.event else null end
    where id = p_biz;
end;
$$;

create or replace function reva_featured_items_sync()
returns trigger
language plpgsql
as $$
begin
  perform reva_recompute_featured_summary(coalesce(new.biz_id, old.biz_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_featured_items_sync on featured_items;
create trigger trg_featured_items_sync
  after insert or update or delete on featured_items
  for each row execute function reva_featured_items_sync();

-- Backfill: si un negocio ya tenía un destacado activo en las columnas viejas y
-- no tiene filas en featured_items, crea la fila equivalente para no perderlo.
insert into featured_items (biz_id, kind, tier, featured_until, service_id, event, status)
select b.id,
       case when b.featured_event is not null then 'event'
            when b.featured_service_id is not null then 'service'
            else 'business' end,
       coalesce(b.tier, 'destacado'),
       b.featured_until,
       b.featured_service_id::text,
       b.featured_event,
       'active'
from businesses b
where b.featured is true
  and (b.featured_until is null or b.featured_until > now())
  and not exists (select 1 from featured_items fi where fi.biz_id = b.id);
