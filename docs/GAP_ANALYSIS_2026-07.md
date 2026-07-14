# ArqFlow — Gap Analysis & Action Plan (July 2026)

> **✅ IMPLEMENTED 2026-07-02.** All items in this report were executed:
> Supabase migrations `20260702000016/17` applied to the live project; platform
> callback/provisioning APIs + staged ProvisioningScreen shipped; Factory 🏭 and
> bot template patched (HMAC, callbacks, CONNECTION_UPDATE relay); new workflows
> added (publish bot after renew, provisioning watchdog, broadcast sender,
> automation router). Remaining **manual** steps live in
> `n8n/final workflows/IMPORT_GUIDE.md` (import + activate workflows, n8n env
> vars, export 3 missing sub-workflows, enable leaked-password protection,
> rotate shared secrets). New flow: `docs/PROVISIONING_FLOW.md`.


Audit scope: `src/` (platform), `n8n/final workflows/` (current), `n8n/v6/` (legacy), live Supabase project `zjathejcdkpxjyvululp`, docs. Every finding below was verified directly against code/DB — not assumed.

---

## 1. Critical — Security (fix in Supabase, today)

### 1.1 `wallet_topup` + `increment_usage` callable by anon/authenticated
Verified via Supabase advisors. Both are `SECURITY DEFINER` and exposed on `/rest/v1/rpc/...` to the `anon` and `authenticated` roles.

**Impact:** any client (or anyone with the public anon key) can top up their own wallet for free or corrupt usage counters. This breaks the entire token-wallet billing model.

**Fix (migration):**
```sql
REVOKE EXECUTE ON FUNCTION public.wallet_topup(uuid, numeric, numeric, date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_usage(uuid, integer, integer, numeric) FROM anon, authenticated;
-- service_role keeps access (n8n + platform admin client use it)
```
Also review `wallet_status`, `owns_business`, `is_admin` — read-only, lower risk, but `wallet_status(anon)` leaks billing data for any business_id.

### 1.2 Factory webhook has NO HMAC validation
`payments.ts` signs the payload (`X-ArqFlow-Signature`), but `Factory 🏭.json` goes Webhook → `Get a row` directly. No signature check node exists. Anyone who discovers the webhook URL can provision bots against any `business_id`.

**Fix (n8n):** add a Code node right after the webhook: recompute `hmac_sha256(rawBody, ARQFLOW_HMAC_SECRET)`, compare with header, stop on mismatch.

### 1.3 Minor
- 2 functions with mutable `search_path` (`update_coupon_used_count`, `update_customer_total_spent`).
- Leaked-password protection disabled in Supabase Auth.

---

## 2. Critical — The provisioning loop never closes (n8n)

The platform and Factory are disconnected at three points:

### 2.1 Webhook URL mismatch
- `.env.local`: `N8N_FACTORY_WEBHOOK_URL = .../webhook/ai_workforce_factory_webhook`
- `Factory 🏭.json` webhook path: `arqflow_factory_webhook_fw`

Unless the live n8n instance has a different version, `approve` posts into a 404. Verify which path is live and align env var ↔ workflow.

### 2.2 Factory never reports back
`approve` sets `businesses.status = 'provisioning'`. The Factory's final `Update a row` only writes `workflow_id`, `instance_name`, `webhook_path` — it never sets `status='active'` / `activated_at`, and it makes **zero** calls to `/api/n8n/callback` (its only HTTP node targets the n8n API itself).

**Result:** every business stays stuck at "provisioning" in the dashboard forever; the client "bot is live" notification (sent by the callback route) never fires. The entire `/api/n8n/callback` route is currently dead code.

**Fix (n8n, Factory):** add at the end an HTTP node → `POST {callback_url}` (already in the payload) with `event: provision_complete`, HMAC-signed with `ARQFLOW_HMAC_SECRET`. Add an Error Workflow / failure branch that posts `provision_failed` — right now any failure is silent.

### 2.3 `instance_status` events have no sender
The callback route handles `instance_status` (connected / disconnected / qr_pending) and the dashboard WhatsApp page reads `instances.evolution_status` — but nothing ever sends these events. WhatsApp connection state shown to clients is permanently stale.

**Fix (n8n):** small workflow listening to Evolution API `CONNECTION_UPDATE` webhook → posts `instance_status` to the callback.

---

## 3. High — Billing enforcement is OFF

