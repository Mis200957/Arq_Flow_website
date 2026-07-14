# ArqFlow — Industry Module Migrations

These migrations extend ArqFlow into a **module-based, multi-industry platform**.
They are **additive only** and safe for the live production database
(`zjathejcdkpxjyvululp`).

## Safety guarantees

- **No `DROP TABLE`, no `DROP COLUMN`, no destructive `ALTER`.** Nothing existing
  is removed or rewritten.
- Every statement is **idempotent** (`create table if not exists`,
  `drop policy if exists` → `create policy`, `add column if not exists`), so a file
  can be re-run without error.
- Every new table:
  - has `business_id uuid references public.businesses(id) on delete cascade`,
  - has **RLS enabled** with the exact platform pattern
    `using (owns_business(business_id) or is_admin())`,
  - reuses the existing `public.touch_updated_at()` trigger for `updated_at`,
  - is indexed on `business_id`.
- Existing businesses are unaffected: the dashboard resolves modules from
  `businesses.business_type` in application code, and unknown/legacy types fall
  back to the full classic dashboard (see `src/lib/modules`).

## How to apply (recommended order)

Apply in numeric order. You can apply via the Supabase SQL editor, the Supabase
CLI (`supabase db push`), or the Supabase MCP `apply_migration` tool.

| File | Adds |
|------|------|
| `..._0001_module_system.sql`     | `enabled_modules` + `industry_config` JSONB on `businesses` (per-business overrides; optional) |
| `..._0002_clinic_module.sql`     | `doctors`, `patients`, `medical_services`, `appointments` (clinic / medical center / salon) |
| `..._0003_hotel_module.sql`      | `rooms`, `guests`, `reservations` |
| `..._0004_gym_module.sql`        | `memberships`, `trainers`, `classes`, `class_attendance` |
| `..._0005_real_estate_module.sql`| `agents`, `properties`, `property_requests`, `property_visits` |
| `..._0006_education_module.sql`  | `teachers`, `courses`, `students`, `enrollments` |
| `..._0007_law_module.sql`        | `cases`, `case_clients`, `case_documents` |
| `..._0008_service_module.sql`    | `technicians`, `work_orders`, `service_requests` |

Only `0001` and the modules you actually use are required. For the priority
industries you can apply `0001` + `0002` and ship clinic immediately; restaurant
and e-commerce already work on the existing `orders` / `products` / `services`
tables.

## After applying

Regenerate the TypeScript types so the new tables are typed:

```bash
# via Supabase MCP
generate_typescript_types(project_id="zjathejcdkpxjyvululp")
# or via CLI
supabase gen types typescript --project-id zjathejcdkpxjyvululp > src/lib/database.types.ts
```

The module registry (`src/lib/modules/registry.ts`) already lists each industry
module with `available: false` ("Soon" in the sidebar). When a module's CRUD page
ships, flip its `available` flag to `true` — the sidebar picks it up automatically.
