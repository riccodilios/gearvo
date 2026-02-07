# Gearvo - Mechanic Shop Operating System

A production-ready multi-tenant SaaS platform for mechanic shops. Manage inventory, customers, repair orders, invoices, payments, and business analytics.

## Features

- **Dashboard** - Revenue, profit, outstanding balance, low stock alerts, revenue trends
- **CRM** - Customer profiles with vehicles, purchase history, tags (VIP, Late payer, etc.)
- **Repair Orders** - Create jobs, track parts used, calculate profit, auto-reduce stock
- **Inventory** - Car parts with suppliers, cost/retail pricing, low stock alerts
- **Invoices** - Generate from repair orders, record payments, installment plans
- **Suppliers** - Manage parts suppliers
- **Analytics** - Revenue vs profit, trends, forecasts
- **Multi-tenant** - Data isolation per shop

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui (Radix), Recharts
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: Ready for Clerk (optional)
- **Payments**: Ready for Stripe (optional)

## Quick Start

**→ For full step-by-step setup (database options, first-time flow, verification), see [SETUP.md](./SETUP.md).**

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL (PostgreSQL – see SETUP.md for local/Docker/hosted options)

# Create DB and seed demo data
npx prisma generate
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Create your shop** at `/welcome/setup` to create a tenant, then go to `/dashboard`.

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Main app routes (with sidebar layout)
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── repair-orders/
│   │   ├── inventory/
│   │   ├── invoices/
│   │   ├── suppliers/
│   │   ├── analytics/
│   │   └── settings/
│   ├── actions/         # Server actions
│   └── providers.tsx
├── components/
│   ├── ui/              # shadcn components
│   ├── dashboard/
│   ├── customers/
│   ├── repair-orders/
│   ├── inventory/
│   ├── invoices/
│   ├── suppliers/
│   └── analytics/
└── lib/
    ├── db.ts
    ├── utils.ts
    ├── validations.ts
    └── tenant.ts
```

## Database Schema

- **Tenant** - Shop/organization
- **User** - Staff with roles (Owner, Manager, Employee)
- **Customer** - Clients with tags, total_spent, outstanding_balance
- **Vehicle** - Cars linked to customers
- **Supplier** - Parts suppliers
- **CarPart** - Inventory with cost/retail, stock levels
- **RepairOrder** - Jobs with parts used, profit calculation
- **Invoice** - Billing with items, payments, installments
- **Payment** - Payment records

## Environment Variables

See `.env.example` for required and optional variables.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel deployment instructions.
