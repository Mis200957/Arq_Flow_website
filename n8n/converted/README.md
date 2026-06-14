# ArqFlow — your v5 factory + 3 templates, converted to Supabase

This is your **own** Bot Factory file (same structure/nodes), converted to Supabase — not a rebuild.
Removed what doesn't work with the new platform; converted the rest.

## Files
- `Bot_Factory_v6_from_v5.json` — your factory, single-phase, Supabase. The 3 templates are
  embedded inside it (LOAD_STARTER/BUSINESS/ENTERPRISE_TEMPLATE) exactly like the original.
- `TEMPLATE_starter_supabase.json` / `_business_` / `_enterprise_` — the same 3 templates as
  standalone files (in case you want to import/inspect them separately).

## What was removed (broken with the new platform)
- **All Telegram** (Notify New Client/Success/Error, the Telegram-confirm trigger). The platform
  now approves payments in the dashboard and POSTs the HMAC webhook → provisioning runs directly
  (single-phase). Admin updates flow back via the `/api/n8n/callback`.
- **All Google Drive** (Create Folder / Copy Sheet / Share file) — no per-tenant sheet anymore.
- **Airtable** (Clients table, idempotency search, the duplicate intake webhook) → replaced by
  Supabase `businesses`.

## What changed (kept your nodes)
Kept verbatim: COMPILE_KNOWLEDGE_BASE, ROUTE_BY_PLAN, AI_PROMPT_BUILDER (+OpenRouter model),
EXTRACT_GENERATED_PROMPT, PICK_TEMPLATE, LOAD_*_TEMPLATE, MERGE_TEMPLATE, INJECTION_ENGINE,
CREATE_CLIENT_WORKFLOW, Activate, Edit Fields, Create Evolution Instance, Get QR Code, Wait1,
Send Welcome/QR/Support.

New/rewritten:
- `FACTORY_CONFIG` — one place to paste the HMAC secret (Code nodes can't read credentials).
- `VALIDATE_INTAKE` — HMAC-SHA256 check of the platform payload (the one you sent).
- `BUILD_RECORD` — maps the webhook payload into the field shape your brain-nodes already expect.
- `PATCH_BUSINESS_PROMPT` / `PATCH_BUSINESS_ACTIVE` / `UPSERT_INSTANCE` — Supabase REST (replace
  Save Prompt / Finalize Airtable).
- `BUILD_CB` + `CALLBACK_SUCCESS` / `BUILD_CB_FAIL` + `CALLBACK_FAILED` — HMAC-signed callback to
  the platform `/api/n8n/callback`.
- `INJECTION_ENGINE` — dropped the Drive sheet id; now injects `business_id` into each cloned bot.

## Templates — Google Sheets → Supabase
In all 3 templates these were converted (everything else kept):
- `FETCH_CUSTOMER` → Supabase `customers` read (+ small map node so downstream code is unchanged).
- `CREATE_CUSTOMER_RECORD` → `customers` upsert (on business_id,phone).
- `FETCH_HISTORY` → `messages` read (+ map to the same keys the agent context uses).
- `UPDATE_CUSTOMER` → `customers` PATCH.
- Agent tools `get_menu` → `products`, `lookup_order_status` → `orders`, `save_preference` →
  `customer_preferences` (all Supabase HTTP tools).
- `CLIENT_CONFIG` gained `business_id` (injected by the factory).

## Before going live (set once)
1. **Credentials** in n8n: `Supabase service_role` (Supabase API credential), your `Evolution account`,
   `OpenRouter account`. The factory's n8n-API node needs an n8n API credential too.
2. **`FACTORY_CONFIG` node** → paste `hmac_secret` (== platform `N8N_WEBHOOK_SECRET`).
3. **`INJECTION_ENGINE` `subWfIds`** and each template's `CLIENT_CONFIG` `wf_*` still hold the OLD
   shared-workflow IDs. Import the Supabase `SHARED_*_v2` workflows (in `../v6/`) and update these
   IDs to the new ones — these are what `log_inquiry / escalate / save_transaction / calculate_cost /
   send_presence / summarize / auto_tag / send_link` call.
4. **Webhook path**: factory listens on `/webhook/arqflow_factory_v6`. Point the platform
   `N8N_FACTORY_WEBHOOK_URL` at it (your captured request still used the old path).

## Validated
JSON valid · all connections resolve · factory-own `$('Node')` refs resolve · `node --check` on
every Code node (factory + all 3 embedded templates) · every embedded template re-parses as a valid
workflow · Supabase inserts/enums/RPCs tested against the live DB in a rolled-back transaction.
