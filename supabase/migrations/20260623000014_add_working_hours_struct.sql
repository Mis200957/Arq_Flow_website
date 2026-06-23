-- Structured working hours captured by the onboarding "working hours" picker.
--
-- The serialized, human-readable schedule still lives in businesses.working_hours
-- (a text column) and that is exactly what the n8n provisioning webhook receives
-- — so the webhook payload / bot behaviour is unchanged.
--
-- This JSON column gives the booking workflows (SHARED_GET_AVAILABLE_SLOTS /
-- SHARED_BOOK_APPOINTMENT) a clean, machine-readable source to compute the
-- available appointment slots instead of parsing free text.
--
-- Shape: { "always": boolean, "open": "HH:MM", "close": "HH:MM", "days": ["sat","sun",...] }

alter table public.businesses
  add column if not exists working_hours_struct jsonb;
