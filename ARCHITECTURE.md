# Gearvo Architecture

Gearvo is a multi-tenant **Automotive Business Operating System**.

## Hierarchy

```
Platform Admin
  └── Company (workspace)
        └── Branch
              └── Users via Membership + AppRole
```

- **Company** = billing, branding, feature flags, integrations, subscription.
- **Branch** = operational isolation unit (customers, inventory, repairs, payments, analytics).
- **Membership** maps a Clerk user (`User.clerkId`) to a company, optional branch, and `AppRole`.

## Authentication flow

1. Clerk authenticates the browser session (required in production — fail-closed in `src/proxy.ts`).
2. `ensurePrismaUser()` upserts `User` from Clerk (webhook + first request).
3. `getWorkspaceContext()` loads active Membership; preferred company/branch come from **httpOnly** cookies **only after** membership validation.
4. Client headers such as `x-tenant-id` are **not** trusted. Dev-only `ALLOW_DEV_AUTH_BYPASS` + `x-dev-user-id` must never be enabled in production.

## Authorization (RBAC)

Permission keys live in `src/server/permissions.ts` (e.g. `customers:write`, `payments:write`, `platform:admin`).

Roles include Platform Owner/Admin, Company Owner/Admin, Branch Manager, Service Advisor, Technician, Cashier, Inventory Manager, Accountant, Receptionist, Employee.

**Intended rules (target):**

| Role class | Branch visibility |
|------------|-------------------|
| Platform / Company Owner / Company Admin | All branches |
| Branch-scoped roles | Own `membership.branchId` only |

Server actions should call `requirePermission(...)`. Feature modules should call `requireFeature(...)`.

> **RC1 note:** See [docs/RC1_HARDENING_AUDIT.md](./docs/RC1_HARDENING_AUDIT.md) — several by-id paths still filter `companyId` only (branch IDOR), and nav is not yet permission-gated.

## Data isolation

Every business row carries `companyId` and (where operational) `branchId`.

- List queries use `branchScope(ctx)` (current branch).
- Company-wide roles may switch branch via cookie after validation.
- Integrations and feature flags are **per company**, never shared across companies.

## Key server modules

| Module | Path |
|--------|------|
| Workspace context / authz | `src/server/auth.ts` |
| Permission matrix | `src/server/permissions.ts` |
| Activity / audit log | `src/server/audit.ts` |
| Feature flags | `src/server/features.ts` |
| Integration Center | `src/server/integrations/registry.ts` |
| Document sequences | `src/server/sequences.ts` |
| Env validation | `src/server/env.ts` |

## Database

PostgreSQL via Prisma. Schema: `prisma/schema.prisma`.  
Migrations: `prisma/migrations/` — deploy with `npx prisma migrate deploy` (not `db push` in production).

Core domains: CRM (Customer, Vehicle), Inventory (Supplier, CarPart), Repairs, Invoices/Payments/Installments, Purchase Orders, Expenses, ActivityLog, CompanyFeatureFlag, CompanyIntegration.

## Local development

See [SETUP.md](./SETUP.md). For Clerk-free local demo only:

```env
ALLOW_DEV_AUTH_BYPASS=true
```

Seed creates `demo-auto` (Al-Noor Auto Care) and `dev_clerk_owner`.

## Production deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [NETLIFY.md](./NETLIFY.md).

Required: `DATABASE_URL`, Clerk publishable + secret keys, `CLERK_WEBHOOK_SECRET` for user sync.

Build: `prisma generate` → `prisma migrate deploy` → `next build`.

## Localization (Saudi)

- Default currency **SAR**, timezone **Asia/Riyadh**.
- Company fields: Commercial Registration (CR), VAT number.
- EN/AR language switcher exists; **full string coverage and RTL layout are RC1 open items** (see hardening audit).

## Explicit post-v1.0

- Offline PWA / background sync
- Live ZATCA e-invoicing
- Live WhatsApp / Stripe SaaS billing beyond Integration Center stubs
