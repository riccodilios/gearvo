# Gearvo presentation demo

## What you get

A permanent company **Al-Noor Auto Care** (`slug: demo-auto`) with:

- CR `1010123456`, VAT `300012345600003`, logo, Riyadh Main + North branches
- 7 staff roles (owner → inventory manager + north manager)
- 48 customers, 80+ vehicles, ~184 parts, months of repairs/invoices/payments/installments
- Purchase orders, expenses, activity — dashboards look alive

## Enter the demo

### Production (Clerk)

| Role | Email | Password |
|------|-------|----------|
| Company Owner (platform admin) | `demo.owner@gearvo.app` | `GearvoDemo2026!` |
| Branch Manager · Riyadh Main | `demo.manager@gearvo.app` | `GearvoDemo2026!` |

1. Open `/sign-in`
2. Sign in with the owner credentials
3. Open `/dashboard` — Al-Noor Auto Care loads automatically

Re-provision Clerk links after a full demo reset:

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
