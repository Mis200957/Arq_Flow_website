-- ============================================================
-- ArqFlow — Educational Center module.  Additive only. Idempotent.
-- ============================================================

-- ---------- teachers ----------
create table if not exists public.teachers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  name         text not null,
  subject      text,
  bio          text,
  photo_url    text,
  phone        text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.teachers enable row level security;
drop policy if exists "teachers_owner_all" on public.teachers;
create policy "teachers_owner_all" on public.teachers for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists teachers_business_id_idx on public.teachers(business_id);
drop trigger if exists touch_teachers on public.teachers;
create trigger touch_teachers before update on public.teachers
  for each row execute function public.touch_updated_at();

-- ---------- courses ----------
create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  teacher_id   uuid references public.teachers(id) on delete set null,
  name         text not null,
  description  text,
  level        text,
  price_egp    numeric,
  capacity     integer,
  schedule     text,
  starts_on    date,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.courses enable row level security;
drop policy if exists "courses_owner_all" on public.courses;
create policy "courses_owner_all" on public.courses for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists courses_business_id_idx on public.courses(business_id);
drop trigger if exists touch_courses on public.courses;
create trigger touch_courses before update on public.courses
  for each row execute function public.touch_updated_at();

-- ---------- students ----------
create table if not exists public.students (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  customer_id  uuid references public.customers(id) on delete set null,
  name         text not null,
  phone        text,
  email        text,
  parent_name  text,
  parent_phone text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.students enable row level security;
drop policy if exists "students_owner_all" on public.students;
create policy "students_owner_all" on public.students for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists students_business_id_idx on public.students(business_id);
drop trigger if exists touch_students on public.students;
create trigger touch_students before update on public.students
  for each row execute function public.touch_updated_at();

-- ---------- enrollments (Students <-> Courses, + attendance) ----------
create table if not exists public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  student_id   uuid references public.students(id) on delete cascade,
  course_id    uuid references public.courses(id) on delete cascade,
  status       text not null default 'active',  -- active|completed|dropped
  enrolled_on  date not null default current_date,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.enrollments enable row level security;
drop policy if exists "enrollments_owner_all" on public.enrollments;
create policy "enrollments_owner_all" on public.enrollments for all
  using (owns_business(business_id) or is_admin())
  with check (owns_business(business_id) or is_admin());
create index if not exists enrollments_business_id_idx on public.enrollments(business_id);
drop trigger if exists touch_enrollments on public.enrollments;
create trigger touch_enrollments before update on public.enrollments
  for each row execute function public.touch_updated_at();
