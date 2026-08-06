const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const company = await prisma.company.findUnique({ where: { slug: 'demo-auto' } });
  if (!company) throw new Error('demo missing');
  const main = await prisma.branch.findFirst({
    where: { companyId: company.id, isDefault: true },
  });
  const scope = { companyId: company.id, branchId: main.id };
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [today, month, profit, installments] = await Promise.all([
    prisma.payment.aggregate({
      where: { ...scope, paymentDate: { gte: startOfDay } },
      _sum: { amount: true },
    }),
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
    prisma.installment.aggregate({
      where: {
        ...scope,
        status: { in: ['PENDING', 'OVERDUE'] },
        dueDate: { lte: in30 },
      },
      _sum: { amount: true },
    }),
  ]);
  const revenueMonth = Number(month._sum.amount ?? 0);
  console.log(
    JSON.stringify(
      {
        branch: main.name,
        revenueToday: Number(today._sum.amount ?? 0),
        revenueMonth,
        profitMonth: Number(profit._sum.profit ?? 0),
        upcomingInstallments: Number(installments._sum.amount ?? 0),
        forecastNextMonth: revenueMonth * 1.05,
      },
      null,
      2
    )
  );
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
