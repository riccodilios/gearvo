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

export async function getRevenueTrend(months = 6) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const scope = branchScope(ctx);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const payments = await prisma.payment.findMany({
    where: { ...scope, paymentDate: { gte: start } },
    select: { amount: true, paymentDate: true },
  });
  const repairs = await prisma.repairOrder.findMany({
    where: {
      ...scope,
      deletedAt: null,
      createdAt: { gte: start },
      status: { in: ['COMPLETED', 'DELIVERED'] },
    },
    select: { profit: true, createdAt: true },
  });

  const result: { month: string; revenue: number; profit: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const revenue = payments
      .filter((p) => p.paymentDate >= mStart && p.paymentDate < mEnd)
      .reduce((s, p) => s + Number(p.amount), 0);
    const profit = repairs
      .filter((r) => r.createdAt >= mStart && r.createdAt < mEnd)
      .reduce((s, r) => s + Number(r.profit), 0);
    result.push({
      month: mStart.toLocaleString('en', { month: 'short', year: '2-digit' }),
      revenue,
      profit,
    });
  }
  return result;
}

export async function getDailyRevenue(days = 14) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const scope = branchScope(ctx);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

  const payments = await prisma.payment.findMany({
    where: { ...scope, paymentDate: { gte: start } },
    select: { amount: true, paymentDate: true },
  });

  const result: { date: string; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
    const revenue = payments
      .filter((p) => p.paymentDate >= dStart && p.paymentDate < dEnd)
      .reduce((s, p) => s + Number(p.amount), 0);
    result.push({
      date: dStart.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      revenue,
    });
  }
  return result;
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

  const branches = await prisma.branch.findMany({
    where: { companyId: ctx.company.id, isArchived: false, deletedAt: null },
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return Promise.all(
    branches.map(async (b) => {
      const [revenue, repairs, customers] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            companyId: ctx.company.id,
            branchId: b.id,
            paymentDate: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),
        prisma.repairOrder.count({
          where: {
            companyId: ctx.company.id,
            branchId: b.id,
            deletedAt: null,
            createdAt: { gte: startOfMonth },
          },
        }),
        prisma.customer.count({
          where: { companyId: ctx.company.id, branchId: b.id, deletedAt: null },
        }),
      ]);
      return {
        branchId: b.id,
        branchName: b.name,
        revenue: Number(revenue._sum.amount ?? 0),
        repairs,
        customers,
      };
    })
  );
}
