-- ============================================================
-- ArqFlow — Gap-filler tables so every industry module has backing.
-- Additive only. Idempotent. RLS + touch trigger + business_id index.
-- ============================================================

-- ---------- staff (salon / general) ----------
create table if not exists public.staff (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  role         text,
  phone        text,
  email        text,
  photo_url    text,
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.staff enable row level security;
drop policy if exists "staff_owner_all" on public.staff;
create policy "staff_owner_all" on public.staff for all
  using (owns_business(business_id) or is_admin()) with check (owns_business(business_id) or is_admin());
create index if not exists staff_business_id_idx on public.staff(business_id);
drop trigger if exists touch_staff on public.staff;
create trigger touch_staff before update on public.staff for each row execute function public.touch_updated_at();

-- ---------- business_hours (working hours) ----------
create table if not exists public.business_hours (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  day_of_week  integer not null default 0,   -- 0=Sun .. 6=Sat
  opens        text,
  closes       text,
  closed       boolean not null default false,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.business_hours enable row level security;
drop policy if exists "business_hours_owner_all" on public.business_hours;
create policy "business_hours_owner_all" on public.business_hours for all
  using (owns_business(business_id) or is_admin()) with check (owns_business(business_id) or is_admin());
create index if not exists business_hours_business_id_idx on public.business_hours(business_id);
drop trigger if exists touch_business_hours on public.business_hours;
create trigger touch_business_hours before update on public.business_hours for each row execute function public.touch_updated_at();

-- ---------- categories (generic; kind = product|property|service|course|...) ----------
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  kind         text not null default 'product',
  name         text not null,
  description  text,
  sort_order   integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.categories enable row level security;
drop policy if exists "categories_owner_all" on public.categories;
create policy "categories_owner_all" on public.categories for all
  using (owns_business(business_id) or is_admin()) with check (owns_business(business_id) or is_admin());
create index if not exists categories_business_id_idx on public.categories(business_id);
drop trigger if exists touch_categories on public.categories;
create trigger touch_categories before update on public.categories for each row execute function public.touch_updated_at();

-- ---------- coupons ----------
create table if not exists public.coupons (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  code           text not null,
  discount_type  text not null default 'percent',  -- percent|fixed
  discount_value numeric not null default 0,
  active         boolean not null default true,
  expires_at     date,
  usage_limit    integer,
  used_count     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.coupons enable row level security;
drop policy if exists "coupons_owner_all" on public.coupons;
create policy "coupons_owner_all" on public.coupons for all
  using (owns_business(business_id) or is_admin()) with check (owns_business(business_id) or is_admin());
create index if not exists coupons_business_id_idx on public.coupons(business_id);
drop trigger if exists touch_coupons on public.coupons;
create trigger touch_coupons before update on public.coupons for each row execute function public.touch_updated_at();

-- ---------- promotions ----------
create table if not exists public.promotions (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  title         text not null,
  description   text,
  discount_text text,
  starts_on     date,
  ends_on       date,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.promotions enable row level security;
drop policy if exists "promotions_owner_all" on public.promotions;
create policy "promotions_owner_all" on public.promotions for all
  using (owns_business(business_id) or is_admin()) with check (owns_business(business_id) or is_admin());
create index if not exists promotions_business_id_idx on public.promotions(business_id);
drop trigger if exists touch_promotions on public.promotions;
create trigger touch_promotions before update on public.promotions for each row execute function public.touch_updated_at();

-- ---------- delivery_zones ----------
create table if not exists public.delivery_zones (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  fee_egp      numeric not null default 0,
  eta_text     text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.delivery_zones enable row level security;
drop policy if exists "delivery_zones_owner_all" on public.delivery_zones;
create policy "delivery_zones_owner_all" on public.delivery_zones for all
  using (owns_business(business_id) or is_admin()) with check (owns_business(business_id) or is_admin());
create index if not exists delivery_zones_business_id_idx on public.delivery_zones(business_id);
drop trigger if exists touch_delivery_zones on public.delivery_zones;
create trigger touch_delivery_zones before update on public.delivery_zones for each row execute function public.touch_updated_at();

-- ---------- products.stock_qty (for Inventory module) — additive column ----------
alter table public.products add column if not exists stock_qty integer not null default 0;
