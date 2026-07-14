-- New provisioning-flow statuses (applied to live project 2026-07-02):
--   qr_pending       → bot workflow + Evolution instance created, awaiting WhatsApp link
--   under_review     → WhatsApp connected, internal checks before admin final confirmation
--   provision_failed → Bot Factory reported a failure (admin retries)
ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'qr_pending' AFTER 'provisioning';
ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'under_review' AFTER 'qr_pending';
ALTER TYPE public.business_status ADD VALUE IF NOT EXISTS 'provision_failed' AFTER 'under_review';
