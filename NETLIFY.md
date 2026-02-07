# Deploy Gearvo to Netlify

Use these settings when connecting your GitHub repo (riccodilios/gearvo) to Netlify.

---

## Build settings (in Netlify UI)

Netlify will use the repo’s **netlify.toml** by default. You can confirm or set:

| Setting | Value |
|--------|--------|
| **Build command** | `npx prisma generate && npm run build` |
| **Base directory** | (leave empty) |
| **Publish directory** | (leave empty – Next.js is auto-detected) |

Node version is set to **20** in `netlify.toml`.

---

## Environment variables (in Netlify UI)

In **Site settings → Environment variables**, add:

### Required

| Variable | Value | Scopes |
|----------|--------|--------|
| `DATABASE_URL` | Your PostgreSQL connection string (e.g. Neon or Supabase URL) | All (Production, Deploy previews, Branch deploys) |

Use the same `DATABASE_URL` you use locally (e.g. from Neon).  
**Do not** commit `.env`; set it only in Netlify.

### Optional (same as local .env)

| Variable | When to set |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | If using Clerk auth |
| `CLERK_SECRET_KEY` | If using Clerk auth |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | If using Stripe |
| `STRIPE_SECRET_KEY` | If using Stripe |
| `STRIPE_WEBHOOK_SECRET` | If using Stripe webhooks |
| `CLOUDINARY_*` | If using Cloudinary |

---

## Before first deploy

1. **Database:** Ensure your Postgres DB (e.g. Neon) is set up and `DATABASE_URL` in Netlify matches it.
2. **Schema:** Run once against that DB (from your machine or Neon SQL):
   - `npx prisma db push`
   - `npx prisma db seed` (optional demo data)
3. **Git:** Push the branch you want to deploy (e.g. `main`).

---

## Deploy steps

1. Log in to [Netlify](https://app.netlify.com).
2. **Add new site → Import an existing project** → choose **GitHub** and **riccodilios/gearvo**.
3. Netlify will read **netlify.toml** (build command and Node version).
4. Under **Environment variables**, add **DATABASE_URL** (and any optional vars).
5. Click **Deploy site**.

Later pushes to the connected branch will trigger new deploys automatically.
