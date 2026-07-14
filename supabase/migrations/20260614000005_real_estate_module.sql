-- ============================================================
-- ArqFlow — Real Estate module.  Additive only. Idempotent.
-- ============================================================

-- ---------- agents ----------
create table if not exists public.agents (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  phone        text,
  email        text,
  photo_url    text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.agents enable row level security;
drop policy if exists "agents_owner_all" on public.agents;
create policy "agents_owner_all" on public.agents for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists agents_business_id_idx on public.agents(business_id);
drop trigger if exists touch_agents on public.agents;
create trigger touch_agents before update on public.agents
  for each row execute function public.touch_updated_at();

-- ---------- properties ----------
create table if not exists public.properties (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  agent_id     uuid references public.agents(id) on delete set null,
  title        text not null,
  category     text,                              -- apartment|villa|office|land|...
  purpose      text not null default 'sale',      -- sale|rent
  price_egp    numeric,
  area_sqm     numeric,
  bedrooms     integer,
  bathrooms    integer,
  location     text,
  address      text,
  description  text,
  images       text[] not null default '{}',
  status       text not null default 'available', -- available|reserved|sold|rented
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.properties enable row level security;
drop policy if exists "properties_owner_all" on public.properties;
create policy "properties_owner_all" on public.properties for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists properties_business_id_idx on public.properties(business_id);
drop trigger if exists touch_properties on public.properties;
create trigger touch_properties before update on public.properties
  for each row execute function public.touch_updated_at();

-- ---------- property_requests ----------
create table if not exists public.property_requests (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  customer_id       uuid references public.customers(id) on delete set null,
  assigned_agent_id uuid references public.agents(id) on delete set null,
  name              text,
  phone             text,
  request_type      text not null default 'buy',  -- buy|rent
  budget_egp        numeric,
  preferred_location text,
  details           text,
  status            text not null default 'new',  -- new|in_progress|matched|closed
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.property_requests enable row level security;
drop policy if exists "property_requests_owner_all" on public.property_requests;
create policy "property_requests_owner_all" on public.property_requests for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists property_requests_business_id_idx on public.property_requests(business_id);
drop trigger if exists touch_property_requests on public.property_requests;
create trigger touch_property_requests before update on public.property_requests
  for each row execute function public.touch_updated_at();

-- ---------- property_visits ----------
create table if not exists public.property_visits (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  property_id  uuid references public.properties(id) on delete set null,
  request_id   uuid references public.property_requests(id) on delete set null,
  agent_id     uuid references public.agents(id) on delete set null,
  customer_id  uuid references public.customers(id) on delete set null,
  scheduled_at timestamptz not null,
  status       text not null default 'scheduled', -- scheduled|completed|cancelled
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.property_visits enable row level security;
drop policy if exists "property_visits_owner_all" on public.property_visits;
create policy "property_visits_owner_all" on public.property_visits for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists property_visits_business_id_idx on public.property_visits(business_id);
drop trigger if exists touch_property_visits on public.property_visits;
create trigger touch_property_visits before update on public.property_visits
  for each row execute function public.touch_updated_at();
