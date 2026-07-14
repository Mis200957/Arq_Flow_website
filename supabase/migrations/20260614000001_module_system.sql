-- ============================================================
-- ArqFlow — Module System (base)
-- Additive only. Safe for production. Idempotent.
-- ------------------------------------------------------------
-- Adds optional per-business module configuration. The dashboard
-- resolves modules from businesses.business_type in code; these
-- columns let an admin/business OVERRIDE the template (enable or
-- disable specific modules) without a code change. NULL = use the
-- industry template default (i.e. existing behaviour, unchanged).
-- ============================================================

-- Per-business enabled module overrides, e.g. ["appointments","doctors"]
alter table public.businesses
  add column if not exists enabled_modules jsonb;

-- Free-form industry configuration (feature flags, labels, etc.)
alter table public.businesses
  add column if not exists industry_config jsonb not null default '{}'::jsonb;

comment on column public.businesses.enabled_modules is
  'Optional override of the industry template module list. NULL = derive from business_type.';
comment on column public.businesses.industry_config is
  'Optional per-business industry settings (additive). Defaults to empty object.';
