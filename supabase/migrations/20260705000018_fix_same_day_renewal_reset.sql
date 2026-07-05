-- Fix same-day renewal/top-up: reset cost_egp to 0 and roll over only the
-- UNUSED portion of the wallet, instead of blindly adding the full new budget
-- on top of the already-spent counter.
--
-- Bug: wallet_topup() had two branches. The cross-day branch (INSERT) already
-- created a fresh row with cost_egp = 0 and carried over only the unused
-- balance. But the same-day branch (period_start = today) just did
--   balance_egp += add_budget, wallet_egp += add_wallet
-- and left cost_egp untouched. So a customer who consumed their whole wallet
-- (cost_egp = balance_egp) and renewed on the same day the period started ended
-- up with e.g. balance 1500 / wallet 2200 / cost 750 — the UI then showed
-- "1100 of 2200, 50% consumed" right after paying for a fresh wallet.
--
-- Fix: make the same-day branch behave identically to the cross-day branch —
-- reset cost_egp to 0 and set balance/wallet to (new value + unused rollover).
-- total_tokens is left accumulating on purpose: admin analytics sum it per
-- month (src/app/admin/{overview,analytics}), and it is not customer-facing.

CREATE OR REPLACE FUNCTION public.wallet_topup(b_id uuid, add_budget numeric, add_wallet numeric, new_end date)
 RETURNS TABLE(balance_egp numeric, wallet_egp numeric, period_start date, period_end date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE c record; carry_budget numeric := 0; carry_wallet numeric := 0; today date := current_date;
BEGIN
  SELECT * INTO c FROM usage_counters WHERE business_id = b_id ORDER BY period_start DESC LIMIT 1;

  -- Roll over any UNUSED budget/display value from the current wallet, but only
  -- while it is still valid. A fully-consumed or expired wallet carries nothing.
  IF c.id IS NOT NULL AND c.period_end >= today AND c.balance_egp > 0 THEN
    carry_budget := GREATEST(c.balance_egp - c.cost_egp, 0);
    carry_wallet := GREATEST(c.wallet_egp * (1 - c.cost_egp / c.balance_egp), 0);
  END IF;

  -- Same-day renewal/top-up: reuse the existing row instead of inserting a
  -- second one with the same period_start (which would make the "latest row"
  -- lookup ambiguous). Reset the spend so the customer sees a fresh wallet.
  IF c.id IS NOT NULL AND c.period_start = today THEN
    UPDATE usage_counters u SET
      balance_egp = add_budget + carry_budget,
      wallet_egp  = add_wallet + carry_wallet,
      cost_egp    = 0,
      period_end  = GREATEST(u.period_end, new_end),
      updated_at  = now()
    WHERE u.id = c.id
    RETURNING u.balance_egp, u.wallet_egp, u.period_start, u.period_end
      INTO balance_egp, wallet_egp, period_start, period_end;
    RETURN NEXT; RETURN;
  END IF;

  INSERT INTO usage_counters AS u (
    business_id, period_start, period_end, total_tokens, cost_egp, balance_egp, wallet_egp
  ) VALUES (
    b_id, today, new_end, 0, 0, add_budget + carry_budget, add_wallet + carry_wallet
  )
  RETURNING u.balance_egp, u.wallet_egp, u.period_start, u.period_end
    INTO balance_egp, wallet_egp, period_start, period_end;
  RETURN NEXT;
END;
$function$;

-- Preserve the service_role-only lock-down from 20260702000017.
REVOKE EXECUTE ON FUNCTION public.wallet_topup(uuid, numeric, numeric, date) FROM anon, authenticated, PUBLIC;
