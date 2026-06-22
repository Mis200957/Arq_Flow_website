-- ============================================================
-- ArqFlow — Plan capabilities. Additive only, idempotent.
-- ------------------------------------------------------------
-- Adds a per-plan `capabilities` JSONB feature-flag map so the
-- dashboard can gate modules/features by subscription tier
-- (admin-editable from /admin/plans). Backward compatible:
-- when a plan has no flags, app code falls back to tier_level
-- defaults (see src/lib/capabilities.ts).
--
-- Capability keys (all boolean):
--   operational_modules  -> orders/products/services + every industry module
--   broadcasts           -> broadcast / bulk messaging
--   advanced_analytics   -> advanced reports & export
--   voice                -> voice-message understanding
--   image                -> image understanding
--   customer_memory      -> customer-preference memory
--   priority_support     -> priority support routing/badge
-- ============================================================

alter table public.plans
  add column if not exists capabilities jsonb not null default '{}'::jsonb;

-- ---- Backfill the three standard tiers (medium tiering) ----
-- Starter: conversational only — no operational modules, no broadcasts,
-- basic analytics, text-only.
update public.plans set capabilities = jsonb_build_object(
  'operational_modules', false,
  'broadcasts',          false,
  'advanced_analytics',  false,
  'voice',               false,
  'image',               false,
  'customer_memory',     false,
  'priority_support',    false
) where id = 'starter';

-- Business: runs & sells — operational modules, broadcasts, voice, memory.
update public.plans set capabilities = jsonb_build_object(
  'operational_modules', true,
  'broadcasts',          true,
  'advanced_analytics',  false,
  'voice',               true,
  'image',               false,
  'customer_memory',     true,
  'priority_support',    false
) where id = 'business';

-- Enterprise: everything — advanced analytics, image, priority support.
update public.plans set capabilities = jsonb_build_object(
  'operational_modules', true,
  'broadcasts',          true,
  'advanced_analytics',  true,
  'voice',               true,
  'image',               true,
  'customer_memory',     true,
  'priority_support',    true
) where id = 'enterprise';
