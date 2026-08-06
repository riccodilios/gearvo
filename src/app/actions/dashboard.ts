'use server';

import { prisma } from '@/lib/db';
import { getWorkspaceContext, branchScope } from '@/server/auth';

export async function getDashboardStats() {
  const ctx = await getWorkspaceContext();
  if (!ctx) {
    return {
      revenueToday: 0,
      revenueWeek: 0,
      revenueMonth: 0,
      revenueYear: 0,
      profitMonth: 0,
      outstanding: 0,
      upcomingInstallments: 0,
      inventoryValue: 0,
      lowStockCount: 0,
      openRepairs: 0,
      customersCount: 0,
      forecastNextMonth: 0,
    };
  }

  const scope = branchScope(ctx);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    paymentsToday,
    paymentsWeek,
    paymentsMonth,
    paymentsYear,
    repairsMonth,
    outstandingAgg,
    installments,
    inventoryAgg,
    lowStockCount,
    openRepairs,
    customersCount,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { ...scope, paymentDate: { gte: startOfDay } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { ...scope, paymentDate: { gte: startOfWeek } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { ...scope, paymentDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { ...scope, paymentDate: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.repairOrder.aggregate({
      where: {
        ...scope,
        deletedAt: null,
        createdAt: { gte: startOfMonth },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { profit: true },
    }),
    prisma.invoice.aggregate({
      where: {
        ...scope,
        deletedAt: null,
        status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
      },
      _sum: { remainingBalance: true },
    }),
    prisma.installment.aggregate({
      where: {
        ...scope,
        status: { in: ['PENDING', 'OVERDUE'] },
        dueDate: { lte: in30 },
      },
      _sum: { amount: true },
    }),
    prisma.$queryRaw<[{ value: number | null }]>`
      SELECT COALESCE(SUM("costPrice" * "stockQuantity"), 0)::float AS value
      FROM "CarPart"
      WHERE "companyId" = ${scope.companyId}
        AND "branchId" = ${scope.branchId}
        AND "deletedAt" IS NULL
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM "CarPart"
      WHERE "companyId" = ${scope.companyId}
        AND "branchId" = ${scope.branchId}
        AND "deletedAt" IS NULL
        AND "stockQuantity" <= "minStockLevel"
    `,
    prisma.repairOrder.count({
      where: {
        ...scope,
        deletedAt: null,
        status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
      },
    }),
    prisma.customer.count({ where: { ...scope, deletedAt: null } }),
  ]);

  const revenueMonth = Number(paymentsMonth._sum.amount ?? 0);

  return {
    revenueToday: Number(paymentsToday._sum.amount ?? 0),
    revenueWeek: Number(paymentsWeek._sum.amount ?? 0),
    revenueMonth,
    revenueYear: Number(paymentsYear._sum.amount ?? 0),
    profitMonth: Number(repairsMonth._sum.profit ?? 0),
    outstanding: Number(outstandingAgg._sum.remainingBalance ?? 0),
    upcomingInstallments: Number(installments._sum.amount ?? 0),
    inventoryValue: Number(inventoryAgg[0]?.value ?? 0),
    lowStockCount: Number(lowStockCount[0]?.count ?? 0),
    openRepairs,
    customersCount,
    forecastNextMonth: revenueMonth * 1.05,
  };
}

/** Lean stats for analytics — avoids the 11-query dashboard payload. */
export async function getAnalyticsSummary() {
  const ctx = await getWorkspaceContext();
  if (!ctx) {
    return {
      revenueMonth: 0,
      profitMonth: 0,
      outstanding: 0,
      forecastNextMonth: 0,
    };
  }

  const scope = branchScope(ctx);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [paymentsMonth, repairsMonth, outstandingAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: { ...scope, paymentDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.repairOrder.aggregate({
      where: {
        ...scope,
        deletedAt: null,
        createdAt: { gte: startOfMonth },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      _sum: { profit: true },
    }),
    prisma.invoice.aggregate({
      where: {
        ...scope,
        deletedAt: null,
        status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
      },
      _sum: { remainingBalance: true },
    }),
  ]);

  const revenueMonth = Number(paymentsMonth._sum.amount ?? 0);
  return {
    revenueMonth,
    profitMonth: Number(repairsMonth._sum.profit ?? 0),
    outstanding: Number(outstandingAgg._sum.remainingBalance ?? 0),
    forecastNextMonth: revenueMonth * 1.05,
  };
}

export async function getRevenueTrend(months = 6) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const scope = branchScope(ctx);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [paymentRows, profitRows] = await Promise.all([
    prisma.$queryRaw<{ month: Date; revenue: number }[]>`
      SELECT date_trunc('month', "paymentDate") AS month,
             COALESCE(SUM(amount), 0)::float AS revenue
      FROM "Payment"
      WHERE "companyId" = ${scope.companyId}
        AND "branchId" = ${scope.branchId}
        AND "paymentDate" >= ${start}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<{ month: Date; profit: number }[]>`
      SELECT date_trunc('month', "createdAt") AS month,
             COALESCE(SUM(profit), 0)::float AS profit
      FROM "RepairOrder"
      WHERE "companyId" = ${scope.companyId}
        AND "branchId" = ${scope.branchId}
        AND "deletedAt" IS NULL
        AND "createdAt" >= ${start}
        AND status IN ('COMPLETED', 'DELIVERED')
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const revenueByKey = new Map(
    paymentRows.map((r) => [monthKey(r.month), Number(r.revenue)])
  );
  const profitByKey = new Map(
    profitRows.map((r) => [monthKey(r.month), Number(r.profit)])
  );

  const result: { month: string; revenue: number; profit: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(mStart);
    result.push({
      month: mStart.toLocaleString('en', { month: 'short', year: '2-digit' }),
      revenue: revenueByKey.get(key) ?? 0,
      profit: profitByKey.get(key) ?? 0,
    });
  }
  return result;
}

/** Daily revenue. Pass `days` for a rolling window, or omit for current calendar month. */
export async function getDailyRevenue(days?: number) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const scope = branchScope(ctx);
  const now = new Date();
  const start =
    days != null
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
      : new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<{ day: Date; revenue: number }[]>`
    SELECT date_trunc('day', "paymentDate") AS day,
           COALESCE(SUM(amount), 0)::float AS revenue
    FROM "Payment"
    WHERE "companyId" = ${scope.companyId}
      AND "branchId" = ${scope.branchId}
      AND "paymentDate" >= ${start}
    GROUP BY 1
    ORDER BY 1
  `;

  const byDay = new Map(rows.map((r) => [dayKey(r.day), Number(r.revenue)]));
  const result: { date: string; revenue: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= now) {
    result.push({
      date: cursor.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      revenue: byDay.get(dayKey(cursor)) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function monthKey(d: Date) {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}`;
}

function dayKey(d: Date) {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
}

export async function getPaymentMethodsStats() {
  return getPaymentMethodsBreakdown();
}

export async function getPaymentMethodsBreakdown() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const scope = branchScope(ctx);
  const payments = await prisma.payment.groupBy({
    by: ['method'],
    where: scope,
    _sum: { amount: true },
  });
  return payments.map((p) => ({
    method: p.method,
    amount: Number(p._sum.amount ?? 0),
  }));
}

export async function getRevenueByCategory() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const scope = branchScope(ctx);

  const rows = await prisma.$queryRaw<
    { category: string | null; amount: number }[]
  >`
    SELECT COALESCE(cp.category, 'Uncategorized') AS category,
           SUM(rop."retailPrice" * rop.quantity)::float AS amount
    FROM "RepairOrderPart" rop
    JOIN "RepairOrder" ro ON ro.id = rop."repairOrderId"
    JOIN "CarPart" cp ON cp.id = rop."carPartId"
    WHERE ro."companyId" = ${scope.companyId}
      AND ro."branchId" = ${scope.branchId}
      AND ro."deletedAt" IS NULL
    GROUP BY COALESCE(cp.category, 'Uncategorized')
    ORDER BY amount DESC
    LIMIT 20
  `;

  return rows.map((r) => ({
    category: r.category ?? 'Uncategorized',
    amount: Number(r.amount ?? 0),
  }));
}

export async function getRecentRepairOrders(limit = 5) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  return prisma.repairOrder.findMany({
    where: { ...branchScope(ctx), deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { customer: true, vehicle: true },
  });
}

export async function getBranchComparison() {
  const ctx = await getWorkspaceContext();
  if (!ctx || !ctx.canAccessAllBranches) return [];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const companyId = ctx.company.id;

  const [branches, revenueRows, repairRows, customerRows] = await Promise.all([
    prisma.branch.findMany({
      where: { companyId, isArchived: false, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.payment.groupBy({
      by: ['branchId'],
      where: { companyId, paymentDate: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.repairOrder.groupBy({
      by: ['branchId'],
      where: { companyId, deletedAt: null, createdAt: { gte: startOfMonth } },
      _count: { _all: true },
    }),
    prisma.customer.groupBy({
      by: ['branchId'],
      where: { companyId, deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const revenueBy = new Map(
    revenueRows.map((r) => [r.branchId, Number(r._sum.amount ?? 0)])
  );
  const repairsBy = new Map(repairRows.map((r) => [r.branchId, r._count._all]));
  const customersBy = new Map(
    customerRows.map((r) => [r.branchId, r._count._all])
  );

  return branches.map((b) => ({
    branchId: b.id,
    branchName: b.name,
    revenue: revenueBy.get(b.id) ?? 0,
    repairs: repairsBy.get(b.id) ?? 0,
    customers: customersBy.get(b.id) ?? 0,
  }));
}
