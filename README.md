# Gearvo - Automotive Business Operating System

Production-ready multi-tenant SaaS for mechanic shops: inventory, CRM, repair orders, invoices, payments, and analytics.

## Tech stack

| Layer | Stack |
|-------|--------|
| App | Next.js 16, TypeScript, Tailwind, shadcn/ui |
| Auth | **Clerk** |
| ORM | **Prisma** |
| Database | **Supabase PostgreSQL** |
| Hosting | Netlify |

## Quick start

**Full guide:** [SETUP.md](./SETUP.md) · **Database:** [docs/SUPABASE.md](./docs/SUPABASE.md) · **Deploy:** [NETLIFY.md](./NETLIFY.md)

```bash
npm install
cp .env.example .env

# Local Supabase (Docker)
npx supabase start
# Set DATABASE_URL + DIRECT_URL to postgresql://postgres:postgres@127.0.0.1:54322/postgres

npx prisma migrate deploy
npx prisma db seed
node scripts/provision-demo-clerk.js

npm run dev
```

Open http://localhost:3000 → create your shop at `/welcome/setup`, or open `/demo` for the presentation environment.

## Project structure

```
src/
├── app/           # Routes + server actions
├── components/    # UI
├── server/        # Auth, RBAC, features, demo seed
└── i18n/
prisma/            # Schema + migrations
supabase/          # Local Supabase config
docs/SUPABASE.md   # Database migration & connection guide
```

## Multi-tenant model

Company → Branch → Membership (Clerk user + AppRole). Demo company `demo-auto` is isolated from production accounts.

## License

Private / proprietary unless otherwise stated.
