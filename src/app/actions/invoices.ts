'use server';

import { prisma } from '@/lib/db';
import { getTenantId, requireTenantId } from '@/lib/tenant';
import { paymentSchema, installmentSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getInvoices(status?: string) {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.invoice.findMany({
    where: {
      tenantId,
      ...(status &&
        status !== 'all' && {
          status: status as 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE',
        }),
    },
    orderBy: { createdAt: 'desc' },
    include: { customer: true, repairOrder: true },
  });
}

export async function getInvoice(id: string) {
  const tenantId = await getTenantId();
  if (!tenantId) return null;
  return prisma.invoice.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      repairOrder: true,
      items: true,
      payments: true,
      installments: true,
    },
  });
}

async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const count = await prisma.invoice.count({ where: { tenantId } });
  return `INV-${String(count + 1).padStart(5, '0')}`;
}

export async function createInvoiceFromRepairOrder(repairOrderId: string) {
  const tenantId = await requireTenantId();

  const repairOrder = await prisma.repairOrder.findFirstOrThrow({
    where: { id: repairOrderId, tenantId },
    include: {
      customer: true,
      vehicle: true,
      parts: { include: { carPart: true } },
    },
  });

  const existingInvoice = await prisma.invoice.findFirst({
    where: { repairOrderId },
  });
  if (existingInvoice) {
    throw new Error('Invoice already exists for this repair order');
  }

  const invoiceNumber = await generateInvoiceNumber(tenantId);
  const totalAmount = Number(repairOrder.totalPrice);

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        tenantId,
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
  const tenantId = await requireTenantId();
  const parsed = paymentSchema.parse(data);

  const invoice = await prisma.invoice.findFirstOrThrow({
    where: { id: parsed.invoiceId, tenantId },
    include: { customer: true },
  });

  const newPaidAmount = Number(invoice.paidAmount) + parsed.amount;
  const remainingBalance = Number(invoice.totalAmount) - newPaidAmount;
  const status =
    remainingBalance <= 0
      ? 'PAID'
      : newPaidAmount > 0
      ? 'PARTIAL'
      : 'UNPAID';

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        tenantId,
        invoiceId: parsed.invoiceId,
        customerId: invoice.customerId,
        amount: parsed.amount,
        method: parsed.method as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'STRIPE' | 'OTHER',
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
  });

  await updateCustomerBalances(invoice.customerId);

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
  const tenantId = await requireTenantId();
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId },
  });
  if (!payment) throw new Error('Payment not found');

  await prisma.payment.update({
    where: { id: paymentId, tenantId },
    data: { method },
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${payment.invoiceId}`);
}

async function updateCustomerBalances(customerId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
  });
  const totalSpent = await prisma.payment.aggregate({
    where: { customerId },
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
  const tenantId = await requireTenantId();
  const parsed = installmentSchema.parse({
    ...data,
    dueDates: data.dueDates.map((d) => (d instanceof Date ? d : new Date(d))),
  });

  const invoice = await prisma.invoice.findFirstOrThrow({
    where: { id: parsed.invoiceId, tenantId },
    include: { customer: true },
  });

  await prisma.installment.createMany({
    data: parsed.amounts.map((amount, i) => ({
      tenantId,
      invoiceId: parsed.invoiceId,
      customerId: invoice.customerId,
      amount,
      dueDate: parsed.dueDates[i],
      status: 'PENDING',
    })),
  });

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${parsed.invoiceId}`);
  revalidatePath('/customers');
  revalidatePath('/dashboard');
}
