-- Tests de las políticas RLS principales.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;

-- Fixture: un código del usuario de demo (como postgres).
insert into public.redemption_codes (code, promotion_id, chain_id, user_id, expires_at)
values ('RLSTEST2', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001', now() + interval '1 day');

-- ── Anónimo ──
select pg_temp.act_as_anon();
select ok((select count(*) from public.promotions) > 0, 'anon ve promos activas');
select is((select count(*) from public.promotions where status <> 'activa'), 0::bigint, 'anon no ve borradores');
select is((select count(*) from public.redemption_codes), 0::bigint, 'anon no ve códigos');
select is((select count(*) from public.promotion_events), 0::bigint, 'anon no ve eventos');

-- ── Consumer ──
select pg_temp.act_as('a0000000-0000-0000-0000-000000000001');
select is((select count(*) from public.redemption_codes where user_id <> 'a0000000-0000-0000-0000-000000000001'), 0::bigint,
          'consumer solo ve sus códigos');
select is((select count(*) from public.redemption_codes), 1::bigint, 'consumer ve su propio código');
select throws_ok($$ insert into public.redemption_codes (code, promotion_id, chain_id, user_id, expires_at)
                    values ('HACKEO22', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
                            'a0000000-0000-0000-0000-000000000001', now() + interval '1 day') $$,
                 '42501', null, 'consumer no puede crear códigos directamente');
select throws_ok($$ update public.profiles set role = 'admin' where id = 'a0000000-0000-0000-0000-000000000001' $$,
                 '42501', null, 'consumer no puede cambiarse el rol');
select throws_ok($$ insert into public.promotions (chain_id, title, type, value, ends_at)
                    values ('c0000000-0000-0000-0000-000000000001', 'Promo falsa', 'porcentaje', 50, now() + interval '1 day') $$,
                 '42501', null, 'consumer no puede crear promos');
select is((select count(*) from public.alert_preferences where user_id <> 'a0000000-0000-0000-0000-000000000001'), 0::bigint,
          'consumer solo ve sus avisos');

-- ── Merchant cadena 1 ──
select pg_temp.act_as('a0000000-0000-0000-0000-000000000002');
select is((select count(*) from public.redemption_codes where chain_id <> 'c0000000-0000-0000-0000-000000000001'), 0::bigint,
          'merchant solo ve códigos de su cadena');
select is((select count(*) from public.promotion_events e join public.promotions p on p.id = e.promotion_id
           where p.chain_id <> 'c0000000-0000-0000-0000-000000000001'), 0::bigint,
          'merchant solo ve eventos de su cadena');
select is((select count(*) from public.promotions where status = 'borrador'), 0::bigint,
          'merchant no ve borradores de otras cadenas');
select throws_ok($$ insert into public.promotions (chain_id, title, type, value, ends_at)
                    values ('c0000000-0000-0000-0000-000000000002', 'Promo ajena', 'porcentaje', 50, now() + interval '1 day') $$,
                 '42501', null, 'merchant no puede crear promos en otra cadena');
with u as (
  update public.promotions set title = 'Hackeada' where chain_id = 'c0000000-0000-0000-0000-000000000002' returning 1
) select is((select count(*) from u), 0::bigint, 'merchant no puede editar promos de otra cadena');
select is((select count(*) from public.merchant_settings), 1::bigint, 'merchant solo ve su tarifa');

-- ── Merchant cadena 3 ve su borrador ──
select pg_temp.act_as('a0000000-0000-0000-0000-000000000004');
select is((select count(*) from public.promotions where status = 'borrador'), 1::bigint, 'merchant ve sus propios borradores');

select * from finish();
rollback;
