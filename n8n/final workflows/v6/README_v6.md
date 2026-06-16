# ArqFlow n8n — v6 (Supabase-native, no env vars)

Replaces the legacy v5 set (Airtable + Google Sheets + Telegram) with **Supabase as the
single source of truth**, called over the **PostgREST HTTP API**. **No `$env` variables** —
service URLs are hardcoded and all secrets live in **n8n Credentials** (set up once).

Built & validated against the live project `zjathejcdkpxjyvululp` (schema, enums, unique
constraints, RPCs). The factory→template injection was simulated end-to-end with the real
captured payload (valid JSON + valid JS after placeholder replacement).

---

## Files & import order

Import in this order (the bot template references the SHARED_* ids):

1. `SHARED_SEND_PRESENCE_v2.json` (3)
2. `SHARED_CALCULATE_COST_v2.json` (4)
3. `SHARED_LOG_CONVERSATION_v2.json` (12)
4. `SHARED_ESCALATION_v2.json` (7)
5. `SHARED_SAVE_TRANSACTION_v2.json` (10)
6. `SHARED_SEND_LINK_v2.json` (6)
7. `SHARED_AUTO_TAG_CUSTOMER_v2.json` (7)
8. `SHARED_SUMMARIZE_CONVERSATION_v2.json` (10)
9. `TENANT_BOT_TEMPLATE_v6.json` (16) — the master bot the factory clones per tenant
10. `Bot_Factory_v6_Supabase.json` (23) — the provisioning factory

---

## No env vars — what to configure instead

**Hardcoded URLs (already baked in):**
`https://zjathejcdkpxjyvululp.supabase.co` · `https://evo.mis.rooyai.com` · `https://bc1b1373.kube-ops.com`

**n8n Credentials — create once (Settings → Credentials), match these names:**

| Credential (type) | Name | Holds | Used by |
|---|---|---|---|
| Supabase API (`supabaseApi`) | `Supabase service_role` | host + service_role key | every DB HTTP node (auto-injects `apikey` + `Authorization`) |
| Header Auth (`httpHeaderAuth`) | `Evolution apikey` | name=`apikey`, value=Evolution key | factory CreateInstance / SetWebhook |
| Header Auth (`httpHeaderAuth`) | `n8n API` | name=`X-N8N-API-KEY`, value=n8n key | factory FetchTemplate / CreateWorkflow / Activate |
| Evolution (`evolutionApi`) | `Evolution account` | base url + key | all `messages-api` send nodes |
| OpenRouter (`openRouterApi`) | `OpenRouter account` | OpenRouter key | bot AI model + SUMMARIZE |

After import, open each node once and confirm the credential is selected (n8n matches by name,
but re-confirm to be safe).

**The one thing that can't be a credential — `FACTORY_CONFIG` node** (inside the factory):
HMAC signing happens inside Code nodes, which can't read credentials. Open `FACTORY_CONFIG`
and fill 4 values once:
- `hmac_secret` — must equal the platform's `N8N_WEBHOOK_SECRET`
- `template_starter` / `template_business` / `template_enterprise` — the workflow IDs of the
  imported `TENANT_BOT_TEMPLATE_v6` (import it once per tier, or reuse one id for all three).

**Tenant bot template — wire the sub-workflow ids once:** open `TENANT_BOT_TEMPLATE_v6` and set
the Execute-Workflow / tool nodes (`CALCULATE_COST`, `LOG_CONVERSATION`, `escalate`,
`save_transaction`, `send_link`) to the matching imported SHARED_* workflows
(placeholders: `SET_SHARED_*_ID`).

---

## ⚠️ Webhook path

Your captured production request POSTs to the **legacy** path:
`https://bc1b1373.kube-ops.com/webhook/ai_workforce_factory_webhook`

v6 listens on: `https://bc1b1373.kube-ops.com/webhook/arqflow_factory_v6`

