'use server';

import { requirePermission, branchScope, getWorkspaceContext, accessibleWhere } from '@/server/auth';
import { requireFeature } from '@/server/features';
import { logActivity } from '@/server/audit';
import { nextDocumentNumber } from '@/server/sequences';
import { paymentSchema, installmentSchema } from '@/lib/validations';
import { FeatureModule } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { assertRateLimit } from '@/server/rate-limit';
import { prisma } from '@/lib/db';

export async function getInvoices(options?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { items: [], total: 0 };
  const page = options?.page ?? 1;
  const pageSize = Math.min(options?.pageSize ?? 50, 100);

  const where = {
    ...branchScope(ctx),
    deletedAt: null,
    ...(options?.status &&
      options.status !== 'all' && {
        status: options.status as 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE',
      }),
  };

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: true, repairOrder: true },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getInvoice(id: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;
  return prisma.invoice.findFirst({
    where: { id, ...accessibleWhere(ctx), deletedAt: null },
    include: {
      customer: true,
      repairOrder: true,
      items: true,
      payments: true,
      installments: true,
    },
  });
}

export async function createInvoiceFromRepairOrder(repairOrderId: string) {
  const ctx = await requirePermission('invoices:write');
  await assertRateLimit(`invoice:${ctx.company.id}:${ctx.user.id}`, 30, 60_000);

  const invoice = await prisma.$transaction(async (tx) => {
    const repairOrder = await tx.repairOrder.findFirst({
      where: { id: repairOrderId, ...accessibleWhere(ctx) },
      include: {
        customer: true,
        vehicle: true,
        parts: { include: { carPart: true } },
      },
    });
    if (!repairOrder) throw new Error('Repair order not found');

    const existingInvoice = await tx.invoice.findFirst({
      where: { repairOrderId, ...accessibleWhere(ctx) },
    });
    if (existingInvoice) throw new Error('Invoice already exists for this repair order');

    const invoiceNumber = await nextDocumentNumber(tx, {
      companyId: ctx.company.id,
      type: 'INV',
    });
    const totalAmount = Number(repairOrder.totalPrice);

    const inv = await tx.invoice.create({
      data: {
        companyId: ctx.company.id,
        branchId: repairOrder.branchId,
        repairOrderId,
        customerId: repairOrder.customerId,
        invoiceNumber,
        totalAmount,
        paidAmount: 0,
        remainingBalance: totalAmount,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await tx.invoiceItem.createMany({
      data: [
        ...repairOrder.parts.map((p) => ({
          invoiceId: inv.id,
          description: `${p.carPart.name} x${p.quantity}`,
          quantity: p.quantity,
          unitPrice: p.retailPrice,
          total: Number(p.retailPrice) * p.quantity,
        })),
        ...(Number(repairOrder.laborCost) > 0
          ? [
              {
                invoiceId: inv.id,
                description: 'Labor',
                quantity: 1,
                unitPrice: repairOrder.laborCost,
                total: Number(repairOrder.laborCost),
              },
            ]
          : []),
      ],
    });

    return tx.invoice.findUniqueOrThrow({
      where: { id: inv.id },
      include: { customer: true, repairOrder: true, items: true },
    });
  });

  await logActivity({
    ctx,
    action: 'invoice.created',
    entityType: 'Invoice',
    entityId: invoice.id,
    summary: `Created invoice ${invoice.invoiceNumber}`,
  });

  revalidatePath('/invoices');
  revalidatePath('/repair-orders');
  revalidatePath('/dashboard');
  return invoice;
}

export async function recordPayment(data: {
  invoiceId: string;
  amount: number;
  method: string;
  notes?: string;
}) {
  const ctx = await requirePermission('payments:write');
  await assertRateLimit(`payment:${ctx.company.id}:${ctx.user.id}`, 60, 60_000);
  const parsed = paymentSchema.parse(data);

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: parsed.invoiceId, ...accessibleWhere(ctx) },
      include: { customer: true },
    });
    if (!invoice) throw new Error('Invoice not found');

    const remaining = Number(invoice.remainingBalance);
    if (parsed.amount <= 0) throw new Error('Payment amount must be positive');
    if (parsed.amount > remaining + 0.001) {
      throw new Error(
        `Payment exceeds remaining balance (${remaining.toFixed(2)}).`
      );
    }

    const amount = Math.min(parsed.amount, remaining);
    const newPaidAmount = Number(invoice.paidAmount) + amount;
    const remainingBalance = Number(invoice.totalAmount) - newPaidAmount;
    const status =
      remainingBalance <= 0.001 ? 'PAID' : newPaidAmount > 0 ? 'PARTIAL' : 'UNPAID';

    await tx.payment.create({
      data: {
        companyId: ctx.company.id,
        branchId: invoice.branchId,
        invoiceId: parsed.invoiceId,
        customerId: invoice.customerId,
        amount,
        method: parsed.method as
          | 'CASH'
          | 'CARD'
          | 'BANK_TRANSFER'
          | 'CHECK'
          | 'STRIPE'
          | 'OTHER',
        notes: parsed.notes ?? null,
      },
    });

    await tx.invoice.update({
      where: { id: parsed.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        remainingBalance: Math.max(0, remainingBalance),
        status,
      },
    });

    return { customerId: invoice.customerId, invoiceNumber: invoice.invoiceNumber, amount };
  });

  await updateCustomerBalances(result.customerId, ctx.company.id);

  await logActivity({
    ctx,
    action: 'payment.received',
    entityType: 'Invoice',
    entityId: parsed.invoiceId,
    summary: `Received payment ${result.amount} for ${result.invoiceNumber}`,
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${parsed.invoiceId}`);
  revalidatePath('/customers');
  revalidatePath('/dashboard');
}

const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK', 'STRIPE', 'OTHER'] as const;

export async function updatePaymentMethod(
  paymentId: string,
  method: (typeof PAYMENT_METHODS)[number]
) {
  const ctx = await requirePermission('payments:write');
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, ...accessibleWhere(ctx) },
  });
  if (!payment) throw new Error('Payment not found');

  await prisma.payment.update({
    where: { id: paymentId },
    data: { method },
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${payment.invoiceId}`);
}

