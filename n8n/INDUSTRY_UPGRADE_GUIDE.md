# ArqFlow n8n — Industry Upgrade (v6 → v6 Industry)

This upgrade turns the **plan-based** Bot Factory into a **plan + business-type** factory.
It is **100% additive**. The original `Bot_Factory_v6_Supabase.json` and
`TENANT_BOT_TEMPLATE_v6.json` are **untouched**; everything new lives in `*_industry.json`
and `SHARED_*_v1.json` files. Existing bots already provisioned are unaffected.

## What changed (and what did NOT)

**New flow:** `Customer → Plan → Business Type → Capabilities → Template config → Bot`
The plan→template routing is **unchanged**; the business-type layer is added on top.

| File | Change |
|------|--------|
| `Bot_Factory_v6_Supabase_industry.json` | Upgraded copy of the factory. **Same 23 nodes, same graph, same IDs/wiring.** Only 4 Code nodes were enhanced (see below). |
| `TENANT_BOT_TEMPLATE_v6_industry.json` | Upgraded copy of the bot template: original 16 nodes **plus 7 generic tool nodes** wired to `AI_AGENT`. |
| `SHARED_*_v1.json` (7 new) | New generic, reusable Execute-Workflow tools. |
| **Originals** | **Not modified.** |

### The 4 enhanced factory Code nodes (all additive)
1. **`SELECT_TEMPLATE`** — reads `business.business_type`, normalises aliases, and emits new fields
   (`business_type`, `industry_matched`, `capabilities`, `enabled_tools`, `persona`, `industry_intents`).
   All existing output fields (incl. `tools` from the plan) are preserved unchanged.
2. **`BUILD_SYSTEM_PROMPT`** — when an industry matches, appends a persona section, primary intents,
   and an **allowed-tools** instruction. The entire existing prompt is preserved; for unknown types
   the prompt is byte-identical to today.
3. **`INJECTION_ENGINE`** — carries the industry fields into `tenant_config` and exposes
   `enabled_tools` downstream. `tools` and all existing replacements are unchanged.
4. **`APPLY_REPLACEMENTS`** — after cloning, **prunes** the optional industry tool nodes that the
   business type does not enable. Base tools (`escalate`/`save_transaction`/`send_link`) are **never**
   pruned, so a legacy/unknown bot ends up with exactly the 3 tools it has today.

## Capability enforcement (two layers)
1. **Prompt** tells the agent which tools it may use ("use only these tools…").
2. **Pruning** physically removes non-enabled optional tool nodes from each cloned bot — so the bot
   truly only carries the workflows that match its capabilities.

See `CAPABILITY_MATRIX.md` for the full business-type → capabilities → tools table.

## One-time setup (import order)

1. **Import the 7 new shared workflows** (any order):
   `SHARED_GET_AVAILABLE_SLOTS_v1`, `SHARED_BOOK_APPOINTMENT_v1`, `SHARED_CANCEL_APPOINTMENT_v1`,
   `SHARED_RESCHEDULE_APPOINTMENT_v1`, `SHARED_ROOM_RESERVATION_v1`, `SHARED_SEND_REMINDER_v1`,
   `SHARED_HUMAN_HANDOFF_v1`.
   - They use the **same** `Supabase service_role` and `Evolution account` credentials as the
     existing shared workflows — confirm the credential is selected in each HTTP/Evolution node.
   - `SHARED_HUMAN_HANDOFF_v1` has an Execute-Workflow node `ESCALATE` → set its `workflowId` to your
     imported **`SHARED_ESCALATION_v2`** id (placeholder `SET_SHARED_ESCALATION_ID`). No logic is
     duplicated — it delegates to the existing escalation flow.

2. **Import `TENANT_BOT_TEMPLATE_v6_industry.json`** and, in its 7 new tool nodes, set each
   `workflowId` to the matching shared workflow id you imported in step 1:

   | Tool node | placeholder → set to |
   |-----------|----------------------|
   | `get_available_slots` | `SET_SHARED_GET_AVAILABLE_SLOTS_ID` |
   | `book_appointment` | `SET_SHARED_BOOK_APPOINTMENT_ID` |
   | `cancel_appointment` | `SET_SHARED_CANCEL_APPOINTMENT_ID` |
   | `reschedule_appointment` | `SET_SHARED_RESCHEDULE_APPOINTMENT_ID` |
   | `room_reservation` | `SET_SHARED_ROOM_RESERVATION_ID` |
   | `send_reminder` | `SET_SHARED_SEND_REMINDER_ID` |
   | `human_handoff` | `SET_SHARED_HUMAN_HANDOFF_ID` |
   - Also set the **existing** tool ids (`escalate`, `save_transaction`, `send_link`) and the
     `CALCULATE_COST` / `LOG_CONVERSATION` Execute-Workflow ids exactly as in the current template.

3. **Import `Bot_Factory_v6_Supabase_industry.json`** and open **`FACTORY_CONFIG`**:
   set `hmac_secret` and point `template_starter` / `template_business` / `template_enterprise`
   to the **industry** bot-template id from step 2 (one id is fine for all three tiers).

4. Point the platform's factory webhook at this factory (or keep the same webhook path).

> **DB dependency:** the booking/reservation tools write to the industry tables added in
> `supabase/migrations` (`appointments`, `reservations`). Apply `0001` + `0002` (and `0003` for
> hotels) before enabling those tools in production.

## Backward compatibility (guaranteed)
- Originals untouched → existing imported factory/template/bots keep running unchanged.
- Restaurants / e-commerce / unknown types → `enabled_tools` = base 3 tools → optional tools pruned →
  **identical bot to today**.
- No workflow IDs that existing bots depend on were changed; new shared workflows get new IDs.
- The plan→template→model routing is unchanged; this is purely an added decision layer.

## Validation performed
- All 9 new/upgraded workflows parse as valid JSON.
- Every embedded Code-node script passes `node --check` (0 syntax errors), including the matrix.
- Connection integrity verified (no dangling references); factory graph unchanged (23 nodes);
  template = original 16 + 7 tool nodes.
- Originals confirmed unmodified.
