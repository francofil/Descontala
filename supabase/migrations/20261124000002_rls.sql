-- Descontala · Row Level Security
-- Roles: consumer (por defecto), merchant (gestiona su cadena), admin (todo).

-- ───────────────────────── Helpers ─────────────────────────
create function public.auth_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create function public.auth_chain_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select chain_id from public.profiles where id = (select auth.uid()) and role = 'merchant'
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = (select auth.uid())), false)
$$;

revoke execute on function public.auth_role(), public.auth_chain_id(), public.is_admin() from public, anon;
grant execute on function public.auth_role(), public.auth_chain_id(), public.is_admin() to authenticated;

-- ───────────────────────── Activar RLS en todo ─────────────────────────
alter table public.chains             enable row level security;
alter table public.profiles           enable row level security;
alter table public.stores             enable row level security;
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.store_prices       enable row level security;
alter table public.promotions         enable row level security;
alter table public.promotion_stores   enable row level security;
alter table public.promotion_events   enable row level security;
alter table public.saved_promotions   enable row level security;
alter table public.redemption_codes   enable row level security;
alter table public.alert_preferences  enable row level security;
alter table public.merchant_settings  enable row level security;
alter table public.rate_limits        enable row level security; -- sin políticas: solo funciones definer

-- ───────────────────────── Catálogo público ─────────────────────────
create policy "chains: lectura pública" on public.chains for select using (true);
create policy "chains: admin" on public.chains for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "categories: lectura pública" on public.categories for select using (true);
create policy "categories: admin" on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products: lectura pública" on public.products for select using (true);
create policy "products: admin" on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "stores: lectura pública" on public.stores for select using (true);
create policy "stores: merchant gestiona su cadena" on public.stores for all to authenticated
  using (chain_id = (select public.auth_chain_id()) or (select public.is_admin()))
  with check (chain_id = (select public.auth_chain_id()) or (select public.is_admin()));

create policy "store_prices: lectura pública" on public.store_prices for select using (true);
create policy "store_prices: merchant gestiona su cadena" on public.store_prices for all to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.stores s where s.id = store_id and s.chain_id = (select public.auth_chain_id()))
  )
  with check (
    (select public.is_admin())
    or exists (select 1 from public.stores s where s.id = store_id and s.chain_id = (select public.auth_chain_id()))
  );

-- ───────────────────────── Perfiles ─────────────────────────
create policy "profiles: leo el mío" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: edito el mío" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles: admin" on public.profiles for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
-- Un usuario solo puede cambiar su nombre, nunca su rol ni su cadena.
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

-- ───────────────────────── Promociones ─────────────────────────
create policy "promotions: públicas activas" on public.promotions for select
  using (status = 'activa');
create policy "promotions: merchant ve las suyas" on public.promotions for select to authenticated
  using (chain_id = (select public.auth_chain_id()) or (select public.is_admin()));
create policy "promotions: merchant crea en su cadena" on public.promotions for insert to authenticated
  with check (chain_id = (select public.auth_chain_id()) or (select public.is_admin()));
create policy "promotions: merchant edita las suyas" on public.promotions for update to authenticated
  using (chain_id = (select public.auth_chain_id()) or (select public.is_admin()))
  with check (chain_id = (select public.auth_chain_id()) or (select public.is_admin()));
create policy "promotions: merchant borra las suyas" on public.promotions for delete to authenticated
  using (chain_id = (select public.auth_chain_id()) or (select public.is_admin()));

create policy "promotion_stores: lectura pública" on public.promotion_stores for select using (true);
create policy "promotion_stores: merchant gestiona su cadena" on public.promotion_stores for all to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.promotions p where p.id = promotion_id and p.chain_id = (select public.auth_chain_id()))
  )
  with check (
    (select public.is_admin())
    or (
      exists (select 1 from public.promotions p where p.id = promotion_id and p.chain_id = (select public.auth_chain_id()))
      and exists (select 1 from public.stores s where s.id = store_id and s.chain_id = (select public.auth_chain_id()))
    )
  );

-- Eventos: se insertan solo vía track_event(); el merchant lee los de su cadena.
create policy "promotion_events: merchant lee su cadena" on public.promotion_events for select to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.promotions p where p.id = promotion_id and p.chain_id = (select public.auth_chain_id()))
  );

-- ───────────────────────── Datos del usuario ─────────────────────────
create policy "saved: los míos" on public.saved_promotions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "alerts: las mías" on public.alert_preferences for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Códigos: solo lectura por RLS. Crear y canjear pasa por funciones SQL.
create policy "codes: los míos" on public.redemption_codes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "codes: merchant ve su cadena" on public.redemption_codes for select to authenticated
  using (chain_id = (select public.auth_chain_id()) or (select public.is_admin()));

create policy "merchant_settings: merchant lee la suya" on public.merchant_settings for select to authenticated
  using (chain_id = (select public.auth_chain_id()) or (select public.is_admin()));
create policy "merchant_settings: admin" on public.merchant_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
