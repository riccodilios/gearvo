# Gearvo – Full setup guide

Follow these steps to get the app running with a real database and all features working.

---

## 1. Prerequisites

- **Node.js** 18+ (check: `node -v`)
- **PostgreSQL** – choose one:
  - **Option A:** [PostgreSQL](https://www.postgresql.org/download/) installed locally (default port 5432)
  - **Option B:** Docker: `docker run -d --name gearvo-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gearvo -p 5432:5432 postgres:16`
  - **Option C:** Free hosted DB – [Neon](https://neon.tech) or [Supabase](https://supabase.com) (get connection string from dashboard)

---

## 2. Install dependencies

```bash
cd c:\Users\2007r\Gearvo
npm install
```

---

## 3. Environment variables

Create `.env` from the example:

```bash
cp .env.example .env
```

Edit `.env` and set **at least** the database URL:

**Local PostgreSQL (default user/password):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gearvo?schema=public"
```

**Docker (as above):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gearvo?schema=public"
```

**Neon / Supabase:**  
Paste the connection string they give you, e.g.:
```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

*(Clerk, Stripe, Cloudinary in `.env.example` are optional and can be added later.)*

---

## 4. Create database and tables

From the project root:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

- **generate** – builds the Prisma client  
- **db push** – creates/updates tables in your database  
- **db seed** – creates demo tenant “Demo Auto Shop”, sample customers, vehicles, parts, repair orders, invoices

If any command fails, check that PostgreSQL is running and `DATABASE_URL` in `.env` is correct (user, password, host, port, database name).

---

## 5. Run the app

```bash
npm run dev
```

Open **http://localhost:3000**.

---

## 6. First-time flow

- **Landing (**`/`**)** – marketing page; use **“Create your shop”** or **“Sign in”**.
- **Set up your shop (**`/welcome/setup`**)**  
  - If the DB is connected, use **“Create your shop”**: enter shop name and slug (e.g. `my-garage`).  
  - This creates your tenant and sets the `tenant-id` cookie so all pages use your shop.
- **Dashboard (**`/dashboard`**)**  
  - After creating a shop you’ll be redirected here.  
  - If you ran `db:seed`, you’ll see data for “Demo Auto Shop”. You can create a new shop from `/welcome/setup` and then add your own data.

**Without a database:**  
If `DATABASE_URL` is wrong or PostgreSQL is not running, the app runs in **demo mode** (read-only, no real data). Use “Continue in demo mode” on the setup page, or fix the DB and refresh.

---

## 7. Verify everything works

| Action | Where | Expected |
|--------|--------|----------|
| View dashboard KPIs | `/dashboard` | Numbers and charts (or zeros if new tenant) |
| Add a customer | `/customers` → “Add customer” | Saves and appears in list |
| Add a vehicle | Customer detail → Vehicles tab | Saves and shows under customer |
| Add a supplier | `/suppliers` | Saves and appears in list |
| Add inventory | `/inventory` | Part created; low-stock alert if quantity &lt; threshold |
| Create repair order | `/repair-orders` | RO created; can “Generate invoice” |
| Pay an invoice | `/invoices` → Pay | Payment recorded; balance updates |
| View analytics | `/analytics` | Revenue/profit and payment-method charts |

---

## 8. Optional: Auth (Clerk) and payments (Stripe)

- **Clerk:** Create an app at [clerk.com](https://clerk.com), add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env`. Then wire sign-in/sign-up in your layout and protect routes as needed.
- **Stripe:** Create a project at [stripe.com](https://stripe.com), add the publishable and secret keys (and webhook secret if using webhooks) to `.env`. Use them in your payment flow (e.g. checkout or “Pay” on invoices).

The app runs and all core features (customers, vehicles, suppliers, inventory, repair orders, invoices, analytics) work with only `DATABASE_URL` set.

---

## Quick reference

| Task | Command |
|------|--------|
| Dev server | `npm run dev` |
| Regenerate Prisma client | `npx prisma generate` |
| Apply schema to DB | `npx prisma db push` |
| Seed demo data | `npx prisma db seed` |
| Open DB GUI | `npx prisma studio` |
| Production build | `npm run build` && `npm start` |

If something doesn’t work, double-check: (1) PostgreSQL is running, (2) `DATABASE_URL` in `.env` is correct, (3) you ran `prisma db push` and `prisma db seed` after setting `DATABASE_URL`.
