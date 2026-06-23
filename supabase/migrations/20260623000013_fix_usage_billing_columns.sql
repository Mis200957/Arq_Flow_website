-- SUPERSEDED — intentionally a no-op.
--
-- An earlier version of this migration ADDED message-count columns
-- (plans.message_limit, usage_counters.messages_used, usage_counters.message_limit).
-- That was wrong: ArqFlow billing is a pure EGP token-wallet model and message
-- count was deliberately removed. Those columns are dropped and the wallet
-- functions cleaned in 20260623000015_remove_message_count.sql.
--
-- Kept as an empty file only to preserve migration ordering/history.
select 1;
