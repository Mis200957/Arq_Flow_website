-- Remove message-count entirely. ArqFlow billing is a pure EGP token-wallet
-- model (see docs/PAYMENTS.md): the bot replies until the real token budget
-- (balance_egp) runs out or the validity (period_end) passes. There is no
-- per-message quota, so message_limit / messages_used are dropped everywhere.

-- 1) Clean the wallet functions so they no longer touch message columns.

CREATE OR REPLACE FUNCTION public.increment_usage(b_id uuid, in_tokens integer, out_tokens integer, msg_cost numeric)
 RETURNS TABLE(allowed boolean, balance_egp numeric, cost_egp numeric, remaining_egp numeric, wallet_egp numeric, remaining_display_egp numeric, expires_on date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE cid uuid; bal numeric; cst numeric; wal numeric; pend date;
BEGIN
  SELECT u.id, u.balance_egp, u.cost_egp, u.wallet_egp, u.period_end
    INTO cid, bal, cst, wal, pend
  FROM usage_counters u WHERE u.business_id = b_id ORDER BY u.period_start DESC LIMIT 1;

  IF cid IS NULL THEN
    RETURN QUERY SELECT false, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, NULL::date;
    RETURN;
  END IF;

  UPDATE usage_counters u SET
    total_tokens = u.total_tokens + COALESCE(in_tokens,0) + COALESCE(out_tokens,0),
    cost_egp     = u.cost_egp + COALESCE(msg_cost,0),
    updated_at   = now()
  WHERE u.id = cid
  RETURNING u.balance_egp, u.cost_egp, u.wallet_egp, u.period_end
    INTO bal, cst, wal, pend;

  RETURN QUERY SELECT
    (cst < bal AND pend >= current_date),
    bal, cst,
    GREATEST(bal - cst, 0),
    wal,
    CASE WHEN bal > 0 THEN GREATEST(wal * (1 - cst/bal), 0) ELSE 0 END,
    pend;
END;
$function$;

DROP FUNCTION IF EXISTS public.wallet_topup(uuid, numeric, numeric, date, integer);

CREATE OR REPLACE FUNCTION public.wallet_topup(b_id uuid, add_budget numeric, add_wallet numeric, new_end date)
 RETURNS TABLE(balance_egp numeric, wallet_egp numeric, period_start date, period_end date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE c record; carry_budget numeric := 0; carry_wallet numeric := 0; today date := current_date;
BEGIN
  SELECT * INTO c FROM usage_counters WHERE business_id = b_id ORDER BY period_start DESC LIMIT 1;

  IF c.id IS NOT NULL AND c.period_start = today THEN
    UPDATE usage_counters u SET
      balance_egp = u.balance_egp + add_budget,
      wallet_egp  = u.wallet_egp + add_wallet,
      period_end  = GREATEST(u.period_end, new_end),
      updated_at  = now()
    WHERE u.id = c.id
    RETURNING u.balance_egp, u.wallet_egp, u.period_start, u.period_end
      INTO balance_egp, wallet_egp, period_start, period_end;
    RETURN NEXT; RETURN;
  END IF;

  IF c.id IS NOT NULL AND c.period_end >= today AND c.balance_egp > 0 THEN
    carry_budget := GREATEST(c.balance_egp - c.cost_egp, 0);
    carry_wallet := GREATEST(c.wallet_egp * (1 - c.cost_egp / c.balance_egp), 0);
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

-- 2) Drop the message-count columns.
alter table public.plans          drop column if exists message_limit;
alter table public.usage_counters drop column if exists message_limit;
alter table public.usage_counters drop column if exists messages_used;
