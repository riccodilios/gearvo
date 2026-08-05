# Gearvo RC1 Hardening Audit

**Date:** 2026-08-05  
**Last updated:** 2026-08-05 (RC1 waves A–E implemented)  
**Scope:** Release Candidate 1 — production readiness for Saudi pilot workshops  

**Verdict (post-waves):** Critical security blockers (C1–C3) and High isolation/RBAC blockers (H1–H2) are closed. Business integrity (H3–H4, H9), production hardening (H5–H6, H10), and a first-pass Saudi commercial layer (C4/H7/H8) plus design-system unification (E) are in place. **Residual risk for public pilot:** deep Arabic coverage on every CRUD dialog/dashboard string, ZATCA e-invoicing, and Upstash rate-limit config in production.

---

## Wave status

| Wave | Items | Status |
|------|--------|--------|
| RC1-A | C1, C2, C3, H1, H2 | Done |
| RC1-B | H3, H4, H9 | Done |
| RC1-C | H5, H6, H10 | Done |
| RC1-D | C4, H7, H8 | Done (first commercial pass; expand dictionaries further for forms) |
| RC1-E | Design system | Done (shared primitives unified) |

---

## What’s already solid

- Company-level scoping on most writes; membership required for workspace cookies
- Fail-closed Clerk middleware in production; httpOnly workspace cookies
- Payment overpay guard; stock concurrency on RO create; idempotent PO receive
- Integration secrets stripped before client; security headers (minus CSP)
- List endpoints mostly paginated; Zod on core mutations
- Happy-path lifecycle exists: Customer → Vehicle → RO → Invoice → Payment → Installment → Activity
- Secured cron for overdue installments; `accessibleWhere` on by-id paths
- Friendly `AppError` / `formError`; Upstash-capable rate limiting
- Dashboard SQL aggregates; bilingual marketing + app nav; RTL hydrate; PWA icons + SW

---

## 1. Remaining Critical Issues

### C1 — Unauthenticated global installment overdue job
| | |
|--|--|
| **Where** | [`src/app/actions/invoices.ts`](src/app/actions/invoices.ts) `markOverdueInstallments` |
| **Why it matters** | Server action with no auth and no `companyId` filter |
| **Impact** | Any caller can flip PENDING→OVERDUE for **every company** |
| **Solution** | Remove public export; run via secured cron with platform secret; always filter by company or use system job role |
| **Complexity** | S |
| **Effort** | 0.5 day |
| **Status** | **RESOLVED** — cron `POST /api/cron/overdue` + `CRON_SECRET`; action no longer globally public |

### C2 — Cross-branch IDOR on get/update/delete-by-id
| | |
|--|--|
| **Where** | Customers, vehicles, ROs, invoices, inventory, suppliers, marketplace — filters `companyId` only, not `branchId ∈ ctx.branchIds` |
| **Why it matters** | Branch isolation is the product promise for multi-location shops |
| **Impact** | Branch Manager A who learns Branch B entity IDs can read/mutate Branch B data |
| **Solution** | Central `assertEntityAccess(ctx, entity)` requiring `companyId` + (`branchId` in `ctx.branchIds` or company-wide role); apply to every by-id path |
| **Complexity** | M |
| **Effort** | 2–3 days |
| **Status** | **RESOLVED** — `accessibleWhere(ctx)` / branch checks on by-id paths |

### C3 — Activity permission check swallowed
| | |
|--|--|
| **Where** | [`src/app/actions/workspace.ts`](src/app/actions/workspace.ts) `requirePermission('activity:read').catch(() => null)` |
| **Why it matters** | Audit logs contain sensitive operational/financial events |
| **Impact** | Any workspace member can read full company activity regardless of role |
| **Solution** | Await `requirePermission` without catch; branch-filter feed for scoped roles |
| **Complexity** | S |
| **Effort** | 0.5 day |
| **Status** | **RESOLVED** |

