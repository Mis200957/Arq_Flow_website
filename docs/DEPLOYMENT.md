# ArqFlow Production Deployment Checklist

Run through this checklist in order when deploying to production.

---

## 1. Supabase Production Settings

### 1.1 Authentication

In Supabase Dashboard → Authentication → Settings:

- [ ] **Site URL:** Set to `https://arqflow.app` (your production domain)
- [ ] **Redirect URLs:** Add `https://arqflow.app/**`
- [ ] **Disable email confirmations** if you're creating users programmatically via service role (the approve endpoint does `email_confirm: true` already)
- [ ] **JWT expiry:** Set to `3600` (1 hour) for sessions

### 1.2 SMTP (Email)

In Supabase Dashboard → Authentication → Email → SMTP Settings:

- [ ] Enable custom SMTP
- [ ] Set SMTP host, port, user, password (use a transactional email provider: Resend, SendGrid, Postmark)
- [ ] Set `From` address to `noreply@arqflow.app`
- [ ] Test with a real email address

### 1.3 Row Level Security

- [ ] Confirm RLS is **enabled** on every table
- [ ] Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` — all should show `rowsecurity = true`
- [ ] Test as a non-admin user that they cannot read another tenant's data

### 1.4 Realtime

- [ ] Enable realtime on `notifications` table (for dashboard live updates)
- [ ] Enable realtime on `instances` table (for WhatsApp connection status)
- [ ] Limit to only the tables that need it to reduce load

### 1.5 Connection pooling

- [ ] In Supabase Dashboard → Database → Connection Pooling: Enable **Transaction mode** (PgBouncer)
- [ ] Use the pooler connection string in Next.js (not the direct connection)

---

## 2. Vercel Configuration

### 2.1 Deploy

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Link to project
vercel link

# Deploy to production
vercel --prod
```

### 2.2 Environment Variables

Set all of these in Vercel Dashboard → Project → Settings → Environment Variables. Set scope to **Production**:

```
NEXT_PUBLIC_SUPABASE_URL=https://zjathejcdkpxjyvululp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://arqflow.app
N8N_WEBHOOK_SECRET=<32-byte-hex-secret>
N8N_FACTORY_WEBHOOK_URL=https://bc1b1373.kube-ops.com/webhook/arqflow_factory_v6
```

> For Preview deployments, set `NEXT_PUBLIC_APP_URL` to the Vercel preview URL or a staging URL.

### 2.3 Regions

In `vercel.json` (create if not present):

