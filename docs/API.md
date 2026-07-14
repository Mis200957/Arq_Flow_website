# ArqFlow REST API Reference

Base URL: `https://arqflow.app` (production) / `http://localhost:3000` (local)

All request/response bodies are JSON. Authenticated endpoints require a valid Supabase session cookie (set via `supabase.auth.signIn`). Admin endpoints additionally require `profiles.role = 'admin'`.

---

## Public Endpoints

### POST /api/onboarding

Submits a new business onboarding request. Creates a `businesses` record (status: `pending_approval`) and a `payments` record (status: `pending`). Notifies all admins.

**Auth:** None (rate-limited: 5 requests/min per IP)

**Request Body:**

```typescript
{
  // Plan selection
  plan_id: "starter" | "business" | "enterprise"

  // Business identity
  business_name: string          // 2–200 chars
  business_type: string          // 2–100 chars (e.g. "مطعم", "عيادة")
  description?: string           // max 2000 chars
  website?: string               // max 300 chars
  social_media?: Record<string, string>  // e.g. { instagram: "url" }
  languages: ("ar" | "en")[]    // min 1

  // Contact
  owner_name: string             // 2–150 chars
  contact_email: string          // valid email
  contact_phone: string          // 10–15 digits only
  whatsapp_number: string        // 10–15 digits only

  // Operations
  working_hours: string          // e.g. "9 ص – 11 م يومياً"
  address?: string               // max 500 chars
  location?: string              // max 500 chars
  delivery_info?: string         // max 1000 chars
  return_policy?: string         // max 1000 chars
  order_instructions?: string    // max 1000 chars
  payment_methods?: string[]     // e.g. ["كاش", "فودافون كاش"]

  // AI configuration
  primary_goal?: string          // max 500 chars
  tone_of_voice: "formal" | "friendly" | "egyptian"
  fallback_behavior: "handover" | "collect" | "apologize"
  greeting_message?: string      // max 500 chars
  assistant_personality?: string // max 1000 chars
  knowledge_base_raw?: string    // max 20000 chars
  policy?: string                // max 5000 chars
  faqs?: { question: string; answer: string }[]
  products?: { name: string; price?: string; description?: string }[]
  services?: { name: string; price?: string; description?: string }[]

  // Files (already uploaded to Supabase Storage)
  logo_path?: string             // path in business-assets bucket
  image_paths?: string[]
  kb_file_paths?: string[]       // paths in kb-files bucket

  // Payment proof
  payment_method: "instapay" | "vodafone_cash" | "wepay"
  transaction_ref: string        // exactly 12 digits
  screenshot_path: string        // path in payment-screenshots bucket
}
```

