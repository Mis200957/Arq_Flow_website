-- ============================================================
-- ArqFlow — Service Company / Car Service module.
-- Additive only. Idempotent. (Service catalogue reuses the
-- existing `services` table; this adds operations.)
-- ============================================================

-- ---------- technicians ----------
create table if not exists public.technicians (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  skill        text,
  phone        text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.technicians enable row level security;
drop policy if exists "technicians_owner_all" on public.technicians;
create policy "technicians_owner_all" on public.technicians for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists technicians_business_id_idx on public.technicians(business_id);
drop trigger if exists touch_technicians on public.technicians;
create trigger touch_technicians before update on public.technicians
  for each row execute function public.touch_updated_at();

-- ---------- service_requests ----------
create table if not exists public.service_requests (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  customer_id   uuid references public.customers(id) on delete set null,
  service_id    uuid references public.services(id) on delete set null,
  name          text,
  phone         text,
  details       text,
  preferred_at  timestamptz,
  status        text not null default 'new',   -- new|scheduled|in_progress|done|cancelled
  source        text not null default 'whatsapp',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.service_requests enable row level security;
drop policy if exists "service_requests_owner_all" on public.service_requests;
create policy "service_requests_owner_all" on public.service_requests for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists service_requests_business_id_idx on public.service_requests(business_id);
drop trigger if exists touch_service_requests on public.service_requests;
create trigger touch_service_requests before update on public.service_requests
  for each row execute function public.touch_updated_at();

-- ---------- work_orders ----------
create table if not exists public.work_orders (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  request_id    uuid references public.service_requests(id) on delete set null,
  technician_id uuid references public.technicians(id) on delete set null,
  customer_id   uuid references public.customers(id) on delete set null,
  order_number  text,
  title         text,
  scheduled_at  timestamptz,
  status        text not null default 'open',  -- open|assigned|in_progress|completed|cancelled
  total_egp     numeric,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.work_orders enable row level security;
drop policy if exists "work_orders_owner_all" on public.work_orders;
create policy "work_orders_owner_all" on public.work_orders for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists work_orders_business_id_idx on public.work_orders(business_id);
drop trigger if exists touch_work_orders on public.work_orders;
create trigger touch_work_orders before update on public.work_orders
  for each row execute function public.touch_updated_at();
