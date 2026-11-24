-- Descontala · Seed de demo
-- Todas las fechas son relativas a now(), así la demo siempre tiene promos vigentes.
-- Contraseña de todos los usuarios de demo: Demo1234!

-- Utilidad temporal: fin del día (hora de Madrid) dentro de N días.
create or replace function public._seed_eod(d integer) returns timestamptz
language sql stable as $$
  select (((now() at time zone 'Europe/Madrid')::date + d) + time '23:59') at time zone 'Europe/Madrid'
$$;

-- ───────────────────────── Usuarios ─────────────────────────
create or replace function public._seed_user(p_id uuid, p_email text, p_name text, p_password text default 'Demo1234!')
returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now() - interval '30 days',
    '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', p_name),
    now() - interval '30 days', now(),
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
end $$;

-- ───────────────────────── Cadenas ─────────────────────────
insert into public.chains (id, name, highlights, color) values
  ('c0000000-0000-0000-0000-000000000001', 'Despensa Giralda',  'Fruta y verdura de la vega, trato de barrio', '#15803d'),
  ('c0000000-0000-0000-0000-000000000002', 'Súper Alameda',     'Carne y charcutería de la sierra',            '#b91c1c'),
  ('c0000000-0000-0000-0000-000000000003', 'El Cesto de Triana', 'Precios de mercado y pan de obrador propio',  '#b45309');

insert into public.merchant_settings (chain_id, fee_per_redemption) values
  ('c0000000-0000-0000-0000-000000000001', 0.35),
  ('c0000000-0000-0000-0000-000000000002', 0.30),
  ('c0000000-0000-0000-0000-000000000003', 0.40);