**Response 200:**
```json
{
  "ok": true,
  "order_id": "CUST_260613_A3F2",
  "business_id": "uuid"
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid JSON |
| 409 | Transaction reference already submitted |
| 422 | Validation failed (details in `details` field) |
| 429 | Rate limit exceeded |
| 500 | Database error |

---

## Admin Endpoints

All admin endpoints require an authenticated session with `profiles.role = 'admin'`.

### POST /api/admin/payments/:id/approve

Approves a pending payment. Creates client credentials (Supabase Auth user), activates the subscription, creates an invoice, and triggers n8n Bot Factory v6 provisioning.

**Auth:** Admin session required

**Path params:** `id` — payment UUID

**Request Body:** None

**Response 200:**
```json
{
  "ok": true,
  "credentials": {
    "client_id": "CUST_260613_A3F2",
    "email": "cust_260613_a3f2@clients.arqflow.app",
    "password": "Xk9mP2..."
  },
  "dashboard_url": "https://arqflow.app/dashboard",
  "factory_triggered": true,
  "factory_error": null
}
```

> `credentials` is `null` if the client already had an account. Show the password once — it is not stored in plain text.

**Errors:**
| Code | Description |
|------|-------------|
| 401 | No session |
| 403 | Not admin |
| 404 | Payment not found |
| 409 | Payment already approved/rejected |
| 500 | Could not create user or DB error |

---

### POST /api/admin/payments/:id/reject

Rejects a pending payment. Sets business status back to `pending_approval` and payment status to `rejected`. Notifies the business owner.

**Auth:** Admin session required

**Path params:** `id` — payment UUID

**Request Body:**
```typescript
{
  reason?: string  // optional rejection reason shown to client
}
```

**Response 200:**
```json
{ "ok": true }
```

**Errors:**
| Code | Description |
|------|-------------|
| 401 | No session |
| 403 | Not admin |
| 404 | Payment not found |
| 409 | Payment already processed |

---

### PATCH /api/admin/clients/:id/status

Suspends or reactivates a client's bot. Updates `businesses.status` and logs to `audit_logs`.

**Auth:** Admin session required

**Path params:** `id` — business UUID

**Request Body:**
```typescript
{
  status: "active" | "suspended"
  reason?: string
}
```

**Response 200:**
```json
{ "ok": true, "status": "suspended" }
```

**Errors:**
| Code | Description |
|------|-------------|
| 401 | No session |
| 403 | Not admin |
| 404 | Business not found |
| 422 | Invalid status value |

---

### PUT /api/admin/plans/:id

Updates a plan's pricing or configuration in Supabase.

**Auth:** Admin session required

**Path params:** `id` — plan id (`starter` | `business` | `enterprise`)

**Request Body:**
```typescript
{
  setup_fee_egp?: number
  monthly_fee_egp?: number
  message_limit?: number
  ai_model?: string
  fallback_model?: string
  max_tokens?: number
  memory_window?: number
  tools?: string[]
  media_support?: string[]
  is_active?: boolean
}
```

**Response 200:**
```json
{ "ok": true, "plan": { ...updated plan } }
```

---

### PATCH /api/admin/settings

Updates a global app setting (key/value pairs in `app_settings` table).

**Auth:** Admin session required

**Request Body:**
```typescript
{
  key: string
  value: any  // JSON-serializable
}
```

**Response 200:**
```json
{ "ok": true }
```

---

### GET /api/admin/screenshot/:id

Returns a signed URL for a payment screenshot stored in Supabase Storage. URLs expire in 60 seconds.

**Auth:** Admin session required

**Path params:** `id` — payment UUID

**Response 200:**
```json
{
  "url": "https://zjathejcdkpxjyvululp.supabase.co/storage/v1/object/sign/..."
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 404 | Payment or screenshot not found |

---

## n8n Internal Endpoints

### POST /api/n8n/callback

Called by n8n Bot Factory after provisioning completes or fails. Secured with HMAC: `X-ArqFlow-Signature: hex(hmac_sha256(rawBody, N8N_WEBHOOK_SECRET))`.

**Auth:** HMAC signature in `X-ArqFlow-Signature` header

**Request Body:**
```typescript
{
  event: "provision_complete" | "provision_failed" | "instance_status" | "health_check"
  business_id: string        // required for all events

  // provision_complete only:
  workflow_id?: string
  instance_name?: string
  webhook_path?: string
  system_prompt?: string
  qr_sent?: boolean

  // instance_status only:
  status?: "connected" | "disconnected" | "qr_pending"
  connected_number?: string

  // provision_failed only:
  error?: string
}
```

**Response 200:**
```json
{ "ok": true }
```

**Event behaviors:**

| Event | Effect |
|-------|--------|
| `provision_complete` | Sets `businesses.status = 'active'`, upserts `instances` record, sends notification to business owner |
| `provision_failed` | Sets `businesses.health_status = 'provision_failed'`, notifies all admins |
| `instance_status` | Updates `instances.evolution_status` and `health_status` |
| `health_check` | Updates `businesses.health_status` and `last_health_check` |

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid JSON |
| 401 | Invalid or missing HMAC signature |
| 404 | Business not found |
| 422 | Unknown event type or missing required fields |

---

## Dashboard Endpoints

These endpoints require an authenticated client session. RLS ensures clients can only access their own business data.

### PATCH /api/dashboard/business

Updates the authenticated client's business profile.

**Auth:** Client session required

**Request Body:** Partial business fields (same shape as onboarding, all optional)

**Response 200:**
```json
{ "ok": true }
```

---

### POST /api/dashboard/api-keys

Creates a new API key for the authenticated client's business (for future direct integrations).

**Auth:** Client session required

**Request Body:**
```typescript
{
  name: string  // friendly label, e.g. "CRM Integration"
}
```

**Response 200:**
```json
{
  "ok": true,
  "key": "ak_live_xxxx...",   // shown once only
  "prefix": "ak_live_xxxx",
  "id": "uuid"
}
```

---

## Error Format

All error responses follow this shape:

```json
{
  "error": "Human-readable error message",
  "details": { "field": ["error detail"] }  // present only on 422 validation errors
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /api/onboarding | 5 req/min per IP |
| All admin endpoints | 100 req/min per session |
| POST /api/n8n/callback | 60 req/min (HMAC-gated) |