Set the platform env `N8N_FACTORY_WEBHOOK_URL` to the v6 path (recommended), **or** rename the
`FACTORY_WEBHOOK` node path to `ai_workforce_factory_webhook`. Also note `.env.local` is missing
`N8N_FACTORY_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `EVOLUTION_*`, `N8N_*` — add them platform-side.

---

## HMAC contract
Both directions: `X-ArqFlow-Signature = hex(hmac_sha256(JSON.stringify(payload), hmac_secret))`.
`VALIDATE_SIGNATURE` recomputes over `JSON.stringify($json.body)` (timing-safe). Relies on n8n
re-serialising with identical key order/whitespace as the platform (true on V8). If you ever see
mismatches, enable the webhook node's **Raw Body** option and HMAC the raw string.

---

## Factory flow
WEBHOOK → FACTORY_CONFIG → VALIDATE_SIGNATURE → RESPOND_ACK(202) → SELECT_TEMPLATE →
BUILD_SYSTEM_PROMPT → INJECTION_ENGINE → FETCH_TEMPLATE → APPLY_REPLACEMENTS → CREATE_WORKFLOW →
ACTIVATE_WORKFLOW → EXTRACT_META → PROVISION_OK? →
(Evolution instance+webhook → update `businesses` → upsert `instances` → provision_complete callback)
| (provision_failed callback) → automation_logs.

Placeholders the factory deep-replaces in the cloned template: `__WEBHOOK_PATH__`,
`__TENANT_CONFIG_JSON__`, `__BUSINESS_ID__`, `__ORDER_ID__`, `__PLAN_ID__`, `__BUSINESS_NAME__`,
`__INSTANCE_NAME__`, `__ADMIN_WHATSAPP__`, `__MODEL__`, `__FALLBACK_MODEL__`, `__MAX_TOKENS__`,
`__MEMORY_WINDOW__`, `__MESSAGE_LIMIT__`, `__SYSTEM_PROMPT__`.

## Tenant bot template flow
Evolution `MESSAGES_UPSERT` → WEBHOOK_TRIGGER → TENANT_CONFIG (injected) → PARSE_MESSAGE →
VALID? → AI_AGENT (OpenRouter + window memory + tools: escalate/save_transaction/send_link) →
EXTRACT_REPLY → SEND_REPLY (Evolution) → CALCULATE_COST (quota+usage) → LOG_CONVERSATION.
Token counts are estimated from text length; refine if your model returns exact usage.
Audio messages are detected but not transcribed (add a Whisper step if needed).

## Shared workflow contracts
All SHARED_* are called via Execute Workflow and resolve the customer (`customers` upsert on
`business_id,phone`) to the `customer_id` UUID before writing.
- **LOG_CONVERSATION_v2** — inbound+outbound `messages`, get-or-create `conversations`, bump count.
- **CALCULATE_COST_v2** — prices tokens (×49 EGP), `increment_usage` RPC; returns quota + action
  (`allow`|`fallback_model`). **Single usage authority — call once per turn.**
- **ESCALATION_v2** — `escalations` (`reason_code`,`resolved=false`), conversation `status=escalated`,
  WhatsApp admin alert.
- **SAVE_TRANSACTION_v2** — `next_order_number` RPC, inserts `orders`, bumps customer totals,
  WhatsApp confirmation + admin notice. (`payment_method` folded into `notes`.)
- **AUTO_TAG_CUSTOMER_v2** — derives `customers.tags` + `sentiment` from message history.
- **SEND_LINK_v2** — looks up `links` by category/name, sends via Evolution.
- **SEND_PRESENCE_v2** — Evolution typing indicator (no DB).
- **SUMMARIZE_CONVERSATION_v2** — Haiku summary → `customers.conversation_summary`.

## Schema notes (live DB ≠ legacy AUTOMATION.md)
`messages` uses `direction`(inbound/outbound)+`content`+`model`; `customer_id` is the
`customers.id` UUID everywhere; `conversations.id`/`escalations` use UUIDs + `reason_code`/`resolved`;
`orders` has `type`+split `_egp` columns+`order_status` enum (no `payment_method`); `usage_counters`
uses `messages_used`/`message_limit`/`input_tokens`/`output_tokens`/`cost_egp`;
`increment_usage(b_id,in_tokens,out_tokens,msg_cost)` returns `(messages_used, message_limit)`.

## Validation performed
JSON validity · all connection kinds (main/ai_*) resolve · every `$('Node')` ref exists ·
`node --check` on every Code node · factory→template injection simulated with the real payload
(valid JSON + valid JS) · every insert/update/enum/RPC executed against the live DB in a
rolled-back transaction with zero errors.
