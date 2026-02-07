# Clerk authentication in Gearvo

Gearvo is wired for **Clerk** so you can add proper sign-in, sign-up, and account management. When Clerk is not configured, the app still runs with tenant-only mode (create shop, use dashboard with no user accounts).

---

## 1. Enable Clerk

1. **Create a Clerk application** at [dashboard.clerk.com](https://dashboard.clerk.com).
2. **Get your keys**: Application → API Keys. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
3. **Add to `.env`** (and to Netlify / your host’s env):
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
   CLERK_SECRET_KEY=sk_test_xxxx
   ```
   **Netlify:** Set both in Site → Environment variables. If only one is set, the app can show “Application error” on load; add both and redeploy.
4. **Restart** the dev server or redeploy.

After that:

- **Landing** “Sign in” and “Sign up” go to `/sign-in` and `/sign-up` (Clerk UI).
- **App routes** (`/dashboard`, `/customers`, etc.) require sign-in; unauthenticated users are redirected to `/sign-in`.
- **Sidebar** shows Clerk’s **UserButton** (avatar, account, sign out) when signed in.
- **Tenant “Sign out”** in the sidebar still clears the current shop (tenant-id cookie); use **UserButton → Sign out** to sign out of your account.

---

## 2. What’s already done

| Item | Status |
|------|--------|
| `ClerkProvider` in root layout (when keys set) | Done |
| `proxy.ts` (Next.js 16) / middleware with `clerkMiddleware` | Done |
| Public routes: `/`, `/sign-in`, `/sign-up`, `/welcome` | Done |
| Protected routes: everything under `/dashboard`, `/customers`, etc. | Done |
| Sign-in page `/sign-in` with Gearvo styling (amber/dark) | Done |
| Sign-up page `/sign-up` → redirect after sign-up to `/welcome/setup` | Done |
| Landing “Sign in” / “Sign up” links | Done |
| Sidebar `UserButton` when signed in | Done |
| Optional: app works without Clerk (no keys = no auth, tenant-only) | Done |

---

## 3. What’s left for finetuning

- **Sync Clerk user to your DB**  
  The Prisma `User` model has `clerkId`, `email`, `fullName`, `tenantId`, `role`. You can:
  - On first sign-in or after sign-up, create or update a `User` row (e.g. in a server action or webhook) and link `clerkId` to the current tenant.
  - Use Clerk’s **webhooks** (e.g. `user.created`, `user.updated`) to keep `User` in sync with Clerk.
  - Settings → Team will then show real users from your DB.

- **Assign tenant after sign-up**  
  Right now, after sign-up users go to `/welcome/setup` to create or select a shop. You can:
  - Pre-create a tenant per organization (Clerk Organizations) and redirect there, or
  - Keep the current flow and optionally create a `User` record with the new tenant when they complete “Create your shop”.

- **Clerk appearance**  
  Sign-in/sign-up use amber primary and dark background. To change:
  - Edit `app/layout.tsx` → `ClerkProvider` `appearance.variables`.
  - Edit `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` → `SignIn` / `SignUp` `appearance`.

- **Social / OAuth**  
  In the Clerk dashboard, enable Google, GitHub, etc. under User & Authentication → Social connections. No code change needed.

- **Organizations**  
  If you want one Clerk Organization per shop (tenant), enable Organizations in Clerk and map `organizationId` to your `Tenant` (e.g. store `clerkOrgId` on `Tenant` and sync via webhooks or after “Create your shop”).

- **Without Clerk**  
  If you leave the Clerk env vars unset:
  - `/sign-in` and `/sign-up` redirect to `/dashboard` and `/welcome/setup`.
  - App routes are not protected by Clerk; only tenant cookie applies.
  - Sidebar does not show `UserButton`.  
  If the proxy throws when Clerk keys are missing, add both keys (or use test keys from the Clerk dashboard) or temporarily stub the proxy.

---

## 4. Env reference

| Variable | Required for Clerk | Description |
|----------|--------------------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (server-only) |

All other env vars (e.g. `DATABASE_URL`, Stripe) are unchanged.