async function updateCustomerBalances(customerId: string, companyId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { customerId, companyId, deletedAt: null },
  });
  const totalSpent = await prisma.payment.aggregate({
    where: { customerId, companyId },
    _sum: { amount: true },
  });
  const outstandingBalance = invoices.reduce(
    (sum, inv) => sum + Number(inv.remainingBalance),
    0
  );
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      totalSpent: totalSpent._sum.amount ?? 0,
      outstandingBalance,
    },
  });
}

export async function createInstallmentPlan(data: {
  invoiceId: string;
  amounts: number[];
  dueDates: Date[];
}) {
  const ctx = await requirePermission('installments:write');
  await requireFeature(ctx, FeatureModule.INSTALLMENTS);

  if (data.amounts.length !== data.dueDates.length) {
    throw new Error('Amounts and due dates must have the same length');
  }
  if (!data.amounts.length) throw new Error('Add at least one installment');

  const parsed = installmentSchema.parse({
    ...data,
    dueDates: data.dueDates.map((d) => (d instanceof Date ? d : new Date(d))),
  });

  const invoice = await prisma.invoice.findFirst({
    where: { id: parsed.invoiceId, ...accessibleWhere(ctx) },
  });
  if (!invoice) throw new Error('Invoice not found');

  const sum = parsed.amounts.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - Number(invoice.remainingBalance)) > 0.01) {
    throw new Error(
      `Installment total (${sum}) must equal remaining balance (${invoice.remainingBalance})`
    );
  }

  // Block stacking installment plans
  const existing = await prisma.installment.count({
    where: {
      invoiceId: parsed.invoiceId,
      status: { in: ['PENDING', 'OVERDUE'] },
    },
  });
  if (existing > 0) {
    throw new Error('An active installment plan already exists for this invoice');
  }

  await prisma.installment.createMany({
    data: parsed.amounts.map((amount, i) => ({
      companyId: ctx.company.id,
      branchId: invoice.branchId,
      invoiceId: parsed.invoiceId,
      customerId: invoice.customerId,
      amount,
      dueDate: parsed.dueDates[i],
      status: 'PENDING',
    })),
  });

  await logActivity({
    ctx,
    action: 'installment.plan_created',
    entityType: 'Invoice',
    entityId: parsed.invoiceId,
    summary: `Created installment plan (${parsed.amounts.length} payments)`,
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${parsed.invoiceId}`);
  revalidatePath('/customers');
  revalidatePath('/dashboard');
}

export async function markInstallmentPaid(installmentId: string, method = 'CASH') {
  const ctx = await requirePermission('installments:write');
  await requireFeature(ctx, FeatureModule.INSTALLMENTS);

  const installment = await prisma.installment.findFirst({
    where: { id: installmentId, ...accessibleWhere(ctx) },
  });
  if (!installment) throw new Error('Installment not found');
  if (installment.status === 'PAID') throw new Error('Already paid');

  await recordPayment({
    invoiceId: installment.invoiceId,
    amount: Number(installment.amount),
    method,
    notes: `Installment ${installmentId}`,
  });

  await prisma.installment.update({
    where: { id: installmentId },
    data: { status: 'PAID', paidDate: new Date() },
  });

  await logActivity({
    ctx,
    action: 'installment.paid',
    entityType: 'Installment',
    entityId: installmentId,
    summary: `Marked installment paid`,
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${installment.invoiceId}`);
}

/** @deprecated Use POST /api/cron/overdue with CRON_SECRET. */
export async function markOverdueInstallments() {
  throw new Error('Use /api/cron/overdue with Authorization Bearer CRON_SECRET');
}
