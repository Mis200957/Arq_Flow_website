# ArqFlow n8n Automation Architecture

This document covers the n8n automation layer: the Bot Factory v6, all shared sub-workflows, security model, and migration notes from the legacy Airtable/Google Sheets system.

---

## System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQFLOW PLATFORM (Next.js)                      │
│                                                                        │
│  /api/onboarding          /api/admin/payments/:id/approve              │
│       │                              │                                 │
│       ▼                              ▼                                 │
│  Supabase DB              HMAC-sign payload                            │
│  (businesses,             POST → n8n Bot Factory v6                    │
│   payments,                          │                                 │
│   profiles)                          │  X-ArqFlow-Signature            │
│                                      │                                 │
└──────────────────────────────────────┼────────────────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │         n8n Bot Factory v6               │
                    │    (bc1b1373.kube-ops.com)               │
                    │                                          │
                    │  1. ValidateSignature (HMAC check)       │
                    │  2. SelectTemplate (plan routing)        │
                    │  3. BuildSystemPrompt (inline)           │
                    │  4. InjectionEngine (placeholders)       │
                    │  5. FetchTemplateJSON (n8n API GET)      │
                    │  6. ApplyReplacements (deep replace)     │
                    │  7. CreateWorkflow (n8n API POST)        │
                    │  8. ActivateWorkflow                     │
                    │  9. CreateEvolutionInstance              │
                    │ 10. ConfigureEvolutionWebhook            │
                    │ 11. UpdateSupabaseStatus (REST PATCH)    │
                    │ 12. UpsertInstance (REST POST)           │
                    │ 13. BuildCallbackPayload (HMAC-sign)     │
                    │ 14. CallbackSuccess → /api/n8n/callback  │
                    │                                          │
                    │  ErrorHandler → CallbackFailed           │
                    └──────────────────┬──────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────┐
   │  Evolution API   │   │  Supabase DB     │   │  /api/n8n/callback   │
   │  WhatsApp inst.  │   │  businesses +    │   │  → sets status=active│
   │  + webhook cfg   │   │  instances tbl   │   │  → notifies client   │
   └────────┬─────────┘   └──────────────────┘   └──────────────────────┘
            │
            │  WhatsApp messages arrive at cloned bot webhook
            ▼
   ┌──────────────────────────────────────────────┐
   │           CLONED TENANT BOT WORKFLOW          │
   │                                              │
   │  WEBHOOK_TRIGGER → TENANT_CONFIG (injected)  │
   │       │                                      │
   │       ├──▶ SHARED_CALCULATE_COST_v2          │
   │       ├──▶ SHARED_LOG_CONVERSATION_v2        │
   │       ├──▶ SHARED_ESCALATION_v2 (on trigger) │
   │       └──▶ SHARED_SAVE_TRANSACTION_v2        │
   │                       │                      │
   │               AI Agent (OpenRouter)           │
   │               → sends reply via Evo API      │
   └──────────────────────────────────────────────┘
