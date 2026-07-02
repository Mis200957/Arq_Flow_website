-- SECURITY (applied to live project 2026-07-02): billing RPCs must only be
-- callable by service_role (platform admin client + n8n). Previously
-- anon/authenticated could top up wallets or mutate usage counters via
-- /rest/v1/rpc/* — a direct billing bypass.
REVOKE EXECUTE ON FUNCTION public.wallet_topup(uuid, numeric, numeric, date) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_usage(uuid, integer, integer, numeric) FROM anon, authenticated, PUBLIC;
-- wallet_status leaks billing data for arbitrary business_ids → service_role only.
REVOKE EXECUTE ON FUNCTION public.wallet_status(uuid) FROM anon, authenticated, PUBLIC;
-- is_admin / owns_business stay executable by authenticated (used in RLS
-- policies) but not by anon.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_business(uuid) FROM anon;

-- Harden mutable search_path trigger functions.
ALTER FUNCTION public.update_coupon_used_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_customer_total_spent() SET search_path = public, pg_temp;
