-- Descontala · Schema base
-- Convenciones: todo en public, timestamps en timestamptz, días de la semana 0=domingo … 6=sábado (como JS Date.getDay()).

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ───────────────────────── Enums ─────────────────────────
create type public.user_role    as enum ('consumer', 'merchant', 'admin');
create type public.promo_type   as enum ('porcentaje', '2x1', '3x2', 'segunda_unidad', 'precio_fijo');
create type public.promo_status as enum ('borrador', 'activa', 'pausada');
create type public.code_status  as enum ('active', 'redeemed', 'expired');
create type public.event_type   as enum ('view', 'save', 'click');

-- ───────────────────────── Tablas ─────────────────────────
create table public.chains (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(name) between 2 and 80),
  logo_url    text,
  highlights  text,
  color       text not null default '#16a34a' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          public.user_role not null default 'consumer',
  display_name  text check (length(display_name) <= 80),
  chain_id      uuid references public.chains (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint merchant_has_chain check (role <> 'merchant' or chain_id is not null)
);

create table public.stores (
  id            uuid primary key default gen_random_uuid(),
  chain_id      uuid not null references public.chains (id) on delete cascade,
  name          text not null,
  address       text not null,
  neighborhood  text,
  lat           double precision not null check (lat between -90 and 90),
  lng           double precision not null check (lng between -180 and 180),
  created_at    timestamptz not null default now()
);
create index stores_chain_idx on public.stores (chain_id);

create table public.categories (
  id     uuid primary key default gen_random_uuid(),
  slug   text not null unique,
  name   text not null unique,
  emoji  text not null default '🛒',
  sort   smallint not null default 0
);

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category_id  uuid not null references public.categories (id),
  unit         text not null check (unit in ('kg', 'l', 'ud')),
  brand        text,
  created_at   timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_name_trgm_idx on public.products using gin (lower(name) extensions.gin_trgm_ops);

create table public.store_prices (
  store_id    uuid not null references public.stores (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  price       numeric(8,2) not null check (price > 0),
  updated_at  timestamptz not null default now(),
  primary key (store_id, product_id)
);
create index store_prices_product_idx on public.store_prices (product_id);

create table public.promotions (
  id               uuid primary key default gen_random_uuid(),
  chain_id         uuid not null references public.chains (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  category_id      uuid references public.categories (id) on delete set null,
  title            text not null check (length(title) between 3 and 90),
  description      text check (length(description) <= 500),
  type             public.promo_type not null,
  value            numeric(8,2),
  conditions       text check (length(conditions) <= 300),
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz not null,
  max_redemptions  integer check (max_redemptions > 0),
  status           public.promo_status not null default 'activa',
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint ends_after_start check (ends_at > starts_at),
  constraint value_matches_type check (
    case type
      when 'porcentaje'     then value is not null and value between 1 and 90
      when 'segunda_unidad' then value is not null and value between 1 and 100
      when 'precio_fijo'    then value is not null and value > 0
      else value is null
    end
  )
);
create index promotions_chain_idx on public.promotions (chain_id);
create index promotions_live_idx on public.promotions (status, ends_at);
create index promotions_product_idx on public.promotions (product_id);

create table public.promotion_stores (
  promotion_id  uuid not null references public.promotions (id) on delete cascade,
  store_id      uuid not null references public.stores (id) on delete cascade,
  primary key (promotion_id, store_id)
);
create index promotion_stores_store_idx on public.promotion_stores (store_id);

create table public.promotion_events (
  id            bigint generated always as identity primary key,
  promotion_id  uuid not null references public.promotions (id) on delete cascade,
  user_id       uuid references auth.users (id) on delete set null,
  type          public.event_type not null,
  created_at    timestamptz not null default now()
);
create index promotion_events_promo_idx on public.promotion_events (promotion_id, type, created_at);

create table public.saved_promotions (
  user_id       uuid not null references auth.users (id) on delete cascade,
  promotion_id  uuid not null references public.promotions (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, promotion_id)
);

create table public.redemption_codes (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique check (code ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$'),
  promotion_id       uuid not null references public.promotions (id) on delete cascade,
  chain_id           uuid not null references public.chains (id) on delete cascade,
  user_id            uuid not null references auth.users (id) on delete cascade,
  status             public.code_status not null default 'active',
  created_at         timestamptz not null default now(),
  expires_at         timestamptz not null,
  redeemed_at        timestamptz,
  redeemed_store_id  uuid references public.stores (id) on delete set null,
  redeemed_by        uuid references auth.users (id) on delete set null,
  constraint redeemed_has_data check (status <> 'redeemed' or redeemed_at is not null)
);
-- Como máximo un código activo por usuario y promo.
create unique index redemption_codes_one_active
  on public.redemption_codes (promotion_id, user_id) where status = 'active';
create index redemption_codes_user_idx on public.redemption_codes (user_id, status);
create index redemption_codes_chain_idx on public.redemption_codes (chain_id, status, redeemed_at);

create table public.alert_preferences (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  shopping_day  smallint not null check (shopping_day between 0 and 6),
  radius_km     numeric(4,1) not null default 3 check (radius_km between 0.5 and 30),
  category_ids  uuid[] not null default '{}',
  product_ids   uuid[] not null default '{}',
  updated_at    timestamptz not null default now()
);

create table public.merchant_settings (
  chain_id            uuid primary key references public.chains (id) on delete cascade,
  fee_per_redemption  numeric(6,2) not null default 0.30 check (fee_per_redemption >= 0)
);

-- Rate limiting en BD (funciona igual en Vercel sin servicios externos).
create table public.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (key, window_start)
);

-- ───────────────────────── Triggers ─────────────────────────
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger promotions_touch before update on public.promotions
  for each row execute function public.touch_updated_at();
create trigger alert_preferences_touch before update on public.alert_preferences
  for each row execute function public.touch_updated_at();

-- Perfil automático al registrarse (siempre como consumer).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'consumer', coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