```json
{
  "regions": ["fra1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

Choose `fra1` (Frankfurt) for proximity to Egypt, or `iad1` (US East). Do not use edge runtime for routes that use Supabase server client (cookies-based auth).

### 2.4 Function timeouts

The approve endpoint calls n8n with a 15s timeout. Vercel Hobby plan limits to 10s. Use **Pro plan** or set:

```json
{
  "functions": {
    "src/app/api/admin/payments/[id]/approve/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2.5 Domain configuration

- [ ] Add your custom domain in Vercel → Domains
- [ ] Set DNS A/CNAME records per Vercel instructions
- [ ] Wait for SSL certificate provisioning (automatic via Let's Encrypt)
- [ ] Update `NEXT_PUBLIC_APP_URL` to the production domain
- [ ] Update Supabase Auth Site URL to the production domain

---

## 3. n8n Production Setup

### 3.1 n8n Environment Variables

In your n8n instance settings, set:

```
SUPABASE_URL=https://zjathejcdkpxjyvululp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
ARQFLOW_HMAC_SECRET=<same_value_as_N8N_WEBHOOK_SECRET>
EVOLUTION_API_KEY=<evolution_api_key>
N8N_BASE_URL=https://bc1b1373.kube-ops.com
N8N_API_KEY=<n8n_api_key>
N8N_TEMPLATE_STARTER_ID=<workflow_id>
N8N_TEMPLATE_BUSINESS_ID=<workflow_id>
N8N_TEMPLATE_ENTERPRISE_ID=<workflow_id>
```

### 3.2 Webhook URL

The factory webhook URL must be:
`https://bc1b1373.kube-ops.com/webhook/arqflow_factory_v6`

Set this in `.env.local` (local) and Vercel env vars (production) as `N8N_FACTORY_WEBHOOK_URL`.

### 3.3 Security Headers

Ensure your n8n reverse proxy (nginx/traefik) adds:

```nginx
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
# Only allow webhook calls from Vercel IPs and your own servers
# (optional IP allowlist via nginx allow/deny)
```

### 3.4 Rate Limiting (n8n webhooks)

Add rate limiting at the reverse proxy level for the factory webhook:

```nginx
limit_req_zone $binary_remote_addr zone=factory:10m rate=10r/m;
location /webhook/arqflow_factory_v6 {
    limit_req zone=factory burst=5 nodelay;
    proxy_pass http://n8n:5678;
}
```

### 3.5 Import and activate all workflows

1. Import in order:
   - `SHARED_CALCULATE_COST_v2.json`
   - `SHARED_LOG_CONVERSATION_v2.json`
   - `SHARED_ESCALATION_v2.json`
   - `SHARED_SAVE_TRANSACTION_v2.json`
   - `Bot_Factory_v6_Supabase.json`
2. Note the workflow IDs of the three master templates (Starter/Business/Enterprise)
3. Set those IDs as `N8N_TEMPLATE_*_ID` env vars
4. Activate all 5 workflows

### 3.6 n8n Execution Data Retention

To prevent disk fill-up on long-running deployments, set in n8n:

```
EXECUTIONS_DATA_MAX_AGE=336   # 14 days in hours
EXECUTIONS_DATA_PRUNE=true
```

---

## 4. Evolution API Setup

### 4.1 API Key

- [ ] Log in to Evolution API manager at `https://evo.mis.rooyai.com`
- [ ] Generate or copy the global API key
- [ ] Set as `EVOLUTION_API_KEY` in n8n environment variables

### 4.2 Global Webhook (optional)

For monitoring all instances centrally, set a global webhook in Evolution API pointing to `https://arqflow.app/api/n8n/callback` for `MESSAGES_UPSERT` and `CONNECTION_UPDATE` events.

### 4.3 Health monitoring

Set up a cron job or n8n schedule trigger to:
1. GET `https://evo.mis.rooyai.com/instance/fetchInstances`
2. For each instance, check `connectionStatus`
3. POST to `/api/n8n/callback` with `event: instance_status` for any disconnected instances

---

## 5. DNS and Domain Configuration

| Record | Type | Value |
|--------|------|-------|
| `arqflow.app` | A | Vercel IP (from Vercel dashboard) |
| `www.arqflow.app` | CNAME | `cname.vercel-dns.com` |

For email (if using custom SMTP):
| Record | Type | Value |
|--------|------|-------|
| `mail.arqflow.app` | MX | Your email provider MX |
| `_dkim.*` | TXT | DKIM key from provider |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:admin@arqflow.app` |

---

## 6. Health Monitoring

### 6.1 Uptime monitoring

Set up uptime checks (UptimeRobot, BetterStack, or similar) for:

| URL | Expected | Interval |
|-----|----------|----------|
| `https://arqflow.app` | 200 | 1 min |
| `https://arqflow.app/api/health` (if implemented) | 200 | 1 min |
| `https://bc1b1373.kube-ops.com` | 200 | 5 min |
| `https://evo.mis.rooyai.com` | 200 | 5 min |

### 6.2 Supabase alerts

In Supabase Dashboard → Settings → Alerts:
- [ ] Enable email alerts for **high database CPU** (>80%)
- [ ] Enable alerts for **storage nearing limit**
- [ ] Enable alerts for **auth rate limit exceeded**

### 6.3 n8n execution monitoring

- [ ] Set up a daily n8n workflow that queries `automation_logs` for `level = 'error'` in the last 24h
- [ ] Send a summary to admin WhatsApp or email

### 6.4 Error tracking (optional)

Add Sentry to Next.js:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Set `SENTRY_DSN` in Vercel env vars.

---

## 7. Backup Strategy

### 7.1 Supabase backups

- Supabase Pro plan includes **daily PITR (Point-in-Time Recovery)** with 7-day retention
- Enable in Dashboard → Settings → Database → Backups
- Test restore procedure at least once before going live

### 7.2 Manual backup script (run monthly)

```bash
# Requires supabase CLI and PostgreSQL client
supabase db dump --linked > backup_$(date +%Y%m%d).sql
gzip backup_$(date +%Y%m%d).sql
# Upload to S3/B2/etc.
```

### 7.3 n8n workflow backups

- Export all workflows from n8n UI monthly → store in version control
- The `n8n/` directory in this repo serves as the canonical source for factory + shared workflows
- Individual tenant workflows are not backed up here (they are recreatable from the factory)

### 7.4 Evolution API instances

- Supabase `instances` table is the source of truth for active instances
- If the Evolution API server is lost, re-run provisioning for each active business (pending reconnect)

---

## 8. Pre-Launch Checklist

- [ ] All environment variables set in Vercel (Production scope)
- [ ] All environment variables set in n8n
- [ ] HMAC secret matches on both sides (`N8N_WEBHOOK_SECRET` = `ARQFLOW_HMAC_SECRET`)
- [ ] Supabase Auth: Site URL set to production domain
- [ ] Supabase Auth: Email SMTP configured and tested
- [ ] RLS policies verified on all tables
- [ ] First admin user created and verified can log in
- [ ] Plans table seeded with starter/business/enterprise
- [ ] n8n: All 5 workflows imported and activated
- [ ] n8n: Template workflow IDs set as env vars
- [ ] Evolution API key configured in n8n
- [ ] Test full flow end-to-end in staging before production launch:
  - Submit onboarding form
  - Admin approves payment
  - n8n factory runs successfully
  - Bot workflow created in n8n
  - Evolution instance created
  - Callback received → business status = active
  - Client can log in to dashboard
- [ ] DNS records propagated
- [ ] SSL certificate active
- [ ] Uptime monitoring configured
- [ ] Backup schedule verified