### C4 — Arabic localization is scaffolding only
| | |
|--|--|
| **Where** | [`src/i18n/dictionaries.ts`](src/i18n/dictionaries.ts) unused by UI; marketing + app hardcoded English |
| **Why it matters** | Saudi market requirement; bilingual was an Option 2 launch claim |
| **Impact** | Cannot sell as Arabic-first; EN/AR toggle only mirrors English layout partially |
| **Solution** | Adopt next-intl (or expand dictionaries) for **all** app + marketing strings; apply `dir` on hydrate; Arabic font subset; logical CSS (`ps`/`pe`/`start`/`end`) for sidebar |
| **Complexity** | XL |
| **Effort** | 2–3 weeks |
| **Status** | **PARTIALLY RESOLVED** — marketing pages, home, nav, footer bilingual; RTL hydrate + IBM Plex Arabic; app sidebar/labels translated. **Remaining:** dialog forms, dashboard stat titles, list empty copy still mostly EN |

---

## 2. Remaining High Priority Issues

### H1 — Null `branchId` membership grants all-branch access
| **Status** | **RESOLVED** — only company-wide roles may have null branch |

### H2 — Nav and routes ignore RBAC + feature flags
| **Status** | **RESOLVED** — gated sidebar + `gatePage` |

### H3 — CANCELLED repair does not restore stock
| **Status** | **RESOLVED** — transactional stock restore |

### H4 — Soft-delete incomplete
| **Status** | **RESOLVED** — cascade + `deletedAt` filters |

### H5 — Unbounded dashboard/analytics queries
| **Status** | **RESOLVED** — SQL aggregates / batched trends / low-stock SQL |

### H6 — Raw errors exposed to clients
| **Status** | **RESOLVED** — `AppError` + `formError` / `toUserError` |

### H7 — RTL layout broken / not hydrated
| **Status** | **RESOLVED** — boot script + logical CSS + provider sync |

### H8 — PWA / mobile marketing gaps
| **Status** | **RESOLVED** — PNG icons, SW, mobile marketing menu |

### H9 — Workflow deep-link / route bugs
| **Status** | **RESOLVED** |

### H10 — Rate limiting ineffective
| **Status** | **RESOLVED** — memory + optional Upstash; wired on payments/members/RO/invoice/stock/company create |

---

## Residual pilot blockers (non-silent)

1. **Arabic depth (C4 residual):** Wire remaining dashboard/form strings through dictionaries before calling the product fully Arabic-native.
2. **Production env:** Set `CRON_SECRET`, `UPSTASH_REDIS_*`, Clerk keys, `INTEGRATION_SECRETS_KEY`.
3. **ZATCA / fiscal:** Still readiness-only (Medium from original audit) — not required for soft pilot if invoices stay internal.
4. **CSP header:** Still missing (Medium).

---

## Original detail (pre-wave)

_The sections below preserve the original finding descriptions for historical reference._

| ID | Issue | Why / Impact | Solution | Complexity | Effort |
|----|--------|--------------|----------|------------|--------|
| M1 | UX inconsistency (cards vs tables, empty states, duplicate header branding) | Feels unfinished; slows training | Design tokens + shared ListPage/EmptyState/Table patterns; single brand chrome | M | 3–5 days |
| M2 | No loading skeletons on data pages | Perceived lag | Per-route `loading.tsx` skeletons | S | 1 day |
| M3 | RO/Invoice search is client-side on current page only | Misses matches | Server-side `q` like customers | S | 1 day |
| M4 | Missing UI: adjust stock, delete customer/part, vehicles hub | Incomplete CRUD | Wire confirm dialogs | M | 2 days |
| M5 | Stackable installment plans; Invoice OVERDUE never auto-set | AR confusion | Block second plan; cron for invoice overdue | S | 1 day |
| M6 | Cross-branch RO attach (company-wide user stamps active branch on other branch’s customer) | Dirty data | Require customer.branchId === ctx.branch.id or explicit transfer | S | 1 day |
| M7 | Parts immutable after RO create | Ops friction | Allow add/remove with stock adjust in transaction | M | 2 days |
| M8 | Feature flags not on all modules (RO/invoice reads) | Plan gating incomplete | Gate reads + nav consistently | S | 1 day |
| M9 | No CSP; env Zod soft-fail | XSS / misconfig surface | CSP headers; fail hard on invalid prod env | S | 1 day |
| M10 | Accessibility: contrast zinc-500, mobile focus trap, unlabeled marketing forms | A11y / professionalism | Contrast tokens; Escape/focus trap; labels | M | 2 days |
| M11 | Unused deps (React Query unused, Stripe unused, some Radix) | Bundle bloat | Remove or wire | S | 0.5 day |
| M12 | Charts not code-split; USD `$` in one chart axis | Perf / Saudi polish | `next/dynamic`; SAR formatter everywhere | S | 1 day |
| M13 | Platform link visible to all | Info leak / clutter | Hide unless `isPlatformAdmin` | S | 0.5 day |
| M14 | Activity feed not branch-filtered | Branch privacy | Filter by `branchIds` for scoped roles | S | 0.5 day |
| M15 | Dual locale sources (company.locale vs localStorage) | Drift | Single source of truth | S | 1 day |