```

---

## Bot Factory v6 — Step by Step

The factory receives a POST from `/api/admin/payments/:id/approve`. Every step is a distinct n8n node.

### Step 1 — FACTORY_WEBHOOK
- Webhook path: `/webhook/arqflow_factory_v6`
- Method: POST
- Responds with 202 immediately (via RespondAck + WebhookRespond202 branches)

### Step 2 — ValidateSignature
- Code node (JavaScript)
- Reads `X-ArqFlow-Signature` from headers
- Computes `HMAC-SHA256(rawBody, ARQFLOW_HMAC_SECRET)`
- Performs timing-safe comparison
- Validates required fields: `event`, `business_id`, `order_id`, `plan_id`, `business`, `callback_url`
- Throws on mismatch → triggers ErrorHandler

### Step 3 — SelectTemplate
- Maps `plan_id` → master template workflow ID (set via n8n env vars)
- Merges plan config (model, fallback_model, max_tokens, memory_window, message_limit, tools)
- Plan overrides in the payload take precedence over static config

### Step 4 — BuildSystemPrompt
- Inline Code node — no external API call required
- Assembles Arabic/English system prompt from business data
- Includes: products list, services list, FAQs, working hours, location, payment methods, policy
- Applies tone_of_voice and fallback_behavior rules

### Step 5 — InjectionEngine
- Defines all `__PLACEHOLDER__` keys and their resolved values
- Computes `instance_name = arq-{order_id.toLowerCase()}`
- Computes `webhook_path = bot-{order_id.toLowerCase()}`

### Step 6 — FetchTemplateJSON
- GET `{N8N_BASE_URL}/api/v1/workflows/{template_workflow_id}`
- Uses n8n API key

### Step 7 — ApplyReplacements
- Deep JSON string replacement (all keys/values/nested strings)
- Strips read-only fields (`id`, `createdAt`, `updatedAt`, `versionId`, `active`)
- Renames workflow to `🤖 Arq | {business_name} ({order_id})`
- Prepends a `TENANT_CONFIG` Set node with all tenant data

### Step 8 — CreateWorkflow
- POST `{N8N_BASE_URL}/api/v1/workflows`
- Body: the patched workflow JSON

### Step 9 — ActivateWorkflow
- POST `{N8N_BASE_URL}/api/v1/workflows/{new_id}/activate`

### Step 10 — ExtractWorkflowMeta
- Builds `botWebhookUrl = {N8N_BASE_URL}/webhook/{webhook_path}`

### Step 11 — CreateEvolutionInstance
- POST `https://evo.mis.rooyai.com/manager/instance/create`
- Instance name = `arq-{order_id}`
- Integration: `WHATSAPP-BAILEYS`

### Step 12 — ConfigureEvolutionWebhook
- POST `https://evo.mis.rooyai.com/webhook/set/{instance_name}`
- Sets webhook URL to the new bot's n8n webhook
- Events: `MESSAGES_UPSERT` only

### Step 13 — UpdateSupabaseStatus + UpsertInstance
- PATCH `businesses` → `status = provisioning`, sets `workflow_id`, `instance_name`, `webhook_path`, `system_prompt`
- POST `instances` (upsert) with `evolution_status = created`

### Step 14 — BuildCallbackPayload + CallbackSuccess
- Builds `provision_complete` payload
- Signs with HMAC
- POST to `callback_url` (`/api/n8n/callback`)

### Error Path — ErrorHandler → CallbackFailed
- Activated via n8n's error workflow setting
- Recovers `business_id` and `callback_url` from `ValidateSignature` output
- Sends `provision_failed` callback with error message
- Logs to Supabase `automation_logs`

---

## Shared Sub-Workflows

All shared workflows use `executeWorkflowTrigger` as the entry node and return a result object. They are called via the n8n **Execute Workflow** node inside tenant bot workflows.

---

### SHARED_LOG_CONVERSATION_v2

**Purpose:** Log every AI conversation turn to Supabase.

**Trigger input:**
```json
{
  "tenant": { "business_id": "uuid", "order_id": "...", "plan_id": "..." },
  "customer_id": "201234567890",
  "customer_name": "محمد",
  "customer_message": "...",
  "ai_response": "...",
  "intent": "general",
  "sentiment_score": 0,
  "escalated": false,
  "input_tokens": 1200,
  "output_tokens": 50,
  "cost_egp": 0.18,
  "model_used": "anthropic/claude-sonnet-4.5"
}
```

**Output:**
```json
{ "success": true, "message_id": "uuid", "conversation_id": "CONV_...", "cost_egp": 0.18 }
```

**Supabase tables touched:**
- `conversations` — upserted by `(business_id, customer_id)`; status set to `escalated` if applicable
- `messages` — one row per turn inserted
- `usage_counters` — incremented via `increment_usage` RPC

**Migration from:** Google Sheets `APPEND_CONVERSATION` node (sheet per tenant)

---

### SHARED_CALCULATE_COST_v2

**Purpose:** Calculate AI token cost and enforce monthly message quota.

**Pricing (USD per 1M tokens, ×49 EGP):**

| Model | Input | Output |
|-------|-------|--------|
| claude-haiku-4.5 | $1.00 | $5.00 |
| claude-sonnet-4.5 | $3.00 | $15.00 |
| claude-opus-4.7 | $15.00 | $75.00 |
| gpt-4o | $2.50 | $10.00 |
| gpt-4o-mini | $0.15 | $0.60 |
| gemini-2.0-flash | $0.10 | $0.40 |

