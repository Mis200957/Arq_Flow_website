# ArqFlow — Module-Based Multi-Industry Architecture

This document describes the module system that turns ArqFlow from a single fixed
dashboard into a **module-based SaaS platform** where each business sees a
dashboard tailored to its industry. It was added **additively** — no existing
feature, route, table, workflow, or automation was removed or changed.

## The idea in one line

`businesses.business_type` → **industry template** → dashboard modules + AI prompt
+ knowledge-base structure + defaults. Unknown/legacy types fall back to the full
classic dashboard, so existing businesses are 100% unaffected.

## What was added (code)

```
src/lib/modules/
  types.ts        # pure types (no React) — safe everywhere
  registry.ts     # every module (core + industry), icon as string key, "available" flag
  industries.ts   # 15 industry templates: modules, AI intents/tools/KB, defaults, aliases
  index.ts        # resolveModules(business_type) + legacy fallback (backward-compat guarantee)
  icons.ts        # maps icon keys → lucide components (UI layer only)
  ai.ts           # buildIndustryPromptContext() + renderIndustryPromptScaffold() for n8n
```

### Wired into
- **`DashboardShell.tsx`** — sidebar is now `resolveModules(business.business_type)`.
  Modules without a page yet render as a polished, non-navigating **"Soon"** chip
  (never 404s).
- **`overview/OverviewClient.tsx`** — quick actions, the "Orders Today" card, and the
  "Recent Orders" panel are industry-aware.
- **`onboarding/OnboardingWizard.tsx`** — business-type list expanded to 15 industries
  (existing values preserved).
- **`api/onboarding/route.ts`** + **`api/dashboard/regenerate-prompt/route.ts`** — now
  attach the industry AI context to the `automation_logs` payload n8n consumes.

## Core vs dynamic modules

- **Core (every business):** Overview, Conversations, Customers, Analytics, Knowledge
  Base, Broadcasts, WhatsApp, AI Settings, Invoices, Subscription, Files, Settings.
- **Dynamic (per industry):** Orders, Products/Menu, Services (live today) + Appointments,
  Doctors, Patients, Rooms, Reservations, Memberships, Properties, Courses, Cases, Work
  Orders, etc. (scaffolded as "Soon" until their pages ship).

Example — a **clinic** sees: Overview · Conversations · Appointments · Doctors · Patients ·
Medical Services · Consultation Requests · Waiting Queue · Follow-ups · Customers ·
Analytics · Knowledge Base · … (Orders/Products are hidden). A **restaurant** keeps
Orders + Menu exactly as before.

## Backward compatibility (verified)

- `business_type` values with **no template** (`other`, blank, unrecognised free text)
  resolve to the **exact current 15-item navigation**, `matched:false`.
- Existing pages/routes are untouched; hidden modules are simply not linked (data and
  routes still exist).
- The live businesses (2 restaurants, 1 clinic) keep working: restaurants unchanged;
  the clinic gains its industry dashboard without losing any core module or data.

## Database (reviewable migrations — not yet applied)

`supabase/migrations/` contains **additive, idempotent** SQL for the industry tables
(clinic, hotel, gym, real estate, education, law, service) plus optional
`enabled_modules` / `industry_config` columns on `businesses`. Every new table has
`business_id` FK, RLS `using (owns_business(business_id) or is_admin())`, the shared
`touch_updated_at` trigger, and a `business_id` index — matching the existing schema
exactly. Apply `0001` + `0002` to ship the clinic vertical first. See
`supabase/migrations/README.md`.

## How to extend

**Add an industry:** add one entry to `INDUSTRY_TEMPLATES` in `industries.ts`
(`modules`, `ai`, `defaults`) and the value to the onboarding list. Done — sidebar,
overview, and AI context update automatically.

**Ship a module page:** create the page under `src/app/dashboard/<key>/`, then flip
`available: false → true` for that module in `registry.ts`. The "Soon" chip becomes a
real link. Add its TS types by regenerating from Supabase after the migration is applied.

## Verification performed

- Module engine **typechecks clean** (strict mode) against real lucide-react types.
- **22 behavioural assertions pass**: clinic hides commerce + shows medical modules;
  restaurant relabels Products→Menu; e-commerce hides services; aliases + case-insensitive
  matching; and every unknown/legacy/empty type returns the full legacy nav.
- All **8 SQL migrations parse clean** against PostgreSQL's grammar (libpg_query, 181
  statements).

> Note: a full `next build` could not be run inside the sandbox because the Linux
> build mount did not pick up edits to pre-existing files (a tooling sync limitation);
> the authoritative source files are correct. Run `npm run typecheck && npm run build`
> locally to confirm end-to-end before deploy.
