-- ============================================================
-- ArqFlow — Automation router watermark. Additive only.
-- Lets AUTOMATION_ROUTER (n8n) poll unprocessed jobs idempotently.
-- ============================================================
alter table public.automation_logs add column if not exists processed_at timestamptz;
create index if not exists automation_logs_unprocessed_idx
  on public.automation_logs (created_at) where processed_at is null;
