# ArqFlow — Industry Routing for n8n (additive layer)

This describes how the **Bot Factory** becomes industry-aware **without removing
any existing nodes or workflows**. It layers a `business_type` dimension on top
of the current per-plan routing (`ROUTE_BY_PLAN` / `PICK_TEMPLATE`).

> Nothing here is destructive. The factory keeps `FACTORY_CONFIG`,
> `VALIDATE_INTAKE`, `BUILD_RECORD`, `ROUTE_BY_PLAN`, `COMPILE_KNOWLEDGE_BASE`,
> `AI_PROMPT_BUILDER`, `PICK_TEMPLATE`, the `LOAD_*_TEMPLATE` nodes, the Evolution
> nodes and the HMAC `/api/n8n/callback`. We only **add** an industry input and
> use it inside nodes that already exist.

## 1. Where the industry data comes from

The platform now ships an `industry` object in the automation-log payloads the
factory already consumes:

- **Onboarding** → `automation_logs.event = "submission_received"`
- **Prompt rebuild** → `automation_logs.event = "prompt_regeneration_requested"`

Shape (produced by `src/lib/modules/ai.ts → buildIndustryPromptContext`):

```json
{
  "business_type": "clinic",
  "matched": true,
  "industry_label_en": "Clinic",
  "industry_label_ar": "عيادة",
  "summary_en": "Clinic assistant that lists doctors and open slots ...",
  "summary_ar": "مساعد عيادة يعرض الأطباء والمواعيد المتاحة ...",
  "intents": ["list_doctors","available_slots","book_appointment","cancel_appointment","medical_services","prices"],
  "tools":   ["list_doctors","get_available_slots","book_appointment","cancel_appointment","list_medical_services"],
  "kb_categories": ["Doctors & Specialties","Medical Services & Prices","Working Hours & Booking","Insurance & Payment","Location & Directions"],
  "enabled_modules": ["overview","conversations","appointments","doctors","patients","medical-services","..."],
  "defaults": { "tone_of_voice": "formal", "fallback_behavior": "collect", "primary_goal": "booking" }
}
```

`business_type` is also stored directly on `businesses.business_type`, so the
factory can read it straight from the Supabase record in `BUILD_RECORD`.

## 2. What `business_type` should drive (4 outputs)

| Output | Existing node to extend | How |
|--------|------------------------|-----|
| **AI system prompt** | `AI_PROMPT_BUILDER` | Inject the `summary`, `intents`, `tools`, and `defaults` from the `industry` object into the prompt template (Arabic-first). The platform can pre-render this with `renderIndustryPromptScaffold(business_type)`. |
| **Agent tools** | `AI_PROMPT_BUILDER` / agent tool list | Expose the `tools[]` for the industry (e.g. clinic → `book_appointment`, restaurant → `get_menu`). Tools map to Supabase HTTP reads/writes on the new industry tables. |
| **Knowledge-base structure** | `COMPILE_KNOWLEDGE_BASE` | Seed / group KB entries under `kb_categories[]` for the industry. |
| **Workflow template** | `PICK_TEMPLATE` / `ROUTE_BY_PLAN` | Keep plan as the primary template switch; add `business_type` as a secondary switch (or a `Set` node `industry_profile`) so the agent's behaviour matches the vertical. |

## 3. Recommended minimal change

Add ONE `Set`/`Code` node after `BUILD_RECORD` called `INDUSTRY_PROFILE` that
reads `business_type` and emits the `industry` object (mirror the JSON above, or
forward the one already in the payload). Reference its fields in
`AI_PROMPT_BUILDER` and `COMPILE_KNOWLEDGE_BASE`. No other node changes required.

```
VALIDATE_INTAKE → BUILD_RECORD → INDUSTRY_PROFILE → ROUTE_BY_PLAN → AI_PROMPT_BUILDER → ...
                                       │
                                       └── industry.{summary,intents,tools,kb_categories,defaults}
```

## 4. Tool → table map (for the agent's Supabase HTTP tools)

| Industry | Tool | Reads / writes |
|----------|------|----------------|
| Clinic | `list_doctors` | `doctors` |
| Clinic | `get_available_slots` / `book_appointment` / `cancel_appointment` | `appointments` (+ `doctors`, `medical_services`) |
| Clinic | `list_medical_services` | `medical_services` |
| Restaurant | `get_menu` / `place_order` / `track_order` | `products`, `orders` (existing) |
| E-commerce | `search_products` / `check_stock` / `place_order` | `products`, `orders` (existing) |
| Hotel | `check_room_availability` / `make_reservation` | `rooms`, `reservations`, `guests` |
| Gym | `get_membership_plans` / `get_class_schedule` | `memberships`, `classes`, `trainers` |
| Salon | `list_services` / `book_appointment` | `services`, `appointments` |
| Real estate | `search_properties` / `book_visit` / `assign_agent` | `properties`, `property_visits`, `agents`, `property_requests` |
| Education | `list_courses` / `enroll_student` | `courses`, `students`, `enrollments` |
| Lawyer | `create_consultation` / `get_case_status` | `appointments`, `cases`, `case_clients` |
| Service / Car | `create_service_request` / `get_work_order_status` | `service_requests`, `work_orders`, `technicians` |

The canonical list lives in code: `src/lib/modules/industries.ts` (`ai.tools`,
`ai.intents`, `ai.kbCategories`). Keep n8n in sync with that file.

## 5. Backward compatibility

- Existing restaurant bots keep using `products` / `orders` exactly as today.
- An unknown/blank `business_type` yields `matched: false` and a safe generic
  profile — the factory behaves exactly as before.
- No existing workflow, credential, callback, or table is changed.