**Plan message limits:**

| Plan | Limit/month |
|------|-------------|
| starter | 5,000 |
| business | 11,000 |
| enterprise | 20,000 |

**Trigger input:**
```json
{
  "tenant": { "business_id": "uuid", "order_id": "...", "plan_id": "business" },
  "customer_id": "201234567890",
  "model": "anthropic/claude-sonnet-4.5",
  "input_tokens": 1200,
  "output_tokens": 350
}
```

**Output:**
```json
{
  "success": true,
  "cost_egp": 0.33,
  "messages_used": 1024,
  "messages_remaining": 9976,
  "limit_exceeded": false,
  "action": "allow"
}
```

When `limit_exceeded = true`, `action = "fallback_model"` — the bot should switch to Haiku automatically rather than stopping.

**Supabase tables touched:**
- `usage_counters` — GET (read current), then POST (new) or RPC `increment_usage` (update)

**Migration from:** Airtable `Customer_Quota` table

---

### SHARED_ESCALATION_v2

**Purpose:** Escalate conversation to human, alert admin via WhatsApp, log escalation.

**Escalation reasons:**
- `customer_request` — customer explicitly asked for human
- `complaint` — negative complaint detected
- `out_of_scope` — question outside bot's knowledge
- `negative_sentiment` — sentiment score below threshold
- `technical_issue` — bot encountered error
- `vip_priority` — tagged VIP customer
- `payment_issue` — payment-related problem
- `order_issue` — order problem

**Trigger input:**
```json
{
  "tenant": {
    "business_id": "uuid",
    "order_id": "...",
    "business_name": "مطعم السدة",
    "instance_name": "arq-cust-260606-001",
    "admin_whatsapp": "201029168056"
  },
  "customer": { "id": "...", "name": "محمد", "phone": "201234567890" },
  "reason": "complaint",
  "customer_message": "...",
  "context_summary": "...",
  "conversation_id": "CONV_..."
}
```

**Output:**
```json
{
  "success": true,
  "escalation_id": "ESC_20260613_12345",
  "customer_reply": "لحظة من فضلك يا فندم ...",
  "reason": "complaint"
}
```

**Supabase tables touched:**
- `escalations` — INSERT new row
- `conversations` — PATCH `status = 'escalated'`

**Evolution API calls:**
- POST `sendText` to `admin_whatsapp` on the business's Evolution instance

**Migration from:** Google Sheets `LOG_ESCALATION` + Telegram notification

---

### SHARED_SAVE_TRANSACTION_v2

**Purpose:** Save a customer order to Supabase and upsert the customer record.

**Trigger input:**
```json
{
  "tenant": { "business_id": "uuid", "order_id": "...", "plan_id": "business" },
  "customer": { "id": "...", "name": "محمد", "phone": "201234567890" },
  "conversation_id": "CONV_...",
  "order_type": "delivery",
  "items": [{ "name": "برجر", "qty": 2, "price": 89 }],
  "total_egp": 178,
  "delivery_address": "شارع الهرم",
  "payment_method": "كاش",
  "notes": "بدون بصل",
  "status": "pending"
}
```

**Output:**
```json
{
  "success": true,
  "order_id": "uuid",
  "order_number": "ORD-20260613-1205-042",
  "total_egp": 178,
  "status": "pending"
}
```

**Supabase tables touched:**
- `orders` — INSERT
- `customers` — UPSERT by `(business_id, phone)`

**Migration from:** Google Sheets `APPEND` to tenant-specific transaction sheet

---

## Webhook Security (HMAC)

All communication between the Next.js platform and n8n is secured with HMAC-SHA256.

### Signing a request (Next.js → n8n)

```typescript
const payload = JSON.stringify(body);
const sig = crypto.createHmac('sha256', process.env.N8N_WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');
// Set header: X-ArqFlow-Signature: {sig}
```

### Verifying in n8n (JavaScript Code node)

