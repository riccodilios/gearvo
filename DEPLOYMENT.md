# Gearvo — Deployment (Netlify + Supabase + Clerk)

## Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) PostgreSQL project
- [Clerk](https://clerk.com) application
- Netlify account connected to this repo

Full database guide: [docs/SUPABASE.md](./docs/SUPABASE.md)

## 1. Supabase database

Create a Supabase project (dashboard or `node scripts/create-supabase-cloud.mjs`).

Set locally:

```env
DATABASE_URL="<Transaction pooler URI>?pgbouncer=true&sslmode=require"
DIRECT_URL="<Direct URI>?sslmode=require"
```

Apply schema and demo data:

```bash
npx prisma migrate deploy
npx prisma db seed
node scripts/provision-demo-clerk.js
```

Or: `node scripts/cutover-to-supabase.mjs`

## 2. Environment variables (Netlify)

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Supabase **pooled** URI (port 6543, `pgbouncer=true`) |
| `DIRECT_URL` | Yes | Supabase **direct** URI (port 5432) for migrations |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk |
| `CLERK_SECRET_KEY` | Yes | Clerk |
| `CLERK_WEBHOOK_SECRET` | Yes | Clerk user sync webhook |
| `CRON_SECRET` | Yes | Protects `/api/cron/*` |
| `DEMO_PASSWORD` | No | Defaults to `GearvoDemo2026!` |
| Stripe / Upstash / `INTEGRATION_SECRETS_KEY` | No | Optional |

Never set `ALLOW_DEV_AUTH_BYPASS=true` in production.

## 3. Build

`netlify.toml` runs:

```bash
npx prisma generate && npx prisma migrate deploy && npm run build
```

## 4. Post-deploy checks

1. Open `/sign-in` — Clerk works  
2. Create a shop at `/welcome/setup` — real workspace + full nav  
3. Open `/demo` — Al-Noor demo (isolated)  
4. CRUD a customer — persists after logout/login  

## 5. Clerk webhook

Point Clerk webhook to `https://<your-site>/api/webhooks/clerk` with `CLERK_WEBHOOK_SECRET`.
