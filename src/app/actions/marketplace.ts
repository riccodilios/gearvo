'use server';

import { prisma } from '@/lib/db';
import { getTenantId, requireTenantId } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

export async function getSuppliersWithParts() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.supplier.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: {
      carParts: { orderBy: { name: 'asc' } },
    },
  });
}

export async function getPurchaseOrders() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.purchaseOrder.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      supplier: true,
      lines: { include: { carPart: true } },
    },
  });
}

export async function createPurchaseOrder(params: {
  supplierId: string;
  lines: { carPartId: string; quantity: number; unitCost: number }[];
  notes?: string;
}) {
  const tenantId = await requireTenantId();
  const { supplierId, lines, notes } = params;
  if (!lines.length) throw new Error('Add at least one part to the order.');

  const count = await prisma.purchaseOrder.count({ where: { tenantId } });
  const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

  const order = await prisma.purchaseOrder.create({
    data: {
      tenantId,
      supplierId,
      orderNumber,
      status: 'PENDING',
      notes: notes ?? null,
      lines: {
        create: lines.map((l) => ({
          carPartId: l.carPartId,
          quantity: l.quantity,
          unitCost: l.unitCost,
        })),
      },
    },
    include: { supplier: true, lines: { include: { carPart: true } } },
  });

  revalidatePath('/marketplace');
  return order;
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: 'PENDING' | 'ORDERED' | 'RECEIVED'
) {
  const tenantId = await requireTenantId();
  const order = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId },
    include: { lines: true },
  });
  if (!order) throw new Error('Order not found.');

  if (status === 'RECEIVED') {
    for (const line of order.lines) {
      await prisma.carPart.update({
        where: { id: line.carPartId },
        data: {
          stockQuantity: { increment: line.quantity },
        },
      });
    }
  }

  await prisma.purchaseOrder.update({
    where: { id, tenantId },
    data: { status },
  });

  revalidatePath('/marketplace');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');
}
