# Token-Wallet Billing — How it works & what n8n must do

This replaces the old "monthly message quota" with a **prepaid EGP wallet**.
The customer pays the package price; the bot replies until the wallet's token
budget runs out **or** 30 days pass — whichever comes first.

## The money model

| Package (`plans.monthly_fee_egp`) | Your margin (`margin_egp`) | Token budget (`token_budget_egp`, auto) | Validity |
|---|---|---|---|
| 500 EGP  | 200 | 300  | 30 days |
| 1100 EGP | 350 | 750  | 30 days |
| 1500 EGP | 500 | 1000 | 30 days |

- `token_budget_egp` is a **generated column** = `monthly_fee_egp − margin_egp`. You never set it directly.
- All four numbers (price, margin, validity, setup fee) are editable per plan in **Admin → Plans**.
- The setup fee still applies **once** on the first payment. Renewals/upgrades = package price only.

### Two numbers on each wallet (`usage_counters`)
- `balance_egp` — the **real token budget** (e.g. 300). The bot's real token cost (`cost_egp`) is charged against this. **This is what enforces the cutoff.**
- `wallet_egp` — the **customer-facing** amount (e.g. 500). Used only for display so the customer sees their full package value deplete. Your margin stays invisible to them.
- `cost_egp` — accumulated real token cost in EGP (what you actually pay the AI provider).
- `period_end` — wallet expiry date.

Remaining shown to customer = `wallet_egp × (1 − cost_egp / balance_egp)`.
Bot is allowed to reply when `cost_egp < balance_egp AND period_end >= today AND business is active`.

## What n8n must change (IMPORTANT)

### 1. Pre-check before every reply — `wallet_status(b_id uuid)`
Call this **before** sending the message to the LLM:

```sql
select * from wallet_status('<business_uuid>');
```
Returns: `allowed (bool)`, `balance_egp`, `cost_egp`, `remaining_egp`, `wallet_egp`,
`remaining_display_egp`, `used_pct`, `expires_on`, `biz_status`.

- If `allowed = false` → **do not call the LLM**. Reply with a fixed message like:
  «اشتراكك خلص أو انتهت صلاحيته 🙏 جدّد من اللوحة عشان البوت يكمل شغال» and stop.
- If `allowed = true` → proceed normally.

### 2. Charge after every reply — `increment_usage(b_id, in_tokens, out_tokens, msg_cost)`
This already exists and keeps the **same arguments**, but its **return columns changed**.

```sql
select * from increment_usage('<business_uuid>', <in_tokens>, <out_tokens>, <msg_cost_egp>);
```
- `msg_cost` = the real cost of this message in EGP = `provider_cost_usd × usd_to_egp`
  (`usd_to_egp` is in `app_settings`, editable in Admin → Settings).
- New return columns: `allowed`, `balance_egp`, `cost_egp`, `remaining_egp`, `wallet_egp`, `remaining_display_egp`, `expires_on`.
- ⚠️ If any node still reads the **old** `messages_used` / `message_limit` return, update it to read `allowed` / `remaining_egp` instead.

### 3. Provisioning payload (Bot Factory)
`event: "provision_bot"` now includes inside `plan`:
`package_price_egp`, `token_budget_egp`, `validity_days` (plus the existing model/tools/limits).

### 4. Plan change / renewal sync
On admin approval of a renewal/upgrade, an `automation_logs` row is written:
`workflow: "bot_config_sync"`, `event: "renewal" | "plan_change"`,
`payload: { plan_id, balance_egp, wallet_egp, expires_on, payment_id }`.
Use it to refresh the running bot's model/limits if the plan changed.

## Renewal / upgrade flow (already wired in the platform)
1. Client opens **Dashboard → Subscription**, taps Renew or a plan card.
2. Pays by InstaPay / Vodafone Cash / WE Pay, enters the 12-digit transaction ref, uploads the receipt.
3. A `payments` row is created (`payment_type` = `renewal` or `upgrade`) and the admin is pinged on **Telegram** with Approve/Reject — identical to first-time onboarding.
4. On approval → `wallet_topup()` runs: it **adds** the new budget, **rolls over** any unused balance, and resets validity to 30 days from today.

## DB objects added
- `plans.margin_egp`, `plans.validity_days`, `plans.token_budget_egp` (generated)
- `usage_counters.balance_egp`, `usage_counters.wallet_egp`
- `payment_type` enum values: `renewal`, `topup`
- Functions: `wallet_status(uuid)`, `increment_usage(uuid,int,int,numeric)` (rewritten), `wallet_topup(uuid,numeric,numeric,int,int)`
