-- 046 — El resumen conserva el evento aunque el primario sea otro nivel.
--
-- Con varios destacados a la vez (migración 045) el trigger elegía UN primario y
-- ponía featured_event solo si ese primario era el evento. Resultado: al comprar
-- un Premium "Todo el negocio", el Premium pasaba a primario y el evento se
-- perdía en Discover.
--
-- Ahora Discover coloca por nivel (Premium → héroe; Destacado/eventos → franja
-- "Destacados") y un mismo negocio puede aparecer en ambos: el negocio Premium en
-- el héroe y su evento como tarjeta en la franja. Para eso el resumen debe llevar
-- SIEMPRE el evento activo (si hay uno), independientemente del primario. `tier`
-- sigue siendo el mejor nivel (Premium gana) y `featured_service_id` el del
-- primario, como antes.
create or replace function reva_recompute_featured_summary(p_biz text)
returns void
language plpgsql
as $$
declare
  v_primary   featured_items%rowtype;
  v_event     jsonb;
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

  -- Item primario: Premium primero, luego el de vencimiento más lejano.
  select * into v_primary from featured_items fi
    where fi.biz_id = p_biz and fi.status = 'active'
      and (fi.featured_until is null or fi.featured_until > now())
    order by (fi.tier = 'premium') desc, fi.featured_until desc nulls first, fi.created_at desc
    limit 1;

  -- Evento activo (el más reciente), aunque NO sea el primario.
  select fi.event into v_event from featured_items fi
    where fi.biz_id = p_biz and fi.status = 'active' and fi.kind = 'event'
      and (fi.featured_until is null or fi.featured_until > now())
    order by fi.created_at desc
    limit 1;

  select bool_or(fi.featured_until is null), max(fi.featured_until)
    into v_has_perma, v_max_until
    from featured_items fi
    where fi.biz_id = p_biz and fi.status = 'active'
      and (fi.featured_until is null or fi.featured_until > now());

  update businesses
    set featured = true,
        tier = coalesce(v_primary.tier, 'destacado'),
        featured_until = case when v_has_perma then null else v_max_until end,
        featured_service_id = case when v_primary.kind = 'service' then nullif(v_primary.service_id, '')::uuid else null end,
        featured_event = v_event
    where id = p_biz;
end;
$$;

-- Reaplica el resumen a los negocios con destacados activos (para que tomen el
-- evento aunque el primario sea otro).
do $$
declare r record;
begin
  for r in select distinct biz_id from featured_items where status = 'active' loop
    perform reva_recompute_featured_summary(r.biz_id);
  end loop;
end $$;
