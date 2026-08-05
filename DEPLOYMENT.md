# Gearvo - Deployment Guide (Vercel)

## Prerequisites

- Node.js 18+
- PostgreSQL database (Vercel Postgres, Supabase, or Neon)
- Vercel account

## 1. Database Setup

### Option A: Vercel Postgres

1. In your Vercel project, go to Storage → Create Database → Postgres
2. Copy the `DATABASE_URL` connection string
3. Add to environment variables

### Option B: Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → Database for connection string
3. Use the connection pooler URL for serverless

### Option C: Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string from the dashboard

## 2. Environment Variables

Add these to your Vercel/Netlify project:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
```

**Required in production:** Clerk keys. Without them the app fails closed (503 on private routes).

Never set `ALLOW_DEV_AUTH_BYPASS=true` in production.

Optional:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — SaaS billing (Integration Center)
- `INTEGRATION_SECRETS_KEY` — encrypt integration credentials at rest

## 3. Database Migration

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed   # optional demo company
```

Do **not** use `prisma db push` against production. Netlify build already runs `migrate deploy` (see `netlify.toml`).

Build command:

```bash
npx prisma generate && npx prisma migrate deploy && next build
```

## 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## 5. Post-Deploy Setup

1. Run migrations if not done during build:
   ```bash
   npx prisma migrate deploy
   ```

2. Seed initial data (one-time):
   ```bash
   npx prisma db seed
   ```

## 6. Multi-Tenant Considerations

- Each mechanic shop = tenant
- Add `x-tenant-id` header from auth context (Clerk org ID)
- Consider row-level security for additional isolation

## 7. Stripe Integration

1. Create Stripe account and get API keys
2. Set up webhook endpoint: `/api/webhooks/stripe`
3. Configure products for subscription plans (Trial, Basic, Pro, Enterprise)

## 8. Clerk Integration

1. Create Clerk application
2. Enable organizations for multi-tenant
3. Add middleware for protected routes
4. Map Clerk org to Prisma tenant
