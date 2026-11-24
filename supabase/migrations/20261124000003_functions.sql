-- Descontala · Lógica crítica en SQL: códigos, canje, eventos y métricas.

-- ───────────────────────── Rate limiting ─────────────────────────
-- Ventana fija. Devuelve true si la petición está permitida.
create function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = rl.hits + 1
  returning hits into v_hits;

  -- Limpieza oportunista de ventanas viejas.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end $$;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;

-- ───────────────────────── Códigos ─────────────────────────
-- 8 caracteres de un alfabeto de 32 símbolos sin 0/O/1/I → 40 bits de azar criptográfico.
create function public.random_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  bytes bytea := extensions.gen_random_bytes(8);
  result text := '';
begin
  for i in 0..7 loop
    -- 256 es múltiplo de 32 → distribución uniforme.
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end $$;
revoke execute on function public.random_code() from public, anon, authenticated;

create function public.normalize_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

-- Promo vigente = activa y dentro de fechas.
create function public.promotion_is_live(p public.promotions) returns boolean
language sql stable set search_path = '' as $$
  select p.status = 'activa' and p.starts_at <= now() and p.ends_at > now()
$$;

-- Genera (o devuelve) el código activo del usuario para una promo.
create function public.generate_code(p_promotion_id uuid)
returns public.redemption_codes
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_promo public.promotions;
  v_code public.redemption_codes;
  v_redeemed integer;
begin
  if v_uid is null then
    raise exception 'no_autenticado' using errcode = 'P0001';
  end if;

  if not public.check_rate_limit('gen:' || v_uid, 10, 60) then
    raise exception 'demasiados_intentos' using errcode = 'P0001';
  end if;

  select * into v_promo from public.promotions where id = p_promotion_id;
  if not found or not public.promotion_is_live(v_promo) then
    raise exception 'promo_no_vigente' using errcode = 'P0001';
  end if;

  if v_promo.max_redemptions is not null then
    select count(*) into v_redeemed from public.redemption_codes
      where promotion_id = v_promo.id and status = 'redeemed';
    if v_redeemed >= v_promo.max_redemptions then
      raise exception 'limite_alcanzado' using errcode = 'P0001';
    end if;
  end if;

  -- Si ya lo usó, no se genera otro (un canje por persona y promo).
  if exists (select 1 from public.redemption_codes
             where promotion_id = v_promo.id and user_id = v_uid and status = 'redeemed') then
    raise exception 'ya_canjeado' using errcode = 'P0001';
  end if;

  -- Caduca los activos vencidos de este usuario/promo.
  update public.redemption_codes set status = 'expired'
    where promotion_id = v_promo.id and user_id = v_uid and status = 'active' and expires_at <= now();

  select * into v_code from public.redemption_codes
    where promotion_id = v_promo.id and user_id = v_uid and status = 'active';
  if found then
    return v_code;
  end if;

  for attempt in 1..5 loop
    begin
      insert into public.redemption_codes (code, promotion_id, chain_id, user_id, expires_at)
      values (public.random_code(), v_promo.id, v_promo.chain_id, v_uid, v_promo.ends_at)
      returning * into v_code;
      return v_code;
    exception when unique_violation then
      -- Colisión del código o petición concurrente: si ya hay uno activo, se devuelve.
      select * into v_code from public.redemption_codes
        where promotion_id = v_promo.id and user_id = v_uid and status = 'active';
      if found then
        return v_code;
      end if;
    end;
  end loop;

  raise exception 'error_generando_codigo' using errcode = 'P0001';
end $$;
revoke execute on function public.generate_code(uuid) from public, anon;
grant execute on function public.generate_code(uuid) to authenticated;

