# ArqFlow n8n — Production Checklist

Follow this top to bottom to bring the entire automation layer live. Everything
needed is here. Companion: `DEPLOYMENT_PACKAGE.md` (file inventory + import order + wiring).

---

## A. Credentials to create in n8n (Settings → Credentials)

Create these **once**, with these exact names (workflows match by name):

| Credential type | Name (exact) | Holds |
|-----------------|--------------|-------|
| Supabase API (`supabaseApi`) | `Supabase service_role` | Project URL + **service_role** key — used by every DB node |
| Evolution (`evolutionApi`) | `Evolution account` | Evolution base URL + API key — used by all WhatsApp send nodes |
| Header Auth (`httpHeaderAuth`) | `Evolution apikey` | name=`apikey`, value=Evolution key — factory instance create/webhook |
| Header Auth (`httpHeaderAuth`) | `n8n API` | name=`X-N8N-API-KEY`, value=n8n API key — factory clones/activates workflows |
| OpenRouter (`openRouterApi`) | `OpenRouter account` | OpenRouter API key — tenant bot model + summarize |
| Header Auth (`httpHeaderAuth`) | `Resend account` | name=`Authorization`, value=`Bearer <RESEND_API_KEY>` — `SHARED_SEND_EMAIL_v1` |

After import, open each HTTP/send node once and confirm the credential is selected.

> The first 5 already exist if the v6 set was running before. **`Resend account` is new** —
> required for the email channel; without it, email notifications fail (WhatsApp still works).

---

## B. Hardcoded service URLs (already baked into the workflows — verify they match prod)

- Supabase: `https://zjathejcdkpxjyvululp.supabase.co`
- Evolution: `https://evo.mis.rooyai.com`
- n8n base: `https://bc1b1373.kube-ops.com`

If any of these change, search-and-replace across `v6/*.json` before importing.

---

## C. Platform environment variables (Vercel / `.env`)

Already present in `.env.local` ✅ — confirm the same are set in Vercel:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`N8N_FACTORY_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_SUPPORT_WHATSAPP`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_IDS`,
`TELEGRAM_WEBHOOK_SECRET`.

- `N8N_FACTORY_WEBHOOK_URL` must equal **`https://bc1b1373.kube-ops.com/webhook/arqflow_factory_v6`**.
- `N8N_WEBHOOK_SECRET` must equal the factory `FACTORY_CONFIG.hmac_secret` (step E).
- `NEXT_PUBLIC_APP_URL` is used to build the callback URL `…/api/n8n/callback`.
- No Resend env var on the platform — the Resend key lives only in the n8n credential (B).

---

## D. Import + wire (do this in `DEPLOYMENT_PACKAGE.md` §3 order)

1. Import all 29 workflows from `n8n/v6/`.
2. Set every `SET_SHARED_*_ID` placeholder per the wiring map (`DEPLOYMENT_PACKAGE.md` §5) —
   17 distinct ids across the tenant template, the 4 dependent shared workflows, and the router.
3. **Verify zero placeholders remain:** search the imported workflows for `SET_SHARED` — there
   must be none left.

---

## E. Factory configuration (`FACTORY_CONFIG` node in `Bot_Factory_v6_Supabase`)

Open the `FACTORY_CONFIG` Code node and set 4 values:
- `hmac_secret` = the platform `N8N_WEBHOOK_SECRET` (must match exactly).
- `template_starter` = `template_business` = `template_enterprise` = the **workflow id of
  `TENANT_BOT_TEMPLATE_v6`** (one id is fine for all three tiers; industry/plan differences are
  applied at injection time).

---

## F. Webhooks

| Webhook | URL | Notes |
|---------|-----|-------|
| Factory intake | `https://bc1b1373.kube-ops.com/webhook/arqflow_factory_v6` | Platform posts here on payment approval (HMAC `X-ArqFlow-Signature`). |
| Platform callback | `{NEXT_PUBLIC_APP_URL}/api/n8n/callback` | Factory posts provisioning result here (HMAC, same secret). |
| Tenant bot | injected as `bot-<order-slug>` per clone | Evolution instance webhook points here; do not set manually. |

HMAC contract (both directions): `X-ArqFlow-Signature = hex(hmac_sha256(JSON.stringify(body), N8N_WEBHOOK_SECRET))`.

---

## G. Cron / scheduled jobs

- **`AUTOMATION_ROUTER`** — built-in Schedule trigger, every 1 minute. **Activate it** (step H).
  This is what drains `automation_logs` (prompt regen, KB rebuild, document processing,
  WhatsApp/email notifications, usage-threshold sends).
- **Not included (known gap, platform-side):** a periodic job to (1) evaluate usage thresholds for
  businesses that don't open the Usage page, and (2) reset `usage_counters` per billing period /
  send renewal reminders. Add these as platform scheduled tasks hitting
  `POST /api/dashboard/usage/check` and a billing-cycle endpoint. (Out of this cleanup's scope.)

---

## H. Activation steps

1. **Activate `Bot_Factory_v6_Supabase`** (webhook goes live).
2. **Activate `AUTOMATION_ROUTER`** (cron starts draining `automation_logs`).
3. Do **NOT** activate `TENANT_BOT_TEMPLATE_v6` (template only — the factory clones + activates it).
4. Do **NOT** activate the `SHARED_*` workflows (they run on demand via Execute Workflow).
5. Per-tenant bots are created **and activated automatically** by the factory on each approval.

---

## I. Smoke tests (run after activation)

1. **Router alive:** there are unprocessed rows in `automation_logs` (`processed_at is null`).
   After activation they should drain to `processed_at` set within ~1 min.
2. **Notifications:** trigger an AI action in the dashboard (e.g. Regenerate Prompt) →
   `automation_logs` row appears → router runs `GENERATE_PROMPT` → `businesses.system_prompt`
   updates → client notification appears.
3. **Email:** confirm `SHARED_SEND_EMAIL_v1` succeeds with the `Resend account` credential.
4. **Provisioning:** approve a test payment → factory webhook fires → new `🤖 Arq | …` workflow
   is created + activated → `provision_complete` callback hits the platform → business goes active.
5. **WhatsApp:** scan the QR for the test instance → send a message → bot replies → a row appears
   in `messages` and usage increments.

---

## J. Secrets summary (keep out of source control)

- `N8N_WEBHOOK_SECRET` / `FACTORY_CONFIG.hmac_secret` (must match).
- Supabase service_role key, Evolution API key, OpenRouter key, Resend key, n8n API key —
  all stored only in n8n credentials, not in the repo. Restrict n8n instance access; the HMAC
  secret is inline in `FACTORY_CONFIG`, so anyone with n8n editor access can read it.

---

## K. Post-deploy operational must-dos (not code)

- Confirm a **green Vercel production build** of the platform.
- Enable **Supabase PITR / backups**.
- **Snapshot the n8n instance** and write a restore runbook — all tenant bots live inside n8n;
  it is currently a single point of failure.
- Add **external monitoring/alerting** (n8n execution-failure alerts, uptime on Evolution/n8n/the
  callback endpoint, error tracking on the Next app).
