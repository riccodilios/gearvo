'use server';

import { prisma } from '@/lib/db';
import { getTenantId, requireTenantId } from '@/lib/tenant';
import { repairOrderSchema, type RepairOrderInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getRepairOrders(status?: string) {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.repairOrder.findMany({
    where: {
      tenantId,
      ...(status &&
        status !== 'all' && {
          status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED',
        }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      vehicle: true,
      parts: { include: { carPart: true } },
      invoice: true,
    },
  });
}

export async function getRepairOrder(id: string) {
  const tenantId = await getTenantId();
  if (!tenantId) return null;
  return prisma.repairOrder.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      vehicle: true,
      parts: { include: { carPart: true } },
      invoice: true,
    },
  });
}

async function generateOrderNumber(tenantId: string): Promise<string> {
  const count = await prisma.repairOrder.count({ where: { tenantId } });
  return `RO-${String(count + 1).padStart(5, '0')}`;
}

export async function createRepairOrder(data: RepairOrderInput) {
  const tenantId = await requireTenantId();
  const parsed = repairOrderSchema.parse(data);

  const customer = await prisma.customer.findFirstOrThrow({
    where: { id: parsed.customerId, tenantId },
  });
  const vehicle = await prisma.vehicle.findFirstOrThrow({
    where: { id: parsed.vehicleId, tenantId },
    include: { customer: true },
  });

  const orderNumber = await generateOrderNumber(tenantId);

  let partsCostTotal = 0;
  let partsRetailTotal = 0;

  const partData = await Promise.all(
    parsed.parts.map(async (p) => {
      const part = await prisma.carPart.findFirstOrThrow({
        where: { id: p.carPartId, tenantId },
      });
      const cost = Number(p.costPrice) * p.quantity;
      const retail = Number(p.retailPrice) * p.quantity;
      partsCostTotal += cost;
      partsRetailTotal += retail;
      return {
        carPartId: p.carPartId,
        quantity: p.quantity,
        costPrice: p.costPrice,
        retailPrice: p.retailPrice,
      };
    })
  );

  const laborCost = Number(parsed.laborCost) || 0;
  const totalPrice = laborCost + partsRetailTotal;
  const profit = totalPrice - laborCost - partsCostTotal;

  const order = await prisma.$transaction(async (tx) => {
    const ro = await tx.repairOrder.create({
      data: {
        tenantId,
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

    await tx.repairOrderPart.createMany({
      data: partData.map((p) => ({ ...p, repairOrderId: ro.id })),
    });

    for (const p of parsed.parts) {
      await tx.carPart.update({
        where: { id: p.carPartId },
        data: { stockQuantity: { decrement: p.quantity } },
      });
    }

    return tx.repairOrder.findUniqueOrThrow({
      where: { id: ro.id },
      include: { customer: true, vehicle: true, parts: { include: { carPart: true } } },
    });
  });

  revalidatePath('/repair-orders');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');
  revalidatePath('/customers');
  return order;
}

export async function updateRepairOrderStatus(
  id: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED'
) {
  const tenantId = await requireTenantId();
  const order = await prisma.repairOrder.findFirst({
    where: { id, tenantId },
    include: { invoice: true },
  });
  if (!order) throw new Error('Repair order not found');

  await prisma.repairOrder.update({
    where: { id, tenantId },
    data: { status },
  });

  // Auto-create invoice when order is completed/delivered and no invoice exists
  if (
    (status === 'COMPLETED' || status === 'DELIVERED') &&
    !order.invoice
  ) {
    const { createInvoiceFromRepairOrder } = await import('@/app/actions/invoices');
    await createInvoiceFromRepairOrder(id);
  }

  revalidatePath('/repair-orders');
  revalidatePath(`/repair-orders/${id}`);
  revalidatePath('/invoices');
  revalidatePath('/dashboard');
  revalidatePath('/customers');
}
