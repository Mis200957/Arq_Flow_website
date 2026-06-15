-- ============================================================
-- ArqFlow — Lawyer Office module.  Additive only. Idempotent.
-- (Consultations + appointments reuse the clinic `appointments`
--  table; this file adds case management.)
-- ============================================================

-- ---------- case_clients ----------
create table if not exists public.case_clients (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  customer_id  uuid references public.customers(id) on delete set null,
  name         text not null,
  phone        text,
  email        text,
  national_id  text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.case_clients enable row level security;
drop policy if exists "case_clients_owner_all" on public.case_clients;
create policy "case_clients_owner_all" on public.case_clients for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists case_clients_business_id_idx on public.case_clients(business_id);
drop trigger if exists touch_case_clients on public.case_clients;
create trigger touch_case_clients before update on public.case_clients
  for each row execute function public.touch_updated_at();

-- ---------- cases ----------
create table if not exists public.cases (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  client_id     uuid references public.case_clients(id) on delete set null,
  case_number   text,
  title         text not null,
  practice_area text,
  court         text,
  status        text not null default 'open',   -- open|in_progress|won|lost|closed
  next_hearing  timestamptz,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.cases enable row level security;
drop policy if exists "cases_owner_all" on public.cases;
create policy "cases_owner_all" on public.cases for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists cases_business_id_idx on public.cases(business_id);
drop trigger if exists touch_cases on public.cases;
create trigger touch_cases before update on public.cases
  for each row execute function public.touch_updated_at();

-- ---------- case_documents ----------
create table if not exists public.case_documents (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  case_id      uuid references public.cases(id) on delete cascade,
  title        text not null,
  storage_path text,
  bucket       text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.case_documents enable row level security;
drop policy if exists "case_documents_owner_all" on public.case_documents;
create policy "case_documents_owner_all" on public.case_documents for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists case_documents_business_id_idx on public.case_documents(business_id);
drop trigger if exists touch_case_documents on public.case_documents;
create trigger touch_case_documents before update on public.case_documents
  for each row execute function public.touch_updated_at();
