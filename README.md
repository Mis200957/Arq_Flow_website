# ArqFlow Platform

AI-powered WhatsApp SaaS for Egyptian SMBs. Businesses submit an onboarding form, pay manually, an admin approves the payment, and an n8n automation provisions a full WhatsApp AI agent in under 2 minutes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 15 (App Router, TypeScript) |
| Database + Auth | Supabase (PostgreSQL, RLS, Auth) |
| Automation | n8n (self-hosted at bc1b1373.kube-ops.com) |
| WhatsApp Gateway | Evolution API (evo.mis.rooyai.com) |
| AI Models | OpenRouter → Claude Haiku/Sonnet, Whisper, GPT-4o |
| Storage | Supabase Storage (business-assets, payment-screenshots, kb-files) |
| Deployment | Vercel (platform) + existing k8s (n8n + Evolution API) |

---

## Project Structure

```
arqflow-platform/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── onboarding/route.ts          # Public: submit onboarding form
│   │   │   ├── admin/
│   │   │   │   └── payments/[id]/
│   │   │   │       ├── approve/route.ts     # Admin: approve + trigger factory
│   │   │   │       └── reject/route.ts      # Admin: reject payment
│   │   │   └── n8n/
│   │   │       └── callback/route.ts        # n8n → platform webhook (HMAC)
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                    # Browser Supabase client
│   │   │   ├── server.ts                    # Server Supabase client (cookies)
│   │   │   └── admin.ts                     # Service-role admin client
│   │   ├── database.types.ts                # Generated Supabase types
│   │   ├── plans.ts                         # Plan definitions + pricing
│   │   └── utils.ts                         # Helpers (generateOrderId, etc.)
│   └── middleware.ts                        # Auth middleware (Supabase SSR)
├── n8n/
│   ├── Bot_Factory_v6_Supabase.json         # Main provisioning workflow
│   ├── SHARED_LOG_CONVERSATION_v2.json      # Logs messages to Supabase
│   ├── SHARED_CALCULATE_COST_v2.json        # Cost calc + quota enforcement
│   ├── SHARED_ESCALATION_v2.json            # Escalation + admin WhatsApp alert
│   └── SHARED_SAVE_TRANSACTION_v2.json      # Saves orders to Supabase
├── docs/
│   ├── API.md          # REST API reference
│   ├── AUTOMATION.md   # n8n workflow architecture
│   ├── DATABASE.md     # Supabase schema reference
│   └── DEPLOYMENT.md   # Production checklist
└── README.md           # This file
```

---

## Environment Variables

Create `.env.local` in the project root with the following:

```bash
# ─── Supabase ────────────────────────────────────────────────
# Found in: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://zjathejcdkpxjyvululp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # anon/public key
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # service_role key (NEVER expose client-side)

# ─── App ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000     # Change to production URL when deploying

# ─── n8n Webhook Security ────────────────────────────────────
# Shared HMAC secret between Next.js and n8n. Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
N8N_WEBHOOK_SECRET=your-32-byte-hex-secret

# The n8n Bot Factory v6 webhook URL
N8N_FACTORY_WEBHOOK_URL=https://bc1b1373.kube-ops.com/webhook/arqflow_factory_v6

# ─── n8n API (for workflow management from Next.js if needed) ─
N8N_API_KEY=your-n8n-api-key
N8N_BASE_URL=https://bc1b1373.kube-ops.com

# ─── Evolution API ───────────────────────────────────────────
EVOLUTION_API_URL=https://evo.mis.rooyai.com
EVOLUTION_API_KEY=your-evolution-api-key
```

### Variable Explanations

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project REST endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Safe for browser use; enforces RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Bypasses RLS; server-side only |
| `NEXT_PUBLIC_APP_URL` | Yes | Used for callback URLs sent to n8n |
| `N8N_WEBHOOK_SECRET` | Yes | HMAC secret for factory ↔ platform auth |
| `N8N_FACTORY_WEBHOOK_URL` | Yes | Full URL of Bot Factory v6 webhook |
| `N8N_API_KEY` | Optional | Required if managing n8n workflows from Next.js |

---

## Local Development Setup

### 1. Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase CLI (optional, for local dev)

### 2. Install dependencies

