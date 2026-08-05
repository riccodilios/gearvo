# Gearvo – Setup guide (Supabase PostgreSQL + Clerk)

## 1. Prerequisites

- **Node.js** 20+
- **Docker Desktop** (for local Supabase) **or** a hosted [Supabase](https://supabase.com) project
- **Clerk** keys for auth (required in production)

See [docs/SUPABASE.md](./docs/SUPABASE.md) for database details.

---

## 2. Install

```bash
npm install
cp .env.example .env
```

---

## 3. Database

### Local Supabase (recommended for development)

```bash
npx supabase start
```

`.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

### Hosted Supabase

Paste pooled + direct URLs from the Supabase dashboard into `DATABASE_URL` and `DIRECT_URL` (see `.env.example`).

---

## 4. Migrate + seed

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
node scripts/provision-demo-clerk.js
```

---

## 5. Clerk

Add to `.env`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

Local-only without Clerk:

```env
ALLOW_DEV_AUTH_BYPASS=true
```

Never enable bypass in production.

---

## 6. Run

```bash
npm run dev
```

- App: http://localhost:3000  
- Create shop: `/welcome/setup`  
- Demo: `/demo`  

---

## Verification

1. Sign in with a real Clerk user → create a company → sidebar shows Customers, Repairs, Inventory, etc.  
2. Create a customer → sign out → sign in → customer still there  
3. Demo account only sees Al-Noor data (`demo-auto`)
