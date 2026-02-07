'use server';

import { prisma } from '@/lib/db';
import { getTenantId } from '@/lib/tenant';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

const DEFAULT_STATS = {
  todayRevenue: 0,
  thisMonthRevenue: 0,
  lastMonthRevenue: 0,
  monthOverMonth: 0,
  outstandingBalance: 0,
  overdueCount: 0,
  totalProfit: 0,
  lowStockCount: 0,
  activeRepairs: 0,
  totalCustomers: 0,
  upcomingInstallments: 0,
  nextMonthForecast: 0,
};

export async function getDashboardStats() {
  const tenantId = await getTenantId();
  if (!tenantId) return DEFAULT_STATS;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [todayRevenue, thisMonthRevenue, lastMonthRevenue, outstandingBalance, overdueCount, totalProfit, lowStockCount, activeRepairs, totalCustomers, upcomingInstallments] =
    await Promise.all([
      prisma.payment.aggregate({
        where: {
          tenantId,
          paymentDate: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          paymentDate: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          paymentDate: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
        _sum: { remainingBalance: true },
      }),
      prisma.invoice.count({
        where: { tenantId, status: 'OVERDUE' },
      }),
      prisma.repairOrder.aggregate({
        where: { tenantId, status: { in: ['COMPLETED', 'DELIVERED'] } },
        _sum: { profit: true },
      }),
      (async () => {
        const parts = await prisma.carPart.findMany({
          where: { tenantId },
          select: { stockQuantity: true, minStockLevel: true },
        });
        return parts.filter((p) => p.stockQuantity <= p.minStockLevel).length;
      })(),
      prisma.repairOrder.count({
        where: {
          tenantId,
          status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
        },
      }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.installment.count({
        where: {
          tenantId,
          status: 'PENDING',
          dueDate: { gte: now, lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

  const lastMonthRev = Number(lastMonthRevenue._sum.amount ?? 0);
  const thisMonthRev = Number(thisMonthRevenue._sum.amount ?? 0);
  const monthOverMonth =
    lastMonthRev > 0
      ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100
      : 0;

  const nextMonthForecast = thisMonthRev > 0 ? thisMonthRev * 1.05 : 0;

  return {
    todayRevenue: Number(todayRevenue._sum.amount ?? 0),
    thisMonthRevenue: thisMonthRev,
    lastMonthRevenue: lastMonthRev,
    monthOverMonth,
    outstandingBalance: Number(outstandingBalance._sum.remainingBalance ?? 0),
    overdueCount,
    totalProfit: Number(totalProfit._sum.profit ?? 0),
    lowStockCount: lowStockCount,
    activeRepairs,
    totalCustomers,
    upcomingInstallments,
    nextMonthForecast,
  };
}

export async function getRevenueTrend(months = 6) {
  const tenantId = await getTenantId();
  if (!tenantId) {
    return Array.from({ length: months }, (_, i) => {
      const date = subMonths(new Date(), months - 1 - i);
      return {
        month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: 0,
      };
    });
  }

  const results: { month: string; revenue: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const agg = await prisma.payment.aggregate({
      where: {
        tenantId,
        paymentDate: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });

    results.push({
      month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      revenue: Number(agg._sum.amount ?? 0),
    });
  }

  return results;
}

export async function getDailyRevenue(month?: Date) {
  const tenantId = await getTenantId();
  const targetMonth = month ?? new Date();
  const end = endOfMonth(targetMonth);

  if (!tenantId) {
    const days = end.getDate();
    return Array.from({ length: days }, (_, i) => ({
      day: String(i + 1),
      revenue: 0,
    }));
  }

  const start = startOfMonth(targetMonth);
  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      paymentDate: { gte: start, lte: end },
    },
    select: { amount: true, paymentDate: true },
  });

  const byDay: Record<number, number> = {};
  for (let d = 1; d <= end.getDate(); d++) byDay[d] = 0;
  payments.forEach((p) => {
    const day = new Date(p.paymentDate).getDate();
    byDay[day] = (byDay[day] ?? 0) + Number(p.amount);
  });

  return Object.entries(byDay).map(([day, revenue]) => ({ day, revenue }));
}

export async function getPaymentMethodsStats() {
  const tenantId = await getTenantId();
  if (!tenantId) {
    return [
      { name: 'Cash', value: 0 },
      { name: 'Card', value: 0 },
      { name: 'Bank Transfer', value: 0 },
      { name: 'Check', value: 0 },
      { name: 'Other', value: 0 },
    ];
  }

  const payments = await prisma.payment.groupBy({
    by: ['method'],
    where: { tenantId },
    _sum: { amount: true },
  });

  const labels: Record<string, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    BANK_TRANSFER: 'Bank Transfer',
    CHECK: 'Check',
    STRIPE: 'Stripe',
    OTHER: 'Other',
  };
  return payments.map((p) => ({
    name: labels[p.method] ?? p.method,
    value: Number(p._sum.amount ?? 0),
  })).filter((p) => p.value > 0);
}

export async function getRevenueByCategory() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];

  const parts = await prisma.repairOrderPart.findMany({
    where: { repairOrder: { tenantId } },
    include: {
      carPart: true,
      repairOrder: { select: { tenantId: true } },
    },
  });

  const byCategory: Record<string, number> = {};
  parts.forEach((p) => {
    const cat = p.carPart.category ?? 'Uncategorized';
    const total = Number(p.retailPrice) * p.quantity;
    byCategory[cat] = (byCategory[cat] ?? 0) + total;
  });

  return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
}

export async function getRecentRepairOrders(limit = 5) {
  const tenantId = await getTenantId();
  if (!tenantId) return [];

  return prisma.repairOrder.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      customer: true,
      vehicle: true,
    },
  });
}
