-- ============================================================
-- ArqFlow — Hotel module.  Additive only. Idempotent.
-- ============================================================

-- ---------- rooms ----------
create table if not exists public.rooms (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  room_number  text not null,
  room_type    text,
  capacity     integer,
  rate_egp     numeric,
  floor        text,
  status       text not null default 'available', -- available|occupied|cleaning|maintenance
  amenities    text[] not null default '{}',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.rooms enable row level security;
drop policy if exists "rooms_owner_all" on public.rooms;
create policy "rooms_owner_all" on public.rooms for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists rooms_business_id_idx on public.rooms(business_id);
drop trigger if exists touch_rooms on public.rooms;
create trigger touch_rooms before update on public.rooms
  for each row execute function public.touch_updated_at();

-- ---------- guests ----------
create table if not exists public.guests (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  customer_id  uuid references public.customers(id) on delete set null,
  name         text not null,
  phone        text,
  email        text,
  id_number    text,
  nationality  text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.guests enable row level security;
drop policy if exists "guests_owner_all" on public.guests;
create policy "guests_owner_all" on public.guests for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists guests_business_id_idx on public.guests(business_id);
drop trigger if exists touch_guests on public.guests;
create trigger touch_guests before update on public.guests
  for each row execute function public.touch_updated_at();

-- ---------- reservations ----------
create table if not exists public.reservations (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  room_id       uuid references public.rooms(id) on delete set null,
  guest_id      uuid references public.guests(id) on delete set null,
  customer_id   uuid references public.customers(id) on delete set null,
  check_in      date not null,
  check_out     date not null,
  guests_count  integer not null default 1,
  total_egp     numeric,
  status        text not null default 'pending', -- pending|confirmed|checked_in|checked_out|cancelled
  source        text not null default 'whatsapp',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.reservations enable row level security;
drop policy if exists "reservations_owner_all" on public.reservations;
create policy "reservations_owner_all" on public.reservations for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists reservations_business_id_idx on public.reservations(business_id);
create index if not exists reservations_business_checkin_idx on public.reservations(business_id, check_in);
drop trigger if exists touch_reservations on public.reservations;
create trigger touch_reservations before update on public.reservations
  for each row execute function public.touch_updated_at();
