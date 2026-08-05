# Netlify environment variables (production)

After your hosted Supabase project is ready, set these in
**Netlify → Site configuration → Environment variables**.

## Required

| Name | Source |
|------|--------|
| `DATABASE_URL` | Supabase → Database → Connection pooling → **Transaction** URI (`pgbouncer=true`, `sslmode=require`) |
| `DIRECT_URL` | Supabase → Database → Connection string → **URI** direct (`sslmode=require`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk → Webhooks → signing secret |
| `CRON_SECRET` | Any long random string you generate |

## Optional

| Name | Source |
|------|--------|
| `DEMO_PASSWORD` | Override demo login (default `GearvoDemo2026!`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe |
| `STRIPE_SECRET_KEY` | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Stripe |
| `UPSTASH_REDIS_REST_URL` | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash |
| `INTEGRATION_SECRETS_KEY` | Random 32+ char string |

## Do not set

- Any Neon `*.neon.tech` URL
- `ALLOW_DEV_AUTH_BYPASS`

Exact values for `DATABASE_URL` / `DIRECT_URL` are printed by:

```bash
node scripts/create-supabase-cloud.mjs
node scripts/cutover-to-supabase.mjs
```
