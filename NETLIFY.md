# Deploy Gearvo to Netlify (Supabase + Clerk)

## Build settings

Netlify reads **netlify.toml**. Confirm:

| Setting | Value |
|--------|--------|
| **Build command** | (from netlify.toml) `npx prisma generate && npx prisma migrate deploy && npm run build` |
| **Node** | 20 |

## Environment variables (copy into Netlify)

### Required

```
DATABASE_URL=<Supabase Transaction pooler connection string>
DIRECT_URL=<Supabase direct connection string>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<Clerk publishable key>
CLERK_SECRET_KEY=<Clerk secret key>
CLERK_WEBHOOK_SECRET=<Clerk webhook secret>
CRON_SECRET=<long random string>
```

### How to get Supabase URLs

1. [Supabase Dashboard](https://supabase.com/dashboard) → your **gearvo** project  
2. **Project Settings → Database**  
3. **Connection string**  
   - **URI** (direct, port 5432) → paste as `DIRECT_URL` and append `?sslmode=require` if missing  
   - **Connection pooling** → mode **Transaction**, port **6543** → paste as `DATABASE_URL` with `pgbouncer=true&sslmode=require`

Example shapes (do not copy literally):

```
DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
DIRECT_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

### Optional

| Variable | When |
|----------|------|
| `DEMO_PASSWORD` | Override demo login password |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limits |
| `INTEGRATION_SECRETS_KEY` | Encrypt integration secrets |

## Before first deploy

On your machine (against the **same** Supabase project Netlify will use):

```bash
npx prisma migrate deploy
npx prisma db seed
node scripts/provision-demo-clerk.js
```

Then push `main` and deploy. Later pushes re-run `migrate deploy` automatically.

## After deploy

- Production shop: sign up → `/welcome` → create company → full navigation  
- Demo: `/demo` with `demo.owner@gearvo.app` / `GearvoDemo2026!`  
- Neon is not used anywhere in this project
