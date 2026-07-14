# ArqFlow n8n — Production Deployment Package

This is the **single source of truth** for what the production n8n layer contains
and how it is assembled. The directory now holds **exactly one official version of
every workflow** — no legacy, no duplicates, no conversion intermediates.

Pair this with **`PRODUCTION_CHECKLIST.md`** (credentials, env, activation steps).

---

## 1. Final file inventory (everything in `n8n/`)

### Core orchestration — `n8n/v6/`
| File | Role | Trigger | Activate? |
|------|------|---------|-----------|
| `Bot_Factory_v6_Supabase.json` | **Bot Factory** (industry-aware). Provisions a tenant bot from a payment-approval webhook. | Webhook `arqflow_factory_v6` | ✅ **Activate** |
| `TENANT_BOT_TEMPLATE_v6.json` | **Template only.** The master bot the factory clones per tenant (10 tools incl. booking family). | Webhook `__WEBHOOK_PATH__` (injected per clone) | ❌ **Never activate / never trigger directly** |
| `AUTOMATION_ROUTER.json` | **Central router.** Polls `automation_logs` and dispatches background jobs. | Schedule (every 1 min) | ✅ **Activate** |

### Shared workflows — `n8n/v6/SHARED_*.json` (called via Execute Workflow; **do not activate**)
**Messaging / ops core (v2):** `SHARED_CALCULATE_COST_v2`, `SHARED_LOG_CONVERSATION_v2`,
`SHARED_ESCALATION_v2`, `SHARED_SAVE_TRANSACTION_v2`, `SHARED_SEND_LINK_v2`,
`SHARED_SEND_PRESENCE_v2`, `SHARED_AUTO_TAG_CUSTOMER_v2`, `SHARED_SUMMARIZE_CONVERSATION_v2`,
`SHARED_ORDER_TRACK_v2`, `SHARED_ORDER_CANCEL_v2`, `SHARED_ORDER_MODIFY_v2`,
`SHARED_STOCK_CHECK_v2`, `SHARED_REVIEW_GET_v2`, `SHARED_PROMO_SEND_v2`.

**Booking / scheduling (v1):** `SHARED_GET_AVAILABLE_SLOTS_v1`, `SHARED_BOOK_APPOINTMENT_v1`,
`SHARED_CANCEL_APPOINTMENT_v1`, `SHARED_RESCHEDULE_APPOINTMENT_v1`, `SHARED_ROOM_RESERVATION_v1`.

**Notifications (v1):** `SHARED_SEND_REMINDER_v1` (WhatsApp), `SHARED_SEND_EMAIL_v1` (Resend),
`SHARED_NOTIFY_DISPATCH_v1` (fan-out), `SHARED_HUMAN_HANDOFF_v1` (delegates to ESCALATION).

**AI / knowledge (v1):** `SHARED_GENERATE_PROMPT_v1`, `SHARED_REBUILD_KNOWLEDGE_v1`,
`SHARED_PROCESS_DOCUMENT_v1`.

### Documentation — `n8n/`
`DEPLOYMENT_PACKAGE.md` (this), `PRODUCTION_CHECKLIST.md`, `AUTOMATION_TRIGGERS.md`
(platform→n8n event contract), `CAPABILITY_MATRIX.md` (industry→capabilities/tools),
`v6/README_v6.md` (architecture overview).

**Total: 29 workflow JSON + 5 docs.**

---

## 2. Workflow classification (as requested)

- **Must import (all 29 JSON):** every file in `v6/`.
- **Must activate (2):** `Bot_Factory_v6_Supabase`, `AUTOMATION_ROUTER`.
- **Template only — import but never activate (1):** `TENANT_BOT_TEMPLATE_v6` (cloned by the factory; the factory activates each clone automatically).
- **Auto-created at runtime (not a file):** per-tenant bots `🤖 Arq | <business> (<order>)` — produced by the factory; each is activated by the factory's `ACTIVATE_WORKFLOW` node.
- **Never import:** none remain (all legacy removed — see §4).
- **Deprecated:** none remain.

