# Provisioning Flow — Client Experience & State Machine (July 2026)

## State machine (`businesses.status`)

```
pending_payment → pending_approval → provisioning → qr_pending → under_review → active
                                          │                                       ↑
                                          └──────────→ provision_failed ──(retry)─┘
```

| Status | Set by | Client sees |
|---|---|---|
| `provisioning` | `approvePayment()` on approval | "جاري إنشاء البوت الخاص بك..." + step tracker |
| `qr_pending` | n8n callback `provision_complete` | WhatsApp prep instructions → "أنا جاهز" → live QR (40s countdown + refresh) |
| `under_review` | n8n callback `instance_status: connected` | "تم ربط WhatsApp بنجاح ✅ / جاري فحص البوت..." |
| `active` | Admin final confirmation (`POST /api/admin/clients/:id/activate`) | Full dashboard |
| `provision_failed` | n8n callback / provisioning watchdog | Failure screen + support WhatsApp link |

The client screen (`src/app/dashboard/ProvisioningScreen.tsx`, gated in
`dashboard/layout.tsx`) advances via Supabase realtime on the `businesses` row
plus a 5s polling fallback (`GET /api/dashboard/provisioning/status`).

## QR handling

The QR is **never** stored or shown immediately — Evolution QR codes expire in
~40 seconds. The screen first prepares the user (open WhatsApp → linked
devices → link a device), and only on "أنا جاهز" calls
`POST /api/dashboard/provisioning/qr`, which fetches a **fresh** base64 QR from
`GET {EVOLUTION_API_URL}/instance/connect/{instance_name}` server-side
(requires `EVOLUTION_API_URL` + `EVOLUTION_API_KEY` envs). The UI shows a
countdown and a one-tap refresh when it expires. If Evolution reports the
instance already connected, the screen jumps straight to the review stage.

## Final activation (admin gate)

WhatsApp connection does NOT activate the bot. `instance_status: connected`
moves the business to `under_review`, notifies admins (dashboard + Telegram).
The admin verifies the workflow, then hits ✓ on `/admin/clients`, which calls
`POST /api/admin/clients/:id/activate`. The endpoint enforces three checks
(workflow created, instance created, WhatsApp connected) with an explicit
`?force=1` override. No automatic "bot ready" message is sent to the client —
the admin contacts them personally (by design).

## Failure handling

- Factory injection failure → `provision_failed` callback from the Factory's
  `PROVISION_OK?` false branch.
- Factory dies mid-run → the `provisioning watchdog` n8n workflow flips any
  business stuck >15 min in `provisioning` to `provision_failed`.
- Both paths alert admins via dashboard notifications + Telegram; the client
  sees the failure screen with a support link. Retry = fix the cause, then
  re-trigger the factory (or set status back and re-approve a test payment).

## Renewal republish

`applySubscriptionPayment()` always POSTs (HMAC-signed) to
`{N8N_PUBLISH_AFTER_RENEW_URL}` → n8n `publish bot after renew` re-activates
the bot workflow via the n8n API and wakes the Evolution instance when
`was_suspended = true`.

## Security

- Every platform→n8n and n8n→platform call is HMAC-signed
  (`X-ArqFlow-Signature`, sha256, shared secret `N8N_WEBHOOK_SECRET` /
  `ARQFLOW_HMAC_SECRET`).
- Billing RPCs (`wallet_topup`, `increment_usage`, `wallet_status`) are
  service_role-only as of migration `20260702000017`.