-- ───────────────────────── Tiendas ─────────────────────────
insert into public.stores (id, chain_id, name, address, neighborhood, lat, lng) values
  ('50000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Despensa Giralda Triana',      'Calle San Jacinto, 52',            'Triana',           37.38330, -6.00300),
  ('50000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Despensa Giralda Nervión',     'Avenida Eduardo Dato, 30',         'Nervión',          37.38260, -5.97370),
  ('50000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Despensa Giralda Macarena',    'Calle San Luis, 70',               'Macarena',         37.40400, -5.98800),
  ('50000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Súper Alameda Los Remedios',   'Avenida República Argentina, 20',  'Los Remedios',     37.37450, -6.00000),
  ('50000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'Súper Alameda Sevilla Este',   'Avenida de las Ciencias, 15',      'Sevilla Este',     37.40000, -5.92300),
  ('50000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Súper Alameda Centro',         'Alameda de Hércules, 30',          'Casco Antiguo',    37.39900, -5.99500),
  ('50000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'El Cesto Triana',              'Calle Pagés del Corro, 90',        'Triana',           37.38500, -6.00600),
  ('50000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'El Cesto Nervión',             'Avenida Luis de Morales, 12',      'Nervión',          37.38000, -5.97000),
  ('50000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003', 'El Cesto Bermejales',          'Avenida de Finlandia, 8',          'Bermejales',       37.35000, -5.98000),
  ('50000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000003', 'El Cesto Capuchinos',          'Ronda de Capuchinos, 8',           'Macarena',         37.40200, -5.98300);

-- ───────────────────────── Categorías y productos ─────────────────────────
insert into public.categories (slug, name, emoji, sort) values
  ('despensa',   'Despensa',          '🫙', 1),
  ('lacteos',    'Lácteos y huevos',  '🥛', 2),
  ('carne',      'Carne y pescado',   '🍗', 3),
  ('fruta',      'Fruta y verdura',   '🍅', 4),
  ('bebidas',    'Bebidas',           '🥤', 5),
  ('desayuno',   'Desayuno',          '☕', 6),
  ('limpieza',   'Limpieza e higiene','🧴', 7),
  ('panaderia',  'Panadería',         '🥖', 8);

create temporary table _p (name text, cat text, unit text, brand text, base numeric);
insert into _p values
  ('Arroz redondo 1 kg',               'despensa', 'ud', 'La Fallera',     1.45),
  ('Macarrones 500 g',                 'despensa', 'ud', 'Gallo',          1.10),
  ('Espaguetis 500 g',                 'despensa', 'ud', 'Gallo',          1.10),
  ('Aceite de oliva virgen extra 1 l', 'despensa', 'l',  'Oleoestepa',     8.95),
  ('Aceite de girasol 1 l',            'despensa', 'l',  'Koipesol',       2.10),
  ('Tomate frito 400 g',               'despensa', 'ud', 'Orlando',        1.25),
  ('Garbanzos cocidos 400 g',          'despensa', 'ud', 'Luengo',         0.95),
  ('Atún en aceite pack 3',            'despensa', 'ud', 'Calvo',          3.60),
  ('Harina de trigo 1 kg',             'despensa', 'ud', 'Gallo',          0.99),
  ('Azúcar 1 kg',                      'despensa', 'ud', 'Azucarera',      1.35),
  ('Leche entera 1 l',                 'lacteos',  'l',  'Puleva',         1.15),
  ('Leche semidesnatada 1 l',          'lacteos',  'l',  'Puleva',         1.10),
  ('Huevos camperos docena',           'lacteos',  'ud', 'Huevos Guillén', 3.20),
  ('Yogur natural pack 4',             'lacteos',  'ud', 'Danone',         1.60),
  ('Queso semicurado 250 g',           'lacteos',  'ud', 'García Baquero', 3.75),
  ('Mantequilla 250 g',                'lacteos',  'ud', 'Central Lechera Asturiana', 2.65),
  ('Pechuga de pollo',                 'carne',    'kg', null,             7.20),
  ('Muslos de pollo',                  'carne',    'kg', null,             3.90),
  ('Carne picada mixta',               'carne',    'kg', null,             7.80),
  ('Lomo de cerdo',                    'carne',    'kg', null,             6.90),
  ('Salmón fresco',                    'carne',    'kg', null,            14.50),
  ('Jamón serrano loncheado 100 g',    'carne',    'ud', 'Navidul',        2.95),
  ('Tomates pera',                     'fruta',    'kg', null,             2.10),
  ('Patatas',                          'fruta',    'kg', null,             1.40),
  ('Plátanos de Canarias',             'fruta',    'kg', null,             2.30),
  ('Naranjas de zumo',                 'fruta',    'kg', null,             1.50),
  ('Cebollas',                         'fruta',    'kg', null,             1.30),
  ('Lechuga romana',                   'fruta',    'ud', null,             0.95),
  ('Agua mineral 1,5 l',               'bebidas',  'l',  'Font Vella',     0.60),
  ('Agua mineral pack 6 × 1,5 l',      'bebidas',  'ud', 'Font Vella',     3.20),
  ('Cerveza lata pack 6',              'bebidas',  'ud', 'Cruzcampo',      4.50),
  ('Refresco de cola 2 l',             'bebidas',  'l',  'Coca-Cola',      2.20),
  ('Zumo de naranja 1 l',              'bebidas',  'l',  'Don Simón',      1.45),
  ('Café molido 250 g',                'desayuno', 'ud', 'Marcilla',       3.40),
  ('Galletas María 800 g',             'desayuno', 'ud', 'Cuétara',        1.90),
  ('Cacao soluble 400 g',              'desayuno', 'ud', 'Cola Cao',       3.10),
  ('Detergente líquido 30 lavados',    'limpieza', 'ud', 'Ariel',          8.40),
  ('Papel higiénico 12 rollos',        'limpieza', 'ud', 'Scottex',        5.20),
  ('Lavavajillas a mano 1 l',          'limpieza', 'ud', 'Fairy',          2.40),
  ('Pan de pueblo',                    'panaderia','ud', null,             1.30),
  ('Pan de molde integral',            'panaderia','ud', 'Bimbo',          2.15);

insert into public.products (name, category_id, unit, brand)
select _p.name, c.id, _p.unit, _p.brand from _p join public.categories c on c.slug = _p.cat;

-- Precio por tienda: base ± 15 %, con alguna cadena algo más barata en su especialidad.
insert into public.store_prices (store_id, product_id, price, updated_at)
select s.id, p.id,
       round(_p.base * (0.87 + random()::numeric * 0.26)
             * case when s.chain_id = 'c0000000-0000-0000-0000-000000000001' and c.slug = 'fruta' then 0.9
                    when s.chain_id = 'c0000000-0000-0000-0000-000000000002' and c.slug = 'carne' then 0.9
                    when s.chain_id = 'c0000000-0000-0000-0000-000000000003' and c.slug in ('panaderia', 'despensa') then 0.93
                    else 1 end, 2),
       now() - (random() * interval '3 days')
from public.stores s
cross join public.products p
join _p on _p.name = p.name
join public.categories c on c.id = p.category_id
where random() > 0.06; -- no todas las tiendas tienen todo

-- ───────────────────────── Usuarios de demo ─────────────────────────
select public._seed_user('a0000000-0000-0000-0000-000000000001', 'usuario@demo.com', 'Lucía');
select public._seed_user('a0000000-0000-0000-0000-000000000002', 'cadena1@demo.com', 'Despensa Giralda');
select public._seed_user('a0000000-0000-0000-0000-000000000003', 'cadena2@demo.com', 'Súper Alameda');
select public._seed_user('a0000000-0000-0000-0000-000000000004', 'cadena3@demo.com', 'El Cesto de Triana');
select public._seed_user('a0000000-0000-0000-0000-000000000005', 'admin@demo.com',   'Admin');

update public.profiles set role = 'merchant', chain_id = 'c0000000-0000-0000-0000-000000000001' where id = 'a0000000-0000-0000-0000-000000000002';
update public.profiles set role = 'merchant', chain_id = 'c0000000-0000-0000-0000-000000000002' where id = 'a0000000-0000-0000-0000-000000000003';
update public.profiles set role = 'merchant', chain_id = 'c0000000-0000-0000-0000-000000000003' where id = 'a0000000-0000-0000-0000-000000000004';
update public.profiles set role = 'admin' where id = 'a0000000-0000-0000-0000-000000000005';

-- 40 clientes históricos (sin acceso: contraseña aleatoria).
select public._seed_user(
  ('b0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  'cliente' || lpad(i::text, 2, '0') || '@demo.local',
  'Cliente ' || i,
  encode(extensions.gen_random_bytes(16), 'hex')
) from generate_series(1, 40) i;

-- Avisos de la usuaria de demo: su día de compra es MAÑANA → ve "Antes de tu compra de mañana".
insert into public.alert_preferences (user_id, shopping_day, radius_km, category_ids)
select 'a0000000-0000-0000-0000-000000000001',
       extract(dow from (now() at time zone 'Europe/Madrid') + interval '1 day')::smallint,
       5,
       array(select id from public.categories where slug in ('despensa', 'lacteos', 'fruta'));

-- ───────────────────────── Promociones ─────────────────────────
create temporary table _promo (
  id uuid, chain_no int, product text, cat text, title text, description text,
  type public.promo_type, value numeric, conditions text,
  starts_at timestamptz, ends_at timestamptz, max_red int, status public.promo_status, stores int[]
);

insert into _promo values
  -- Despensa Giralda (cadena 1)
  ('e0000000-0000-0000-0000-000000000001', 1, 'Aceite de oliva virgen extra 1 l', 'despensa',
   '25 % en aceite de oliva virgen extra', 'El AOVE de Estepa de siempre, a precio de oferta.',
   'porcentaje', 25, 'Máximo 2 botellas por cliente.', now() - interval '5 days', public._seed_eod(6), null, 'activa', array[1,2,3]),
  ('e0000000-0000-0000-0000-000000000002', 1, 'Tomates pera', 'fruta',
   'Tomates pera a 1,49 €/kg', 'Tomate de la vega, recogido esta semana.',
   'precio_fijo', 1.49, 'Precio por kilo. Hasta agotar existencias.', now() - interval '2 days', public._seed_eod(0), null, 'activa', array[1,2,3]),
  ('e0000000-0000-0000-0000-000000000003', 1, 'Huevos camperos docena', 'lacteos',
   '2.ª docena de huevos al 50 %', null,
   'segunda_unidad', 50, 'Comprando 2 docenas de la misma marca.', now() - interval '8 days', public._seed_eod(1), 200, 'activa', array[1,3]),
  ('e0000000-0000-0000-0000-000000000004', 1, 'Naranjas de zumo', 'fruta',
   '3x2 en naranjas de zumo', 'Malla de 2 kg.',
   '3x2', null, 'Pagas 2 mallas y te llevas 3.', now() - interval '10 days', public._seed_eod(4), null, 'activa', array[1,2,3]),
  ('e0000000-0000-0000-0000-000000000005', 1, 'Yogur natural pack 4', 'lacteos',
   '2x1 en yogures naturales', null,
   '2x1', null, 'Pack de 4 unidades. Solo en Triana.', now() - interval '12 days', now() - interval '2 days', null, 'activa', array[1]),
  ('e0000000-0000-0000-0000-000000000006', 1, 'Café molido 250 g', 'desayuno',
   '20 % en café molido', null,
   'porcentaje', 20, 'Variedades natural y mezcla.', now() + interval '2 days', public._seed_eod(10), null, 'activa', array[1,2,3]),
  -- Súper Alameda (cadena 2)
  ('e0000000-0000-0000-0000-000000000007', 2, 'Pechuga de pollo', 'carne',
   'Pechuga de pollo a 5,95 €/kg', 'Pollo de corral fileteado al momento.',
   'precio_fijo', 5.95, 'Precio por kilo en mostrador.', now() - interval '6 days', public._seed_eod(3), null, 'activa', array[4,5,6]),
  ('e0000000-0000-0000-0000-000000000008', 2, 'Cerveza lata pack 6', 'bebidas',
   '2x1 en cerveza pack 6', null,
   '2x1', null, 'Mayores de 18 años. Máx. 2 promociones por compra.', now() - interval '3 days', public._seed_eod(1), 150, 'activa', array[4,5,6]),
  ('e0000000-0000-0000-0000-000000000009', 2, 'Jamón serrano loncheado 100 g', 'carne',
   '30 % en jamón serrano loncheado', null,
   'porcentaje', 30, null, now() - interval '9 days', public._seed_eod(5), null, 'activa', array[4,5,6]),
  ('e0000000-0000-0000-0000-000000000010', 2, 'Carne picada mixta', 'carne',
   '2.ª unidad de carne picada al 70 %', 'Bandejas de 500 g.',
   'segunda_unidad', 70, 'En bandejas de 500 g de la misma referencia.', now() - interval '4 days', public._seed_eod(0), null, 'activa', array[4,6]),
  ('e0000000-0000-0000-0000-000000000011', 2, 'Leche entera 1 l', 'lacteos',
   '15 % en leche entera', null,
   'porcentaje', 15, 'Comprando un pack de 6 bricks.', now() - interval '11 days', public._seed_eod(8), null, 'activa', array[4,5,6]),
  ('e0000000-0000-0000-0000-000000000012', 2, 'Detergente líquido 30 lavados', 'limpieza',
   '3x2 en detergente', null,
   '3x2', null, 'Misma referencia.', now() + interval '3 days', public._seed_eod(14), null, 'activa', array[4,5,6]),
  -- El Cesto de Triana (cadena 3)
  ('e0000000-0000-0000-0000-000000000013', 3, 'Pan de pueblo', 'panaderia',
   '2x1 en pan de pueblo', 'Recién hecho en nuestro obrador.',
   '2x1', null, 'De 8:00 a 11:00.', now() - interval '7 days', public._seed_eod(2), null, 'activa', array[7,8,9,10]),
  ('e0000000-0000-0000-0000-000000000014', 3, 'Arroz redondo 1 kg', 'despensa',
   'Arroz redondo a 0,99 €', null,
   'precio_fijo', 0.99, 'Máximo 4 unidades por cliente.', now() - interval '5 days', public._seed_eod(1), 300, 'activa', array[7,8,9,10]),
  ('e0000000-0000-0000-0000-000000000015', 3, 'Macarrones 500 g', 'despensa',
   '3x2 en pasta', 'Macarrones y espaguetis.',
   '3x2', null, 'Combinables entre formatos de 500 g.', now() - interval '9 days', public._seed_eod(7), null, 'activa', array[7,8,9,10]),
  ('e0000000-0000-0000-0000-000000000016', 3, 'Agua mineral pack 6 × 1,5 l', 'bebidas',
   '20 % en agua pack 6', null,
   'porcentaje', 20, null, now() - interval '13 days', public._seed_eod(3), null, 'activa', array[7,8,9,10]),
  ('e0000000-0000-0000-0000-000000000017', 3, 'Galletas María 800 g', 'desayuno',
   '2.ª unidad de galletas al 50 %', null,
   'segunda_unidad', 50, null, now() - interval '14 days', now() - interval '1 day', null, 'activa', array[7,8]),
  ('e0000000-0000-0000-0000-000000000018', 3, 'Plátanos de Canarias', 'fruta',
   '25 % en plátano de Canarias', null,
   'porcentaje', 25, 'Por kilo.', now() + interval '1 day', public._seed_eod(9), null, 'borrador', array[7,8,9,10]);

insert into public.promotions (id, chain_id, product_id, category_id, title, description, type, value, conditions, starts_at, ends_at, max_redemptions, status, created_at)
select _promo.id,
       ('c0000000-0000-0000-0000-00000000000' || _promo.chain_no)::uuid,
       p.id, c.id, _promo.title, _promo.description, _promo.type, _promo.value, _promo.conditions,
       _promo.starts_at, _promo.ends_at, _promo.max_red, _promo.status, least(_promo.starts_at, now()) - interval '1 day'
from _promo
left join public.products p on p.name = _promo.product
left join public.categories c on c.slug = _promo.cat;

insert into public.promotion_stores (promotion_id, store_id)
select _promo.id, ('50000000-0000-0000-0000-' || lpad(s::text, 12, '0'))::uuid
from _promo, unnest(_promo.stores) s;

-- ───────────────────────── Histórico (últimos 14 días) ─────────────────────────
-- Vistas y guardados por día y promo.
insert into public.promotion_events (promotion_id, user_id, type, created_at)
select pr.id,
       case when random() < 0.6 then ('b0000000-0000-0000-0000-' || lpad((1 + floor(random() * 40))::int::text, 12, '0'))::uuid end,
       (case when v.r < 0.10 then 'save' when v.r < 0.22 then 'click' else 'view' end)::public.event_type,
       ts
from public.promotions pr
cross join generate_series(0, 13) d
cross join lateral (
  select ((now() at time zone 'Europe/Madrid')::date - d + time '09:00') at time zone 'Europe/Madrid'
         + random() * interval '12 hours' as ts,
         random() as r
  from generate_series(1, 30 + floor(random() * 50)::int + (pr.id = pr.id)::int * 0)
) v
where pr.status = 'activa' and v.ts between pr.starts_at and least(pr.ends_at, now());

-- Códigos y canjes históricos. Cada cliente usa como mucho un código por promo.
insert into public.redemption_codes (code, promotion_id, chain_id, user_id, status, created_at, expires_at, redeemed_at, redeemed_store_id, redeemed_by)
select public.random_code(), x.promotion_id, x.chain_id, x.user_id,
       case when x.redeem then 'redeemed' else 'expired' end::public.code_status,
       x.created_at, x.ends_at,
       case when x.redeem then x.redeemed_at end,
       case when x.redeem then x.store_id end,
       case when x.redeem then ('a0000000-0000-0000-0000-00000000000' || (x.chain_no + 1))::uuid end
from (
  select pr.id as promotion_id, pr.chain_id, pr.ends_at,
         ('b0000000-0000-0000-0000-' || lpad(u::text, 12, '0'))::uuid as user_id,
         t.created_at,
         least(t.created_at + (interval '1 hour' + random() * interval '40 hours'), now() - interval '5 minutes', pr.ends_at - interval '1 minute') as redeemed_at,
         random() < 0.68 as redeem,
         (select ps.store_id from public.promotion_stores ps where ps.promotion_id = pr.id order by random() + u * 0 limit 1) as store_id,
         right(pr.chain_id::text, 1)::int as chain_no
  from public.promotions pr
  cross join generate_series(1, 40) u
  cross join lateral (
    select greatest(pr.starts_at, now() - interval '14 days')
           + random() * (least(pr.ends_at, now()) - greatest(pr.starts_at, now() - interval '14 days')) as created_at , u as _u
  ) t
  where pr.status = 'activa'
    and pr.starts_at < now() - interval '1 hour'
    and pr.id <> 'e0000000-0000-0000-0000-000000000001'  -- la promo del guion de demo arranca más limpia
    and random() < 0.45
) x
where x.redeemed_at > x.created_at;

-- Algunos canjes de la promo del guion, pero nunca de la usuaria de demo.
insert into public.redemption_codes (code, promotion_id, chain_id, user_id, status, created_at, expires_at, redeemed_at, redeemed_store_id, redeemed_by)
select public.random_code(), 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
       ('b0000000-0000-0000-0000-' || lpad(u::text, 12, '0'))::uuid, 'redeemed',
       now() - (u * interval '9 hours') - interval '2 hours', public._seed_eod(6),
       now() - (u * interval '9 hours'), '50000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'
from generate_series(1, 11) u;

-- Limpieza de utilidades.
drop function public._seed_user(uuid, text, text, text);
drop function public._seed_eod(integer);
