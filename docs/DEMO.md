# Gearvo presentation demo

## What you get

A permanent company **Al-Noor Auto Care** (`slug: demo-auto`) with:

- CR `1010123456`, VAT `300012345600003`, logo, Riyadh Main + North branches
- 7 staff roles (owner → inventory manager + north manager)
- 48 customers, 80+ vehicles, ~184 parts, months of repairs/invoices/payments/installments
- Purchase orders, expenses, activity — dashboards look alive

## Enter the demo

### Production (Clerk) — recommended path (no OTP)

1. Open **`/demo`**
2. Use **Enter demo (no OTP)** with:

| Role | Email | Password |
|------|-------|----------|
| Company Owner | `demo.owner@gearvo.app` | `GearvoDemo2026!` |
| Branch Manager | `demo.manager@gearvo.app` | `GearvoDemo2026!` |

This uses a Clerk sign-in ticket for demo accounts only, so email OTP is skipped.

Regular `/sign-in` may still prompt for OTP depending on your Clerk dashboard “email code / client trust” settings — that is instance-wide and cannot be disabled for one account only inside Clerk.

Seed/reset now re-links `demo.owner@` / `demo.manager@` Clerk accounts automatically when `CLERK_SECRET_KEY` is set. If nav is empty after a reset, run:

```bash
node scripts/provision-demo-clerk.js
```

### Local bypass

Set `ALLOW_DEV_AUTH_BYPASS=true` and open `/dashboard` (uses `dev_clerk_owner`).


## Reset demo data

One-click from:

- **Platform** → Demo environment → Reset demo data
- **`/demo`** page (when signed in as admin/demo manager)

Or CLI:

```bash
npm run db:seed
```

Reset recreates the full dataset in-process (no serverless `exec` required).
