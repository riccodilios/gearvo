# Gearvo presentation demo

## What you get

A permanent company **Al-Noor Auto Care** (`slug: demo-auto`) with:

- CR `1010123456`, VAT `300012345600003`, logo, Riyadh Main + North branches
- 7 staff roles (owner → inventory manager + north manager)
- 48 customers, 80+ vehicles, ~184 parts, months of repairs/invoices/payments/installments
- Purchase orders, expenses, activity — dashboards look alive

## Enter the demo

1. Open `/demo` for instructions, or `/dashboard` after auth.
2. **Local bypass:** `ALLOW_DEV_AUTH_BYPASS=true` and `DEV_USER_CLERK_ID=dev_clerk_owner` (default owner).
3. **Clerk:** sign in as a user that is a member of Al-Noor / platform admin.

Demo emails (local identities):

| Role | Email | Clerk ID |
|------|-------|----------|
| Owner (platform admin) | owner@demo.gearvo.local | `dev_clerk_owner` |
| Branch manager | manager@demo.gearvo.local | `dev_clerk_manager` |
| Service advisor | advisor@demo.gearvo.local | `dev_clerk_advisor` |
| Technician | tech@demo.gearvo.local | `dev_clerk_tech` |
| Cashier | cashier@demo.gearvo.local | `dev_clerk_cashier` |
| Inventory | inventory@demo.gearvo.local | `dev_clerk_inventory` |

## Reset demo data

One-click from:

- **Platform** → Demo environment → Reset demo data
- **`/demo`** page (when signed in as admin/demo manager)

Or CLI:

```bash
npm run db:seed
```

Reset recreates the full dataset in-process (no serverless `exec` required).
