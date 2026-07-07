# ArqFlow — Automation Triggers (platform → n8n contract)

The platform raises every background job by inserting a row into
`public.automation_logs`. n8n listens (Supabase trigger / polling on
`automation_logs`) and routes by `workflow`. This is the single, uniform
contract — the dashboard never calls services directly for long-running work.

## Convention
- **Direct DB writes** (CRUD, edit prompt/personality, business info) → written
  straight to Supabase by the app. **No n8n.** Exception: saving the AI-settings
  profile (tone/greeting/personality/goal/languages) also queues a
  `regenerate_system_prompt` job so the bot's live prompt follows the new
  settings (deduped while one is pending).
- **Automation jobs** → one `automation_logs` row `{ business_id, workflow, event,
  level, payload }`. n8n picks it up, does the work, and reports back via the
  existing **`POST /api/n8n/callback`** (HMAC-signed) where state must change.

## Events the platform now emits

| `workflow` | Emitted by | `event` | Payload (key fields) | n8n should… |
|------------|-----------|---------|----------------------|-------------|
| `regenerate_system_prompt` | AI route / AI panel / AI-settings save (auto bot-sync; adds `trigger`, `changed`) | `requested` | `business_type`, `industry` | rebuild the system prompt (AI_PROMPT_BUILDER), PATCH `businesses.system_prompt`, callback |
| `kb_rebuild` | AI panel | `requested` | `industry` | recompile knowledge base from `knowledge_base` + files, refresh embeddings |
| `ai_retrain` | AI panel | `requested` | `industry` | re-process all sources (KB + files + FAQs), regenerate prompt, refresh embeddings |
| `ai_restart_context` | AI panel | `requested` | — | clear the tenant bot's window memory / conversation context |
| `kb_file_process` | AI upload | `uploaded` | `file_id`, `path`, `bucket`, `kind`, `mime_type` | download file, extract text (PDF/Word/OCR images), chunk + embed, add to KB |
| `notify` | notify() helper | `<type>` | `channels[]`, `title`, `body`, `whatsapp`, `email`, `link` | fan out: WhatsApp → `SHARED_SEND_REMINDER`, email → `SHARED_SEND_EMAIL` |
| `usage_threshold` | usage check route | `threshold_75/90/100` | `pct`, `messages_used`, `message_limit`, `channels[]`, `whatsapp`, `email` | send WhatsApp + email alert; optionally offer upgrade |
| `subscription_request` | subscription route | `change_plan/renew/extra_messages/addon/cancel` | `current_plan`, `plan_id`, `pack` | notify ops; on payment approval apply plan/limit change |
| `onboarding` | onboarding route | `submission_received` | `plan`, `business_type`, `industry` | (existing) provisioning intake |
| `usage_threshold`/`broadcast`/… | broadcasts, scheduled | varies | — | reminder & broadcast campaigns via `SHARED_SEND_REMINDER` / send loops |

## Reusable workflows that satisfy these

Already shipped (this project):
`SHARED_SEND_REMINDER_v1` (WhatsApp send), `SHARED_SEND_EMAIL_v1` (email via Resend),
`SHARED_HUMAN_HANDOFF_v1`, `SHARED_BOOK/CANCEL/RESCHEDULE_APPOINTMENT_v1`,
`SHARED_GET_AVAILABLE_SLOTS_v1`, `SHARED_ROOM_RESERVATION_v1`, plus the existing
`SHARED_LOG_CONVERSATION/CALCULATE_COST/ESCALATION/SAVE_TRANSACTION/...`.

### Recommended router (one workflow, build in n8n)
`AUTOMATION_ROUTER`: **Supabase Trigger** on `automation_logs` insert → **Switch** on
`workflow` → call the matching sub-workflow:
- `notify` / `usage_threshold` → if `channels` includes `whatsapp` → `SHARED_SEND_REMINDER`
  (pass `{tenant:{instance_name}, phone: whatsapp, message: title+body}`); if `email` →
  `SHARED_SEND_EMAIL` (`{to: email, subject: title, html: body}`).
- `regenerate_system_prompt` / `kb_rebuild` / `ai_retrain` → reuse the **Bot Factory**'s
  `COMPILE_KNOWLEDGE_BASE` + `AI_PROMPT_BUILDER` nodes, then `PATCH_BUSINESS_PROMPT` +
  HMAC callback.
- `kb_file_process` → download from Storage → extract (PDF/Word/OCR) → embed → upsert KB.
- `ai_restart_context` → clear the tenant bot's memory store.

### Credentials to add (once)
- `Resend account` (Header Auth, `Authorization: Bearer <RESEND_API_KEY>`) for `SHARED_SEND_EMAIL_v1`.
- (existing) `Supabase service_role`, `Evolution account`, `OpenRouter account`.

## Why this design
- **No duplicated logic** — every channel/job is one reusable workflow; routes only
  *emit intent*. New triggers = new `automation_logs` rows, no new plumbing.
- **Backward compatible** — `automation_logs`, `/api/n8n/callback`, and all existing
  workflows are unchanged; these are additive `workflow` values.
- **Observable** — every job is a row, surfaced in the **Automation Health Monitor**.
