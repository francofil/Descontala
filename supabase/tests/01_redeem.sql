-- Tests de generación y canje de códigos + métrica de clientes nuevos.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

-- ── Helpers ── (las funciones son SECURITY DEFINER y usan auth.uid(), basta con fijar el JWT)
create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;
create function pg_temp.act_as_admin_db() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
end $$;
create function pg_temp.redeem(p_code text, p_store uuid) returns text language sql as $$
  select public.redeem_code(p_code, p_store) ->> 'result'
$$;

-- ── Fixtures ──
-- Usuarios nuevos (sin historial) para que los resultados sean deterministas.
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'test1@test.local'),
  ('00000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'test2@test.local'),
  ('00000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'test3@test.local');

-- Cadena 1: promo A (sin límite), promo B (límite 1). Cadena 2: promo C.
insert into public.promotions (id, chain_id, title, type, value, starts_at, ends_at, max_redemptions) values
  ('d0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000001', 'Test A', 'porcentaje', 10, now() - interval '1 day', now() + interval '2 days', null),
  ('d0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-000000000001', 'Test B', '2x1', null, now() - interval '1 day', now() + interval '2 days', 1),
  ('d0000000-0000-0000-0000-00000000000c', 'c0000000-0000-0000-0000-000000000002', 'Test C', '3x2', null, now() - interval '1 day', now() + interval '2 days', null),
  ('d0000000-0000-0000-0000-00000000000d', 'c0000000-0000-0000-0000-000000000001', 'Test D futura', '2x1', null, now() + interval '1 day', now() + interval '3 days', null);
insert into public.promotion_stores (promotion_id, store_id) values
  ('d0000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-00000000000b', '50000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-00000000000c', '50000000-0000-0000-0000-000000000004');

-- ── Generación ──
select pg_temp.act_as('f0000000-0000-0000-0000-000000000001');

create temporary table t_code as
  select code from public.generate_code('d0000000-0000-0000-0000-00000000000a');

select matches((select code from t_code), '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$', 'el código tiene 8 caracteres del alfabeto seguro');
select is((select code from public.generate_code('d0000000-0000-0000-0000-00000000000a')), (select code from t_code),
          'pedir de nuevo devuelve el mismo código activo');
select throws_ok($$ select public.generate_code('d0000000-0000-0000-0000-00000000000d') $$, 'P0001', 'promo_no_vigente',
                 'no se generan códigos para promos futuras');
select throws_ok($$ select public.generate_code(gen_random_uuid()) $$, 'P0001', 'promo_no_vigente',
                 'no se generan códigos para promos inexistentes');

-- ── Canje ──
select pg_temp.act_as('a0000000-0000-0000-0000-000000000001'); -- consumer
select is(pg_temp.redeem((select code from t_code), '50000000-0000-0000-0000-000000000001'), 'no_autorizado',
          'un consumer no puede canjear');

select pg_temp.act_as('a0000000-0000-0000-0000-000000000003'); -- merchant cadena 2
select is(pg_temp.redeem((select code from t_code), '50000000-0000-0000-0000-000000000004'), 'otra_cadena',
          'un código de otra cadena se rechaza');
select is(pg_temp.redeem((select code from t_code), '50000000-0000-0000-0000-000000000001'), 'tienda_invalida',
          'un merchant no puede canjear en tiendas de otra cadena');

select pg_temp.act_as('a0000000-0000-0000-0000-000000000002'); -- merchant cadena 1
select is(pg_temp.redeem('zzzz-zzzz', '50000000-0000-0000-0000-000000000001'), 'no_existe', 'código inexistente');
select is(pg_temp.redeem((select code from t_code), '50000000-0000-0000-0000-000000000002'), 'tienda_no_incluida',
          'la tienda debe estar incluida en la promo');

-- Formato humano: minúsculas y guion se normalizan.
select is(public.redeem_code(lower(substr((select code from t_code), 1, 4) || '-' || substr((select code from t_code), 5)),
                             '50000000-0000-0000-0000-000000000001') ->> 'is_new_customer', 'true',
          'canje válido (formato con guion y minúsculas) y es cliente nuevo');
select is(pg_temp.redeem((select code from t_code), '50000000-0000-0000-0000-000000000001'), 'ya_usado',
          'doble canje rechazado');

select pg_temp.act_as('f0000000-0000-0000-0000-000000000001');
select throws_ok($$ select public.generate_code('d0000000-0000-0000-0000-00000000000a') $$, 'P0001', 'ya_canjeado',
                 'tras canjear no se puede pedir otro código de la misma promo');

-- ── Límite de canjes (promo B, max 1) ──
select pg_temp.act_as('f0000000-0000-0000-0000-000000000002');
create temporary table t_b2 as select code from public.generate_code('d0000000-0000-0000-0000-00000000000b');
select pg_temp.act_as('f0000000-0000-0000-0000-000000000003');
create temporary table t_b3 as select code from public.generate_code('d0000000-0000-0000-0000-00000000000b');

select pg_temp.act_as('a0000000-0000-0000-0000-000000000002');
select is(pg_temp.redeem((select code from t_b2), '50000000-0000-0000-0000-000000000001'), 'ok', 'primer canje de promo limitada');
select is(pg_temp.redeem((select code from t_b3), '50000000-0000-0000-0000-000000000001'), 'limite_alcanzado',
          'se respeta max_redemptions');

select pg_temp.act_as('f0000000-0000-0000-0000-000000000001');
select throws_ok($$ select public.generate_code('d0000000-0000-0000-0000-00000000000b') $$, 'P0001', 'limite_alcanzado',
                 'no se generan códigos si la promo agotó su límite');

-- ── Caducado ──
select pg_temp.act_as_admin_db();
insert into public.redemption_codes (code, promotion_id, chain_id, user_id, created_at, expires_at)
values ('CADUCAD2', 'd0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-000000000001',
        'f0000000-0000-0000-0000-000000000003', now() - interval '3 days', now() - interval '1 hour');

select pg_temp.act_as('a0000000-0000-0000-0000-000000000002');
select is(pg_temp.redeem('CADUCAD2', '50000000-0000-0000-0000-000000000001'), 'caducado', 'código caducado rechazado');
select pg_temp.act_as_admin_db();
select is((select status::text from public.redemption_codes where code = 'CADUCAD2'), 'expired', 'el código queda marcado como caducado');

-- ── Clientes nuevos ──
-- test2 ya canjeó B en cadena 1 → nuevo. Ahora canjea A en cadena 1 → NO nuevo. Y C en cadena 2 → nuevo.
select pg_temp.act_as('f0000000-0000-0000-0000-000000000002');
create temporary table t_a2 as select code from public.generate_code('d0000000-0000-0000-0000-00000000000a');
create temporary table t_c2 as select code from public.generate_code('d0000000-0000-0000-0000-00000000000c');

select pg_temp.act_as('a0000000-0000-0000-0000-000000000002');
select is(public.redeem_code((select code from t_a2), '50000000-0000-0000-0000-000000000001') ->> 'is_new_customer', 'false',
          'segundo canje en la misma cadena no es cliente nuevo');
select pg_temp.act_as('a0000000-0000-0000-0000-000000000003');
select is(public.redeem_code((select code from t_c2), '50000000-0000-0000-0000-000000000004') ->> 'is_new_customer', 'true',
          'primer canje en otra cadena sí es cliente nuevo');

select pg_temp.act_as_admin_db();
select is((select new_customers from public.promotion_stats where promotion_id = 'd0000000-0000-0000-0000-00000000000b'), 1::bigint,
          'promo B: 1 cliente nuevo');
select is((select new_customers from public.promotion_stats where promotion_id = 'd0000000-0000-0000-0000-00000000000a'), 1::bigint,
          'promo A: 1 cliente nuevo (test1), test2 no cuenta');
select is((select redemptions from public.promotion_stats where promotion_id = 'd0000000-0000-0000-0000-00000000000a'), 2::bigint,
          'promo A: 2 canjes');

-- ── Unicidad de código activo ──
select throws_ok($$
  insert into public.redemption_codes (code, promotion_id, chain_id, user_id, expires_at)
  values ('DUPLXCA2', 'd0000000-0000-0000-0000-00000000000c', 'c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', now() + interval '1 day'),
         ('DUPLXCA3', 'd0000000-0000-0000-0000-00000000000c', 'c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', now() + interval '1 day')
$$, '23505', null, 'no puede haber dos códigos activos del mismo usuario y promo');

select * from finish();
rollback;