---

## 4. Remaining Low Priority Improvements

| ID | Issue | Solution | Effort |
|----|--------|----------|--------|
| L1 | Duplicate StatusBadge / search components | Shared components | 0.5 day |
| L2 | Analytics “Current month” label vs 14-day data | Fix copy | 0.1 day |
| L3 | Unused imports (Table on suppliers, etc.) | Lint cleanup | 0.2 day |
| L4 | Dialog close hit target small | Larger touch area | 0.2 day |
| L5 | `AnalyticsEvent` unused | Use or remove | 0.5 day |
| L6 | Expenses/Appointments schema without UI | Defer or stub pages | later |
| L7 | Hijri calendar toggle | Add with Saudi pack | 1–2 days |
| L8 | Full offline PWA / background sync | Post-v1.0 | XL |
| L9 | Live ZATCA / WhatsApp / Stripe SaaS billing | Integration Center phase 2 | L–XL |
| L10 | Playwright e2e isolation suite | Add to CI | 3–5 days |

---

## Workshop lifecycle verification matrix

| Step | Works? | Gaps |
|------|--------|------|
| Create customer | Yes | No delete UI; soft-delete incomplete |
| Add vehicle | Yes | VIN/mileage UI partial; no vehicles hub |
| Create RO + consume parts | Yes | Stock not restored on cancel |
| Inventory updated | Yes (on create/receive) | No adjust-stock UI |
| Generate invoice | Yes (manual + auto on complete) | — |
| Partial payment | Yes (capped) | `#pay` deep link broken |
| Installment plan | Yes | Can stack plans; overdue job unsafe |
| Remaining balance | Yes | Invoice OVERDUE not auto |
| Repair completed | Yes | — |
| Analytics updated | Partially | Heavy queries; not event-sourced |
| Activity log | Yes | RBAC bypass (C3) |

---

## Branch isolation matrix

| Actor | Expected | Actual |
|-------|----------|--------|
| Branch Manager A | Branch A only | Lists OK; **by-id IDOR** to Branch B (C2) |
| Company Admin | All branches | Yes (switcher) |
| Employee with null branchId | Should be branch-bound | **Treated as company-wide** (H1) |
| Platform Admin | All companies | Page gated; nav always visible |
| Feature flags | Gate modules | Partial on writes only |
| Integrations | Per-company | OK; secrets not exposed |

---

## Recommended RC1 → v1.0 fix order

1. **C1, C3, H1** (security quick wins)  
2. **C2** (branch IDOR — blocker for multi-branch pilots)  
3. **H3, H4, H9** (workflow integrity)  
4. **H2, H6, H10, M9** (gates, errors, rate limit, CSP)  
5. **H5** (performance before demos with real data)  
6. **C4 + H7** (Arabic — required for Saudi commercial launch)  
7. **H8, M1, M10** (mobile, design system, a11y polish)

Estimated to close Critical + High (excluding full Arabic XL): **~2–3 weeks**.  
Full Arabic + design-system polish: **+2–4 weeks**.

---

## Documentation index (updated)

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Hierarchy, auth, permissions, isolation rules |
| [SETUP.md](./SETUP.md) | Local development |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deploy |
| [CHANGELOG.md](./CHANGELOG.md) | Release notes |
| This file | RC1 hardening backlog |