```javascript
const crypto = require('crypto');
const raw = JSON.stringify($input.first().json.body);
const secret = $env.ARQFLOW_HMAC_SECRET;
const incoming = $input.first().json.headers['x-arqflow-signature'];
const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');

// Timing-safe comparison
const ok = crypto.timingSafeEqual(
  Buffer.from(incoming, 'hex'),
  Buffer.from(expected, 'hex')
);
if (!ok) throw new Error('Invalid signature');
```

The same secret (`N8N_WEBHOOK_SECRET` / `ARQFLOW_HMAC_SECRET`) must be identical on both sides.

---

## Migration Notes: Airtable/Sheets → Supabase

| Legacy (v5) | New (v6) | Notes |
|-------------|----------|-------|
| Airtable `Clients` table | Supabase `businesses` table | REST API: `PATCH /rest/v1/businesses?id=eq.{id}` |
| Airtable `Customer_Quota` | Supabase `usage_counters` | RPC `increment_usage` for atomic updates |
| Google Sheets (per tenant conv history) | Supabase `messages` + `conversations` tables | Single shared table, filtered by `business_id` (RLS) |
| Google Sheets transactions | Supabase `orders` table | `items` stored as JSONB column |
| Google Sheets escalation log | Supabase `escalations` table | + updates `conversations.status` |
| Airtable Plans table | Supabase `plans` table | Same plan IDs: starter/business/enterprise |
| Telegram admin alerts | WhatsApp via Evolution API | Sends to `tenant.admin_whatsapp` |
| Google Drive folders | Supabase Storage | `business-assets`, `kb-files`, `payment-screenshots` buckets |
| Airtable API credential | Supabase service_role key | n8n env var: `SUPABASE_SERVICE_ROLE_KEY` |

### Breaking changes in v6

1. The factory webhook path changed: `/webhook/ai_workforce_factory_webhook` → `/webhook/arqflow_factory_v6`
2. The factory payload now wraps business fields inside a `business` object (not top-level)
3. `tenant.sheets_id` and `tenant.sheet_conv_history` are no longer used
4. `tenant.telegram_chat_id` is no longer used
5. All tenant data in bot workflows comes from the injected `TENANT_CONFIG` Set node (not Airtable lookup at runtime)

---

## How to Add a New Plan Tier

1. **Supabase:** Insert a row into the `plans` table with the new `id`, pricing, and config
2. **plans.ts:** Add the plan to the `PLANS` array in `src/lib/plans.ts`
3. **Onboarding schema:** Add the new id to the `plan_id` enum in `/api/onboarding/route.ts`
4. **Bot Factory v6 — SelectTemplate node:** Add the new plan to `planConfig` and `templateMap`
5. **n8n Template:** Import and activate a master template workflow for the new plan
6. **n8n env var:** Set `N8N_TEMPLATE_{PLAN_ID_UPPER}_ID` to the new template workflow ID

---

## n8n Credential Checklist

Before going live, verify these are configured in n8n:

| Credential / Env Var | Where to Get | Used By |
|---------------------|-------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | All shared workflows + factory |
| `SUPABASE_URL` | Supabase Dashboard → Settings → API | All HTTP Request nodes |
| `ARQFLOW_HMAC_SECRET` | Must match `N8N_WEBHOOK_SECRET` in `.env.local` | Factory ValidateSignature + CallbackSuccess |
| `EVOLUTION_API_KEY` | Evolution API dashboard | Factory CreateEvolutionInstance, SHARED_ESCALATION |
| `N8N_API_KEY` | n8n Settings → API | Factory CreateWorkflow/ActivateWorkflow nodes |
| `N8N_BASE_URL` | `https://bc1b1373.kube-ops.com` | Factory FetchTemplateJSON, CreateWorkflow |
| `N8N_TEMPLATE_STARTER_ID` | n8n workflow ID after importing Starter template | Factory SelectTemplate |
| `N8N_TEMPLATE_BUSINESS_ID` | n8n workflow ID after importing Business template | Factory SelectTemplate |
| `N8N_TEMPLATE_ENTERPRISE_ID` | n8n workflow ID after importing Enterprise template | Factory SelectTemplate |
| OpenRouter API Key | openrouter.ai/keys | Tenant bot workflows (AI calls) |