---

## 3. Import order (dependencies first)

Import in this order so each workflow's id exists before the next one references it:

1. **Leaf shared workflows (no sub-deps)** — import all of these first, then copy each one's
   workflow id:
   `SHARED_CALCULATE_COST_v2`, `SHARED_LOG_CONVERSATION_v2`, `SHARED_ESCALATION_v2`,
   `SHARED_SAVE_TRANSACTION_v2`, `SHARED_SEND_LINK_v2`, `SHARED_SEND_PRESENCE_v2`,
   `SHARED_AUTO_TAG_CUSTOMER_v2`, `SHARED_SUMMARIZE_CONVERSATION_v2`, `SHARED_ORDER_TRACK_v2`,
   `SHARED_ORDER_CANCEL_v2`, `SHARED_ORDER_MODIFY_v2`, `SHARED_STOCK_CHECK_v2`,
   `SHARED_REVIEW_GET_v2`, `SHARED_PROMO_SEND_v2`, `SHARED_SEND_REMINDER_v1`,
   `SHARED_SEND_EMAIL_v1`, `SHARED_GET_AVAILABLE_SLOTS_v1`, `SHARED_BOOK_APPOINTMENT_v1`,
   `SHARED_CANCEL_APPOINTMENT_v1`, `SHARED_RESCHEDULE_APPOINTMENT_v1`,
   `SHARED_ROOM_RESERVATION_v1`, `SHARED_GENERATE_PROMPT_v1`.
2. **Dependent shared workflows** — import, then set their `SET_SHARED_*_ID` (see §3 wiring):
   `SHARED_HUMAN_HANDOFF_v1`, `SHARED_NOTIFY_DISPATCH_v1`, `SHARED_REBUILD_KNOWLEDGE_v1`,
   `SHARED_PROCESS_DOCUMENT_v1`.
3. **`TENANT_BOT_TEMPLATE_v6`** — wire its 12 `SET_SHARED_*_ID` placeholders.
4. **`AUTOMATION_ROUTER`** — wire its 4 `SET_SHARED_*_ID` placeholders (in the `CONFIG` node).
5. **`Bot_Factory_v6_Supabase`** — set `FACTORY_CONFIG` (`hmac_secret` + the three
   `template_*` = the `TENANT_BOT_TEMPLATE_v6` workflow id).
6. **Activate** `Bot_Factory_v6_Supabase` and `AUTOMATION_ROUTER`.

---

## 4. Removed in this cleanup (no longer in the repo)

- `🏭 Bot Factory v5 (1).json` — legacy v5 factory.
- `🔧 SHARED_*.json` ×8 — legacy v1 shared workflows (superseded by `v6/SHARED_*_v2`).
- `SHARED_CALCULATE_COST_FIXED.json` — duplicate of `v6/SHARED_CALCULATE_COST_v2`.
- `converted/` (whole folder) — conversion intermediates: `Bot_Factory_v6_from_v5.json`,
  `TEMPLATE_{starter,business,enterprise}_supabase.json`, `README.md`, `INTEGRATION_MAP.md`
  (the plan templates are embedded inside the factory; the standalone copies were duplicates).
- `Bot_Factory_v6_Supabase_industry.json` / `TENANT_BOT_TEMPLATE_v6_industry.json` —
  **consolidated** into the canonical `Bot_Factory_v6_Supabase.json` / `TENANT_BOT_TEMPLATE_v6.json`
  (the industry-aware version is now the one and only version).
- `INDUSTRY_INTEGRATION.md`, `INDUSTRY_UPGRADE_GUIDE.md`, `_bash_writeback_test.txt` —
  obsolete docs / stray temp file (industry is now the baseline; wiring lives in this package).

---

## 5. Sub-workflow wiring map (every `SET_SHARED_*_ID`)

After importing, set each placeholder to the imported workflow's id:

