'use server';

import { prisma } from '@/lib/db';
import { requirePermission, branchScope, getWorkspaceContext, accessibleWhere } from '@/server/auth';
import { assertRateLimit } from '@/server/rate-limit';
import { logActivity } from '@/server/audit';
import { nextDocumentNumber } from '@/server/sequences';
import { repairOrderSchema, type RepairOrderInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getRepairOrders(options?: {
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
        status: options.status as
          | 'PENDING'
          | 'IN_PROGRESS'
          | 'WAITING_PARTS'
          | 'COMPLETED'
          | 'DELIVERED'
          | 'CANCELLED',
      }),
  };

  const [items, total] = await Promise.all([
    prisma.repairOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: true,
        vehicle: true,
        parts: { include: { carPart: true } },
        invoice: true,
      },
    }),
    prisma.repairOrder.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getRepairOrder(id: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;
  return prisma.repairOrder.findFirst({
    where: { id, ...accessibleWhere(ctx), deletedAt: null },
    include: {
      customer: true,
      vehicle: true,
      parts: { include: { carPart: true } },
      invoice: true,
    },
  });
}

export async function createRepairOrder(data: RepairOrderInput) {
  const ctx = await requirePermission('repairs:write');
  await assertRateLimit(`repair:${ctx.company.id}:${ctx.user.id}`, 40, 60_000);
  const parsed = repairOrderSchema.parse(data);

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.customerId, ...accessibleWhere(ctx), deletedAt: null },
  });
  if (!customer) throw new Error('Customer not found');
  if (!ctx.branchIds.includes(customer.branchId)) {
    throw new Error('Access denied');
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: parsed.vehicleId,
      ...accessibleWhere(ctx),
      customerId: parsed.customerId,
      deletedAt: null,
    },
  });
  if (!vehicle) throw new Error('Vehicle not found for this customer');

  const orderBranchId = customer.branchId;

  const order = await prisma.$transaction(async (tx) => {
    let partsCostTotal = 0;
    let partsRetailTotal = 0;
    const partData = [];

    for (const p of parsed.parts) {
      const part = await tx.carPart.findFirst({
        where: {
          id: p.carPartId,
          ...accessibleWhere(ctx),
          deletedAt: null,
        },
      });
      if (!part) throw new Error(`Part not found: ${p.carPartId}`);
      if (part.stockQuantity < p.quantity) {
        throw new Error(
          `Insufficient stock for ${part.name}. Available: ${part.stockQuantity}, needed: ${p.quantity}`
        );
      }
      partsCostTotal += Number(p.costPrice) * p.quantity;
      partsRetailTotal += Number(p.retailPrice) * p.quantity;
      partData.push({
        carPartId: p.carPartId,
        quantity: p.quantity,
        costPrice: p.costPrice,
        retailPrice: p.retailPrice,
      });
    }

    const laborCost = Number(parsed.laborCost) || 0;
    const totalPrice = laborCost + partsRetailTotal;
    const profit = totalPrice - laborCost - partsCostTotal;
    const orderNumber = await nextDocumentNumber(tx, {
      companyId: ctx.company.id,
      type: 'RO',
    });

    const ro = await tx.repairOrder.create({
      data: {
        companyId: ctx.company.id,
        branchId: orderBranchId,
        customerId: parsed.customerId,
        vehicleId: parsed.vehicleId,
        orderNumber,
        description: parsed.description ?? null,
        status: 'PENDING',
        laborCost,
        partsCostTotal,
        partsRetailTotal,
        totalPrice,
        profit,
        notes: parsed.notes ?? null,
      },
    });

    if (partData.length > 0) {
      await tx.repairOrderPart.createMany({
        data: partData.map((p) => ({ ...p, repairOrderId: ro.id })),
      });
    }

    for (const p of parsed.parts) {
      const updated = await tx.carPart.updateMany({
        where: {
          id: p.carPartId,
          ...accessibleWhere(ctx),
          stockQuantity: { gte: p.quantity },
        },
        data: { stockQuantity: { decrement: p.quantity } },
      });
      if (updated.count === 0) {
        throw new Error('Stock changed concurrently. Please retry.');
      }
    }

    return tx.repairOrder.findUniqueOrThrow({
      where: { id: ro.id },
      include: {
        customer: true,
        vehicle: true,
        parts: { include: { carPart: true } },
      },
    });
  });

  await logActivity({
    ctx,
    action: 'repair.opened',
    entityType: 'RepairOrder',
    entityId: order.id,
    summary: `Opened repair order ${order.orderNumber}`,
  });

  revalidatePath('/repair-orders');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');
  revalidatePath('/customers');
  return order;
}

export async function updateRepairOrderStatus(
  id: string,
  status:
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'WAITING_PARTS'
    | 'COMPLETED'
    | 'DELIVERED'
    | 'CANCELLED'
) {
  const ctx = await requirePermission('repairs:write');

  await prisma.$transaction(async (tx) => {
    const order = await tx.repairOrder.findFirst({
      where: { id, ...accessibleWhere(ctx), deletedAt: null },
      include: { invoice: true, parts: true },
    });
    if (!order) throw new Error('Repair order not found');

    // H3: restore stock when cancelling a previously stock-consuming order
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      for (const p of order.parts) {
        await tx.carPart.update({
          where: { id: p.carPartId },
          data: { stockQuantity: { increment: p.quantity } },
        });
      }
    }

    await tx.repairOrder.update({
      where: { id },
      data: { status },
    });
  });

  const order = await prisma.repairOrder.findFirst({
    where: { id, ...accessibleWhere(ctx) },
    include: { invoice: true },
  });
  if (!order) throw new Error('Repair order not found');

  if ((status === 'COMPLETED' || status === 'DELIVERED') && !order.invoice) {
    const { createInvoiceFromRepairOrder } = await import('@/app/actions/invoices');
    await createInvoiceFromRepairOrder(id);
  }

  await logActivity({
    ctx,
    action:
      status === 'COMPLETED'
        ? 'repair.completed'
        : status === 'CANCELLED'
          ? 'repair.cancelled'
          : 'repair.status_changed',
    entityType: 'RepairOrder',
    entityId: id,
    summary: `Repair ${order.orderNumber} → ${status}`,
  });

  revalidatePath('/repair-orders');
  revalidatePath(`/repair-orders/${id}`);
  revalidatePath('/invoices');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');
  revalidatePath('/customers');
}
