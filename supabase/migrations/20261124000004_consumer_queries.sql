-- Descontala · Consultas del lado usuario: promos cercanas y búsqueda de precios.

create extension if not exists unaccent with schema extensions;

-- Distancia en km entre dos puntos (haversine).
create function public.distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql immutable parallel safe set search_path = '' as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

create function public.search_text(t text) returns text
language sql stable parallel safe set search_path = '' as $$
  select lower(extensions.unaccent(coalesce(t, '')))
$$;

-- Promos vigentes cerca de un punto, con la tienda más cercana de cada una.
create function public.nearby_promotions(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 15
)
returns table (
  id uuid,
  title text,
  description text,
  type public.promo_type,
  value numeric,
  conditions text,
  starts_at timestamptz,
  ends_at timestamptz,
  chain_id uuid,
  chain_name text,
  chain_color text,
  product_id uuid,
  product_name text,
  category_id uuid,
  category_slug text,
  category_name text,
  category_emoji text,
  store_id uuid,
  store_name text,
  store_neighborhood text,
  store_lat double precision,
  store_lng double precision,
  distance_km double precision,
  store_count bigint
)
language sql stable security invoker set search_path = '' as $$
  with live as (
    select p.*
    from public.promotions p
    where p.status = 'activa' and p.starts_at <= now() and p.ends_at > now()
  ),
  candidate_stores as (
    select l.id as promo_id, s.*, public.distance_km(p_lat, p_lng, s.lat, s.lng) as dist
    from live l
    join public.stores s on s.chain_id = l.chain_id
    where not exists (select 1 from public.promotion_stores ps where ps.promotion_id = l.id)
       or exists (select 1 from public.promotion_stores ps where ps.promotion_id = l.id and ps.store_id = s.id)
  ),
  ranked as (
    select cs.*,
           row_number() over (partition by cs.promo_id order by cs.dist) as rn,
           count(*) over (partition by cs.promo_id) as n
    from candidate_stores cs
  )
  select
    l.id, l.title, l.description, l.type, l.value, l.conditions, l.starts_at, l.ends_at,
    c.id, c.name, c.color,
    pr.id, pr.name,
    cat.id, cat.slug, cat.name, cat.emoji,
    r.id, r.name, r.neighborhood, r.lat, r.lng, r.dist, r.n
  from live l
  join ranked r on r.promo_id = l.id and r.rn = 1
  join public.chains c on c.id = l.chain_id
  left join public.products pr on pr.id = l.product_id
  left join public.categories cat on cat.id = coalesce(l.category_id, pr.category_id)
  where r.dist <= p_radius_km
  order by l.ends_at::date, r.dist
$$;
grant execute on function public.nearby_promotions(double precision, double precision, double precision) to anon, authenticated;

-- Búsqueda de un producto: precio en cada súper cercano y promo activa si la hay.
create function public.search_product_prices(
  p_query text,
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 15
)
returns table (
  product_id uuid,
  product_name text,
  brand text,
  unit text,
  store_id uuid,
  store_name text,
  store_neighborhood text,
  chain_id uuid,
  chain_name text,
  chain_color text,
  price numeric,
  updated_at timestamptz,
  distance_km double precision,
  promotion_id uuid,
  promotion_title text,
  promotion_type public.promo_type,
  promotion_value numeric,
  promotion_ends_at timestamptz
)
language sql stable security invoker set search_path = '' as $$
  with q as (
    select public.search_text(trim(p_query)) as term
  ),
  matches as (
    select p.*,
           case
             when public.search_text(p.name) like q.term || '%' then 0
             when public.search_text(p.name) like '% ' || q.term || '%' then 1
             else 2
           end as rank
    from public.products p, q
    where length(q.term) >= 2
      and (public.search_text(p.name) like '%' || q.term || '%'
           or public.search_text(p.brand) like '%' || q.term || '%')
    order by rank, p.name
    limit 4
  )
  select
    m.id, m.name, m.brand, m.unit,
    s.id, s.name, s.neighborhood,
    c.id, c.name, c.color,
    sp.price, sp.updated_at,
    public.distance_km(p_lat, p_lng, s.lat, s.lng) as dist,
    promo.id, promo.title, promo.type, promo.value, promo.ends_at
  from matches m
  join public.store_prices sp on sp.product_id = m.id
  join public.stores s on s.id = sp.store_id
  join public.chains c on c.id = s.chain_id
  left join lateral (
    select p.id, p.title, p.type, p.value, p.ends_at
    from public.promotions p
    where p.product_id = m.id
      and p.chain_id = s.chain_id
      and p.status = 'activa' and p.starts_at <= now() and p.ends_at > now()
      and (not exists (select 1 from public.promotion_stores ps where ps.promotion_id = p.id)
           or exists (select 1 from public.promotion_stores ps where ps.promotion_id = p.id and ps.store_id = s.id))
    order by p.ends_at
    limit 1
  ) promo on true
  where public.distance_km(p_lat, p_lng, s.lat, s.lng) <= p_radius_km
  order by m.rank, m.name, sp.price, dist
$$;
grant execute on function public.search_product_prices(text, double precision, double precision, double precision) to anon, authenticated;
