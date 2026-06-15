-- ============================================================
-- ArqFlow — Clinic completeness (consultation_requests, follow_ups)
-- Additive only. Idempotent. Backs the remaining clinic modules.
-- (Waiting Queue is a filtered view over `appointments` — no table.)
-- ============================================================

-- ---------- consultation_requests ----------
-- Used by clinic / medical center / lawyer (intake before a booked appointment).
create table if not exists public.consultation_requests (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  customer_id   uuid references public.customers(id) on delete set null,
  patient_id    uuid references public.patients(id) on delete set null,
  doctor_id     uuid references public.doctors(id) on delete set null,
  name          text,
  phone         text,
  subject       text,
  details       text,
  preferred_at  timestamptz,
  status        text not null default 'new',     -- new|in_review|scheduled|closed
  source        text not null default 'whatsapp',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.consultation_requests enable row level security;
drop policy if exists "consultation_requests_owner_all" on public.consultation_requests;
create policy "consultation_requests_owner_all" on public.consultation_requests for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists consultation_requests_business_id_idx on public.consultation_requests(business_id);
create index if not exists consultation_requests_business_status_idx on public.consultation_requests(business_id, status);
drop trigger if exists touch_consultation_requests on public.consultation_requests;
create trigger touch_consultation_requests before update on public.consultation_requests
  for each row execute function public.touch_updated_at();

-- ---------- follow_ups ----------
create table if not exists public.follow_ups (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  patient_id     uuid references public.patients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  doctor_id      uuid references public.doctors(id) on delete set null,
  due_date       date not null,
  reason         text,
  status         text not null default 'pending', -- pending|done|cancelled
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.follow_ups enable row level security;
drop policy if exists "follow_ups_owner_all" on public.follow_ups;
create policy "follow_ups_owner_all" on public.follow_ups for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists follow_ups_business_id_idx on public.follow_ups(business_id);
create index if not exists follow_ups_business_due_idx on public.follow_ups(business_id, due_date);
drop trigger if exists touch_follow_ups on public.follow_ups;
create trigger touch_follow_ups before update on public.follow_ups
  for each row execute function public.touch_updated_at();
