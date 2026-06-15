-- ============================================================
-- ArqFlow — Gym module.  Additive only. Idempotent.
-- ============================================================

-- ---------- trainers ----------
create table if not exists public.trainers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  specialty    text,
  bio          text,
  photo_url    text,
  phone        text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.trainers enable row level security;
drop policy if exists "trainers_owner_all" on public.trainers;
create policy "trainers_owner_all" on public.trainers for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists trainers_business_id_idx on public.trainers(business_id);
drop trigger if exists touch_trainers on public.trainers;
create trigger touch_trainers before update on public.trainers
  for each row execute function public.touch_updated_at();

-- ---------- memberships ----------
create table if not exists public.memberships (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  customer_id  uuid references public.customers(id) on delete set null,
  member_name  text not null,
  phone        text,
  plan_name    text,
  price_egp    numeric,
  starts_on    date,
  ends_on      date,
  status       text not null default 'active', -- active|frozen|expired|cancelled
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.memberships enable row level security;
drop policy if exists "memberships_owner_all" on public.memberships;
create policy "memberships_owner_all" on public.memberships for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists memberships_business_id_idx on public.memberships(business_id);
drop trigger if exists touch_memberships on public.memberships;
create trigger touch_memberships before update on public.memberships
  for each row execute function public.touch_updated_at();

-- ---------- classes ----------
create table if not exists public.classes (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  trainer_id   uuid references public.trainers(id) on delete set null,
  name         text not null,
  description  text,
  capacity     integer,
  starts_at    timestamptz,
  recurring    text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.classes enable row level security;
drop policy if exists "classes_owner_all" on public.classes;
create policy "classes_owner_all" on public.classes for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists classes_business_id_idx on public.classes(business_id);
drop trigger if exists touch_classes on public.classes;
create trigger touch_classes before update on public.classes
  for each row execute function public.touch_updated_at();

-- ---------- class_attendance ----------
create table if not exists public.class_attendance (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete set null,
  class_id      uuid references public.classes(id) on delete set null,
  member_name   text,
  checked_in_at timestamptz not null default now(),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.class_attendance enable row level security;
drop policy if exists "class_attendance_owner_all" on public.class_attendance;
create policy "class_attendance_owner_all" on public.class_attendance for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists class_attendance_business_id_idx on public.class_attendance(business_id);
drop trigger if exists touch_class_attendance on public.class_attendance;
create trigger touch_class_attendance before update on public.class_attendance
  for each row execute function public.touch_updated_at();
