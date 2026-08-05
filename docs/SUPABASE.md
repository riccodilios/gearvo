# Supabase PostgreSQL for Gearvo

Gearvo uses **Supabase PostgreSQL** as its only database, accessed through **Prisma**. Clerk remains the authentication provider (unchanged).

## Architecture

| Layer | Technology |
|-------|------------|
| Auth | Clerk |
| ORM | Prisma |
| Database | Supabase PostgreSQL |
| Hosting | Netlify (Next.js) |

Prisma uses two URLs (required on Netlify and recommended locally against hosted Supabase):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled connection (Transaction mode, port **6543**, `pgbouncer=true`) for the Next.js app |
| `DIRECT_URL` | Direct/session connection (port **5432**) for `prisma migrate deploy` |

## Local development (Docker)

```bash
npx supabase start
```

Then in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

```bash
npx prisma migrate deploy
npx prisma db seed
node scripts/provision-demo-clerk.js   # links demo.owner / demo.manager Clerk users
npm run dev
```

Studio: http://127.0.0.1:54323

Stop:

```bash
npx supabase stop
```

## Hosted Supabase (production / Netlify)

### Option A — CLI script (recommended)

1. Create an access token: https://supabase.com/dashboard/account/tokens  
2. PowerShell:

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_..."
# optional: $env:SUPABASE_REGION="ap-southeast-1"
node scripts/create-supabase-cloud.mjs
node scripts/cutover-to-supabase.mjs
```

### Option B — Dashboard

1. Create a project at https://supabase.com/dashboard  
2. **Project Settings → Database**  
3. Copy:
   - **Connection string → URI** (direct) → `DIRECT_URL` (add `?sslmode=require`)
   - **Connection pooling → Transaction** URI → `DATABASE_URL` (ensure `pgbouncer=true` and `sslmode=require`)

4. Apply schema + seed:

```bash
npx prisma migrate deploy
npx prisma db seed
node scripts/provision-demo-clerk.js
```

## Netlify environment variables

Copy **all** of these into Netlify → Site configuration → Environment variables:

```
DATABASE_URL=<Supabase pooled URI with pgbouncer=true&sslmode=require>
DIRECT_URL=<Supabase direct URI with sslmode=require>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk>
CLERK_SECRET_KEY=<from Clerk>
CLERK_WEBHOOK_SECRET=<from Clerk>
CRON_SECRET=<random string>
```

Optional: Stripe, Upstash, `DEMO_PASSWORD`, `INTEGRATION_SECRETS_KEY`.

Build already runs `prisma migrate deploy` via `netlify.toml`.

## Demo accounts (after seed + provision)

| Role | Email | Password |
|------|-------|----------|
| Owner | `demo.owner@gearvo.app` | `GearvoDemo2026!` |
| Manager | `demo.manager@gearvo.app` | `GearvoDemo2026!` |

Enter via `/demo`.

## Neon

Neon is **not** used. Do not set Neon connection strings.