```bash
cd arqflow-platform
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 4. Get Supabase credentials

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open project **zjathejcdkpxjyvululp**
3. Navigate to **Settings → API**
4. Copy **Project URL**, **anon public** key, and **service_role** key
5. Paste into `.env.local`

> The service_role key bypasses Row Level Security. Never commit it or expose it in client code.

### 5. Run the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`

---

## Supabase Project Setup

Project is already provisioned:
- **Project ref:** `zjathejcdkpxjyvululp`
- **URL:** `https://zjathejcdkpxjyvululp.supabase.co`
- **Region:** (check dashboard)

### Getting the service role key

1. [Supabase Dashboard](https://supabase.com/dashboard) → select project
2. **Settings** (gear icon) → **API**
3. Under **Project API keys**, reveal the **service_role** key
4. Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

### Database schema

All migrations are managed in the Supabase SQL Editor. See `docs/DATABASE.md` for the full schema reference.

### Creating the first admin user

Run this in the Supabase SQL Editor after creating a user via Auth:

```sql
-- Replace with the actual user UUID from auth.users
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_UUID_HERE';
```

See `docs/DATABASE.md` for the full admin setup snippet.

---

## n8n Setup

### 1. Import workflows

1. Log in to your n8n instance at `https://bc1b1373.kube-ops.com`
2. Navigate to **Workflows → Import from File**
3. Import in this order:
   - `n8n/SHARED_CALCULATE_COST_v2.json`
   - `n8n/SHARED_LOG_CONVERSATION_v2.json`
   - `n8n/SHARED_ESCALATION_v2.json`
   - `n8n/SHARED_SAVE_TRANSACTION_v2.json`
   - `n8n/Bot_Factory_v6_Supabase.json`
4. Note the workflow IDs after import

### 2. Set n8n environment variables

In n8n, go to **Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://zjathejcdkpxjyvululp.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `ARQFLOW_HMAC_SECRET` | same value as `N8N_WEBHOOK_SECRET` in `.env.local` |
| `EVOLUTION_API_KEY` | your Evolution API key |
| `N8N_BASE_URL` | `https://bc1b1373.kube-ops.com` |
| `N8N_API_KEY` | n8n API key (from n8n Settings → API) |
| `N8N_TEMPLATE_STARTER_ID` | Workflow ID of the Starter master template |
| `N8N_TEMPLATE_BUSINESS_ID` | Workflow ID of the Business master template |
| `N8N_TEMPLATE_ENTERPRISE_ID` | Workflow ID of the Enterprise master template |

### 3. Activate workflows

Activate the 5 shared/factory workflows in n8n. The Bot Factory webhook URL will be:
`https://bc1b1373.kube-ops.com/webhook/arqflow_factory_v6`

---

## Deployment Guide

See `docs/DEPLOYMENT.md` for the full production checklist.

### Quick Vercel deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**. Do not set `NEXT_PUBLIC_*` variables as server-only.

---

## Admin Setup

### Creating the first admin

1. Go to Supabase Dashboard → Authentication → Users
2. Click **Add user** → enter email + password
3. Copy the generated user UUID
4. Run in SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Admin Name'
WHERE id = 'PASTE_UUID_HERE';
```

5. Log in at `/admin` with those credentials

---

## Key Flows

```
Customer fills form  →  POST /api/onboarding
                             ↓ creates business + payment in Supabase
                             ↓ notifies all admins

Admin reviews  →  POST /api/admin/payments/:id/approve
                       ↓ approves payment
                       ↓ creates Supabase auth user + credentials
                       ↓ creates subscription + invoice
                       ↓ HMAC-signed POST to n8n Bot Factory v6

n8n Bot Factory  →  ValidateSignature
                  →  SelectTemplate (starter/business/enterprise)
                  →  BuildSystemPrompt
                  →  InjectionEngine (replaces __PLACEHOLDERS__)
                  →  FetchTemplateJSON (n8n API)
                  →  ApplyReplacements
                  →  CreateWorkflow + ActivateWorkflow
                  →  CreateEvolutionInstance
                  →  ConfigureEvolutionWebhook
                  →  UpdateSupabaseStatus
                  →  CallbackSuccess → POST /api/n8n/callback

Platform callback  →  Sets business.status = 'active'
                   →  Creates instances record
                   →  Sends notification to client
```
