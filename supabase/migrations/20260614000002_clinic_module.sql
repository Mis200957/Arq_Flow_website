-- ============================================================
-- ArqFlow — Clinic / Medical Center / Salon module
-- Additive only. Idempotent. RLS mirrors existing tables:
--   using (owns_business(business_id) or is_admin())
-- ============================================================

-- ---------- doctors ----------
create table if not exists public.doctors (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  name          text not null,
  specialty     text,
  bio           text,
  photo_url     text,
  languages     text[] not null default '{}',
  phone         text,
  active        boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.doctors enable row level security;
drop policy if exists "doctors_owner_all" on public.doctors;
create policy "doctors_owner_all" on public.doctors for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists doctors_business_id_idx on public.doctors(business_id);
drop trigger if exists touch_doctors on public.doctors;
create trigger touch_doctors before update on public.doctors
  for each row execute function public.touch_updated_at();

-- ---------- medical_services ----------
create table if not exists public.medical_services (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses(id) on delete cascade,
  name             text not null,
  description      text,
  category         text,
  price_egp        numeric,
  duration_minutes integer,
  active           boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.medical_services enable row level security;
drop policy if exists "medical_services_owner_all" on public.medical_services;
create policy "medical_services_owner_all" on public.medical_services for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists medical_services_business_id_idx on public.medical_services(business_id);
drop trigger if exists touch_medical_services on public.medical_services;
create trigger touch_medical_services before update on public.medical_services
  for each row execute function public.touch_updated_at();

-- ---------- patients ----------
create table if not exists public.patients (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  customer_id   uuid references public.customers(id) on delete set null,
  name          text not null,
  phone         text,
  email         text,
  date_of_birth date,
  gender        text,
  medical_notes text,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.patients enable row level security;
drop policy if exists "patients_owner_all" on public.patients;
create policy "patients_owner_all" on public.patients for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists patients_business_id_idx on public.patients(business_id);
drop trigger if exists touch_patients on public.patients;
create trigger touch_patients before update on public.patients
  for each row execute function public.touch_updated_at();

-- ---------- appointments ----------
-- Generic enough for clinics (doctor + medical service) and salons
-- (treat doctor as the staff member, medical_service as the service).
create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  patient_id    uuid references public.patients(id) on delete set null,
  customer_id   uuid references public.customers(id) on delete set null,
  doctor_id     uuid references public.doctors(id) on delete set null,
  service_id    uuid references public.medical_services(id) on delete set null,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  status        text not null default 'scheduled', -- scheduled|confirmed|completed|cancelled|no_show
  source        text not null default 'whatsapp',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.appointments enable row level security;
drop policy if exists "appointments_owner_all" on public.appointments;
create policy "appointments_owner_all" on public.appointments for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists appointments_business_id_idx on public.appointments(business_id);
create index if not exists appointments_business_starts_idx on public.appointments(business_id, starts_at);
drop trigger if exists touch_appointments on public.appointments;
create trigger touch_appointments before update on public.appointments
  for each row execute function public.touch_updated_at();