| Placeholder | → Workflow to reference | Used in |
|-------------|------------------------|---------|
| `SET_SHARED_CALCULATE_COST_ID` | `SHARED_CALCULATE_COST_v2` | Tenant template |
| `SET_SHARED_LOG_CONVERSATION_ID` | `SHARED_LOG_CONVERSATION_v2` | Tenant template |
| `SET_SHARED_ESCALATION_ID` | `SHARED_ESCALATION_v2` | Tenant template, `HUMAN_HANDOFF` |
| `SET_SHARED_SAVE_TRANSACTION_ID` | `SHARED_SAVE_TRANSACTION_v2` | Tenant template |
| `SET_SHARED_SEND_LINK_ID` | `SHARED_SEND_LINK_v2` | Tenant template |
| `SET_SHARED_GET_AVAILABLE_SLOTS_ID` | `SHARED_GET_AVAILABLE_SLOTS_v1` | Tenant template |
| `SET_SHARED_BOOK_APPOINTMENT_ID` | `SHARED_BOOK_APPOINTMENT_v1` | Tenant template |
| `SET_SHARED_CANCEL_APPOINTMENT_ID` | `SHARED_CANCEL_APPOINTMENT_v1` | Tenant template |
| `SET_SHARED_RESCHEDULE_APPOINTMENT_ID` | `SHARED_RESCHEDULE_APPOINTMENT_v1` | Tenant template |
| `SET_SHARED_ROOM_RESERVATION_ID` | `SHARED_ROOM_RESERVATION_v1` | Tenant template |
| `SET_SHARED_SEND_REMINDER_ID` | `SHARED_SEND_REMINDER_v1` | Tenant template, `NOTIFY_DISPATCH` |
| `SET_SHARED_HUMAN_HANDOFF_ID` | `SHARED_HUMAN_HANDOFF_v1` | Tenant template |
| `SET_SHARED_SEND_EMAIL_ID` | `SHARED_SEND_EMAIL_v1` | `NOTIFY_DISPATCH` |
| `SET_SHARED_GENERATE_PROMPT_ID` | `SHARED_GENERATE_PROMPT_v1` | `REBUILD_KNOWLEDGE`, `PROCESS_DOCUMENT`, ROUTER |
| `SET_SHARED_NOTIFY_DISPATCH_ID` | `SHARED_NOTIFY_DISPATCH_v1` | ROUTER |
| `SET_SHARED_REBUILD_KNOWLEDGE_ID` | `SHARED_REBUILD_KNOWLEDGE_v1` | ROUTER |
| `SET_SHARED_PROCESS_DOCUMENT_ID` | `SHARED_PROCESS_DOCUMENT_v1` | ROUTER |

> The tenant template also references `SAVE_TRANSACTION`/`SEND_LINK`/etc. The other v2 shared
> workflows (`AUTO_TAG_CUSTOMER`, `SUMMARIZE_CONVERSATION`, `ORDER_*`, `STOCK_CHECK`, `REVIEW_GET`,
> `PROMO_SEND`, `SEND_PRESENCE`) are the **reusable shared library** — not wired into the default
> template, but available to add as agent tools per industry. They are intentionally kept.

---

## 6. The router's event map (intentional no-ops are explicit)

`AUTOMATION_ROUTER` → `CONFIG` maps `automation_logs.workflow` → sub-workflow:
- `notify`, `usage_threshold` → `NOTIFY_DISPATCH`
- `regenerate_system_prompt` → `GENERATE_PROMPT`
- `kb_rebuild`, `ai_retrain` → `REBUILD_KNOWLEDGE`
- `kb_file_process` → `PROCESS_DOCUMENT`
- `subscription_request`, `ai_restart_context`, `bot_config_sync` → **`null` (intentional no-op:**
  handled by in-app admin notification / runtime config; logged + marked processed, no n8n action).

Unmapped/`null` events are marked `processed_at` so they never re-poll — by design, not a bug.