-- Canje en caja. Todo ocurre en una sola transacción con bloqueo de filas:
-- dos cajas validando el mismo código a la vez → solo una gana.
create function public.redeem_code(p_code text, p_store_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_caller_chain uuid;
  v_store public.stores;
  v_code public.redemption_codes;
  v_promo public.promotions;
  v_redeemed integer;
  v_is_new boolean;
begin
  select role, chain_id into v_role, v_caller_chain from public.profiles where id = v_uid;
  if v_uid is null or v_role is null or v_role not in ('merchant', 'admin') then
    return jsonb_build_object('result', 'no_autorizado');
  end if;

  if not public.check_rate_limit('redeem:' || v_uid, 30, 60) then
    return jsonb_build_object('result', 'demasiados_intentos');
  end if;

  select * into v_store from public.stores where id = p_store_id;
  if not found or (v_role = 'merchant' and v_store.chain_id <> v_caller_chain) then
    return jsonb_build_object('result', 'tienda_invalida');
  end if;
  if v_role = 'admin' then
    v_caller_chain := v_store.chain_id;
  end if;

  select * into v_code from public.redemption_codes
    where code = public.normalize_code(p_code)
    for update;
  if not found then
    return jsonb_build_object('result', 'no_existe');
  end if;

  select * into v_promo from public.promotions where id = v_code.promotion_id for update;

  if v_code.chain_id <> v_caller_chain then
    return jsonb_build_object('result', 'otra_cadena');
  end if;

  if v_code.status = 'redeemed' then
    return jsonb_build_object(
      'result', 'ya_usado',
      'redeemed_at', v_code.redeemed_at,
      'promotion_title', v_promo.title
    );
  end if;

  if v_code.status = 'expired' or v_code.expires_at <= now() or v_promo.ends_at <= now() then
    update public.redemption_codes set status = 'expired' where id = v_code.id and status = 'active';
    return jsonb_build_object('result', 'caducado', 'promotion_title', v_promo.title, 'expires_at', v_code.expires_at);
  end if;

  if not public.promotion_is_live(v_promo) then
    return jsonb_build_object('result', 'promo_no_vigente', 'promotion_title', v_promo.title);
  end if;

  if exists (select 1 from public.promotion_stores ps where ps.promotion_id = v_promo.id)
     and not exists (select 1 from public.promotion_stores ps where ps.promotion_id = v_promo.id and ps.store_id = p_store_id) then
    return jsonb_build_object('result', 'tienda_no_incluida', 'promotion_title', v_promo.title);
  end if;

  if v_promo.max_redemptions is not null then
    select count(*) into v_redeemed from public.redemption_codes
      where promotion_id = v_promo.id and status = 'redeemed';
    if v_redeemed >= v_promo.max_redemptions then
      return jsonb_build_object('result', 'limite_alcanzado', 'promotion_title', v_promo.title);
    end if;
  end if;

  v_is_new := not exists (
    select 1 from public.redemption_codes
    where user_id = v_code.user_id and chain_id = v_code.chain_id and status = 'redeemed'
  );

  update public.redemption_codes
     set status = 'redeemed', redeemed_at = now(), redeemed_store_id = p_store_id, redeemed_by = v_uid
   where id = v_code.id;

  return jsonb_build_object(
    'result', 'ok',
    'promotion_title', v_promo.title,
    'promotion_type', v_promo.type,
    'promotion_value', v_promo.value,
    'conditions', v_promo.conditions,
    'is_new_customer', v_is_new
  );
end $$;
revoke execute on function public.redeem_code(text, uuid) from public, anon;
grant execute on function public.redeem_code(text, uuid) to authenticated;

-- ───────────────────────── Eventos ─────────────────────────
create function public.track_event(p_promotion_id uuid, p_type public.event_type)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is not null and not public.check_rate_limit('ev:' || v_uid, 120, 60) then
    return;
  end if;
  if not exists (select 1 from public.promotions where id = p_promotion_id and status = 'activa') then
    return;
  end if;
  insert into public.promotion_events (promotion_id, user_id, type) values (p_promotion_id, v_uid, p_type);
end $$;
revoke execute on function public.track_event(uuid, public.event_type) from public;
grant execute on function public.track_event(uuid, public.event_type) to anon, authenticated;

-- ───────────────────────── Métricas ─────────────────────────
-- Cliente nuevo = su primer canje en esa cadena fue con esta promo.
create view public.redemption_facts with (security_invoker = true) as
select
  rc.id,
  rc.promotion_id,
  rc.chain_id,
  rc.user_id,
  rc.redeemed_at,
  rc.redeemed_store_id,
  not exists (
    select 1 from public.redemption_codes prev
    where prev.user_id = rc.user_id
      and prev.chain_id = rc.chain_id
      and prev.status = 'redeemed'
      and (prev.redeemed_at < rc.redeemed_at or (prev.redeemed_at = rc.redeemed_at and prev.id < rc.id))
  ) as is_new_customer
from public.redemption_codes rc
where rc.status = 'redeemed';

-- Embudo por promoción. security_invoker → cada uno ve solo lo que su RLS permite.
create view public.promotion_stats with (security_invoker = true) as
select
  p.id as promotion_id,
  p.chain_id,
  (select count(*) from public.promotion_events e where e.promotion_id = p.id and e.type = 'view')  as views,
  (select count(*) from public.promotion_events e where e.promotion_id = p.id and e.type = 'save')  as saves,
  (select count(*) from public.promotion_events e where e.promotion_id = p.id and e.type = 'click') as clicks,
  (select count(*) from public.redemption_codes c where c.promotion_id = p.id)                      as codes,
  (select count(*) from public.redemption_facts f where f.promotion_id = p.id)                      as redemptions,
  (select count(*) from public.redemption_facts f where f.promotion_id = p.id and f.is_new_customer) as new_customers
from public.promotions p;

-- Serie diaria de los últimos N días (hora de Madrid) para una cadena.
create function public.chain_daily_stats(p_chain_id uuid, p_days integer default 14)
returns table (day date, views bigint, codes bigint, redemptions bigint, new_customers bigint)
language sql stable security invoker set search_path = '' as $$
  with days as (
    select generate_series(
      (now() at time zone 'Europe/Madrid')::date - (p_days - 1),
      (now() at time zone 'Europe/Madrid')::date,
      interval '1 day'
    )::date as day
  )
  select
    d.day,
    (select count(*) from public.promotion_events e
       join public.promotions p on p.id = e.promotion_id
      where p.chain_id = p_chain_id and e.type = 'view'
        and (e.created_at at time zone 'Europe/Madrid')::date = d.day),
    (select count(*) from public.redemption_codes c
      where c.chain_id = p_chain_id and (c.created_at at time zone 'Europe/Madrid')::date = d.day),
    (select count(*) from public.redemption_facts f
      where f.chain_id = p_chain_id and (f.redeemed_at at time zone 'Europe/Madrid')::date = d.day),
    (select count(*) from public.redemption_facts f
      where f.chain_id = p_chain_id and f.is_new_customer and (f.redeemed_at at time zone 'Europe/Madrid')::date = d.day)
  from days d
  order by d.day
$$;
grant execute on function public.chain_daily_stats(uuid, integer) to authenticated;
