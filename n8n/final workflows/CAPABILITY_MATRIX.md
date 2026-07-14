# ArqFlow n8n — Industry Capability Matrix

Auto-generated from the factory's `INDUSTRY_CAPABILITIES` matrix (embedded in `SELECT_TEMPLATE`).
It mirrors `src/lib/modules/industries.ts`. Keep both in sync.

**Base tools** (always present, never pruned — current behaviour): `escalate`, `save_transaction`, `send_link`.

Unknown / blank / unrecognised `business_type` → no industry match → bot gets **exactly the base tools** (identical to today).

| Business type | Capabilities (✅) | Enabled tools (added beyond base) |
|---|---|---|
| `restaurant` | orders, menu, delivery, promotions, products | _(base only)_ |
| `ecommerce` | products, orders, inventory, coupons | _(base only)_ |
| `store` | products, orders, inventory | _(base only)_ |
| `clinic` | booking, doctors, patients, medical_services | `get_available_slots`, `book_appointment`, `cancel_appointment`, `reschedule_appointment`, `send_reminder`, `human_handoff` |
| `medical_center` | booking, doctors, patients, medical_services | `get_available_slots`, `book_appointment`, `cancel_appointment`, `reschedule_appointment`, `send_reminder`, `human_handoff` |
| `pharmacy` | products, orders, inventory | _(base only)_ |
| `hotel` | rooms, reservations, booking | `room_reservation`, `send_reminder`, `human_handoff` |
| `gym` | memberships, classes, trainers, booking | `book_appointment`, `get_available_slots`, `send_reminder`, `human_handoff` |
| `salon` | booking, services, staff | `get_available_slots`, `book_appointment`, `cancel_appointment`, `reschedule_appointment`, `send_reminder`, `human_handoff` |
| `real_estate` | properties, visits, agents, booking | `get_available_slots`, `book_appointment`, `send_reminder`, `human_handoff` |
| `educational_center` | courses, enrollment, teachers | `send_reminder`, `human_handoff` |
| `lawyer` | cases, consultations, booking | `get_available_slots`, `book_appointment`, `send_reminder`, `human_handoff` |
| `car_service` | services, work_orders, booking | `get_available_slots`, `book_appointment`, `send_reminder`, `human_handoff` |
| `service_company` | services, work_orders, booking | `get_available_slots`, `book_appointment`, `send_reminder`, `human_handoff` |
| `company` | general | `human_handoff` |

## Aliases (normalised to a canonical type)

| Alias | → Canonical |
|---|---|
| `medical` | `medical_center` |
| `hospital` | `medical_center` |
| `cafe` | `restaurant` |
| `realestate` | `real_estate` |
| `real-estate` | `real_estate` |
| `education` | `educational_center` |
| `educational` | `educational_center` |
| `school` | `educational_center` |
| `law_firm` | `lawyer` |
| `lawyer_office` | `lawyer` |
| `law` | `lawyer` |
| `beauty` | `salon` |
| `spa` | `salon` |
| `fitness` | `gym` |
| `services` | `service_company` |
| `service` | `service_company` |

## Generic reusable SHARED workflows added

These are industry-agnostic and reusable by ANY business type (called as Execute-Workflow tools):

- **SHARED_GET_AVAILABLE_SLOTS_v1** — reads `appointments` for a day → returns booked slots so the bot proposes free times
- **SHARED_BOOK_APPOINTMENT_v1** — upserts customer + inserts `appointments` (clinic/medical/salon/gym/real-estate/lawyer/service)
- **SHARED_CANCEL_APPOINTMENT_v1** — sets appointment `status=cancelled`
- **SHARED_RESCHEDULE_APPOINTMENT_v1** — updates appointment `starts_at`/`ends_at`
- **SHARED_ROOM_RESERVATION_v1** — upserts customer + inserts `reservations` (hotel)
- **SHARED_SEND_REMINDER_v1** — sends a WhatsApp reminder via Evolution (any business)
- **SHARED_HUMAN_HANDOFF_v1** — normalises + delegates to the existing `ESCALATION` workflow (no duplicated logic)