- `send notification to admin.json` (usage thresholds + auto-cancellation via `stop bots`) is **`active: false`**. Until activated, clients whose wallet is depleted keep chatting for free.
- The bot template itself does no `wallet_status` pre-check; cost is only recorded post-hoc via `SHARED_CALCULATE_COST_v2 → increment_usage`. Acceptable if the scheduled guard runs — so activate it.
- **Renewal doesn't republish:** `approvePayment` renewal path handles `wasSuspended` on the platform side, but no n8n workflow re-activates (republishes) the client's bot workflow after `stop bots` unpublished it. Suspended clients who pay stay dead.

**Fix (n8n):** activate the notification/guard workflow; build a tiny `restart bot` workflow (mirror of `stop bots`: publish workflow + set status) triggered by a platform call on renewal. **Fix (platform):** call it from the renewal path in `payments.ts`.

---

## 4. High — Unversioned / broken sub-workflow references

`bot template.json` references by instance ID:

| Tool | Cached name | Local backup exists? |
|---|---|---|
| escalate | SHARED_ESCALATION_v2 | ✅ v6 |
| save_transaction | SHARED_SAVE_TRANSACTION_v2 | ✅ v6 |
| book/cancel_appointment | SHARED_*_v1 | ✅ v6 |
| cancel_order | SHARED_ORDER_CANCEL_v2 | ✅ v6 |
| calculate cost | SHARED_CALCULATE_COST_v2 | ✅ v6 |
| coupons | SHARED_FITCH_COUPONS | ❌ not in repo |
| fitch_products | GET AVAILABLE PRODUCTS | ❌ not in repo |
| ??? | **"My workflow 15"** | ❌ not in repo, unnamed |

**Fix:** export the 3 missing workflows from n8n into `n8n/final workflows/`, rename "My workflow 15" to something meaningful, and treat the repo as source of truth. If any ID no longer exists on the instance, the corresponding tool fails silently at runtime.

---

## 5. Medium — Platform feature gaps

- **Broadcasts:** dashboard page exists, `broadcasts` table exists (1 row), but there is no send endpoint and no n8n sender. Split: platform API enqueues (`status='queued'`, audience filter), n8n workflow drains the queue via Evolution API with rate limiting (WhatsApp ban-safe: throttle + jitter).
- **Automation router not deployed:** `usage/check` and `regenerate-prompt` write `automation_logs` events "for n8n to fan out" — but `AUTOMATION_ROUTER.json` only exists in `n8n/v6/`, never in final workflows. Either deploy a slim router (schedule → poll `automation_logs` where `processed=false`) or drop the pattern and call n8n webhooks directly.
- **Files page** is an empty shell (uploads work via `ai/upload`, no list/delete UI).
- **`usage/check` is client-triggered** (runs on dashboard visit). Move the authoritative check to the scheduled n8n guard; keep the endpoint for instant UI feedback only.

---

## 6. Low — Hygiene

- **Docs drift:** README + `docs/AUTOMATION.md` describe the v6 architecture (`Bot_Factory_v6_Supabase.json`, placeholder injection, callback flow). The real system is `Factory 🏭` + TENANT_CONFIG code injection. Rewrite AUTOMATION.md from `FACTORY_INJECT_AND_PRUNE.code.js` (the code node header comment is already accurate documentation).
- `.env.local` contains the live HMAC secret + service keys in the working folder — confirm it's gitignored; rotate if the repo was ever shared.
- Delete `.write_test_5`, stale `tsconfig.tsbuildinfo` from repo.

---

## 7. Where each fix belongs

| # | Fix | Platform | Supabase | n8n |
|---|---|---|---|---|
| 1 | Revoke RPC EXECUTE from anon/authenticated | | ✅ migration | |
| 2 | HMAC validation in Factory | | | ✅ |
| 3 | Align factory webhook URL ↔ env | ✅ env | | ✅ |
| 4 | `provision_complete` / `provision_failed` callbacks | | | ✅ |
| 5 | Evolution `CONNECTION_UPDATE` → `instance_status` | | | ✅ |
| 6 | Activate usage guard + auto-stop | | | ✅ |
| 7 | `restart bot` on renewal | ✅ call it | | ✅ build it |
| 8 | Export missing sub-workflows, rename "My workflow 15" | | | ✅ |
| 9 | Broadcasts: enqueue API + sender workflow | ✅ API | | ✅ sender |
| 10 | Automation router (deploy slim or remove pattern) | ✅ or | | ✅ |
| 11 | Files page CRUD | ✅ | | |
| 12 | Docs rewrite + secret rotation | ✅ | | |

**Execution order:** 1 → (2,3,4 as one Factory session) → 6 → 5 → 7 → 8 → 9 → 10 → 11 → 12.
Items 2–4 are one editing session in n8n (~1 hour) and unblock the whole customer-facing flow.
