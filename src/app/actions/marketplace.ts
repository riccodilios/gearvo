'use server';

import { prisma } from '@/lib/db';
import { requirePermission, branchScope, getWorkspaceContext, accessibleWhere } from '@/server/auth';
import { requireFeature } from '@/server/features';
import { logActivity } from '@/server/audit';
import { nextDocumentNumber } from '@/server/sequences';
import { FeatureModule } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getSuppliersWithParts() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  return prisma.supplier.findMany({
    where: { ...branchScope(ctx), deletedAt: null },
    orderBy: { name: 'asc' },
    include: {
      carParts: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
    },
  });
}

export async function getPurchaseOrders(options?: { page?: number; pageSize?: number }) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { items: [], total: 0 };
  const page = options?.page ?? 1;
  const pageSize = Math.min(options?.pageSize ?? 50, 100);
  const where = { ...branchScope(ctx) };

  const [items, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        supplier: true,
        lines: { include: { carPart: true } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function createPurchaseOrder(params: {
  supplierId: string;
  lines: { carPartId: string; quantity: number; unitCost: number }[];
  notes?: string;
}) {
  const ctx = await requirePermission('marketplace:write');
  await requireFeature(ctx, FeatureModule.MARKETPLACE);
  const { supplierId, lines, notes } = params;
  if (!lines.length) throw new Error('Add at least one part to the order.');

  const supplier = await prisma.supplier.findFirst({
    where: {
      id: supplierId,
      ...accessibleWhere(ctx),
      deletedAt: null,
    },
  });
  if (!supplier) throw new Error('Supplier not found in this branch');
  if (!ctx.branchIds.includes(supplier.branchId)) {
    throw new Error('Access denied');
  }

  for (const line of lines) {
    const part = await prisma.carPart.findFirst({
      where: {
        id: line.carPartId,
        ...accessibleWhere(ctx),
        deletedAt: null,
      },
    });
    if (!part) throw new Error(`Part not found: ${line.carPartId}`);
  }

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await nextDocumentNumber(tx, {
      companyId: ctx.company.id,
      type: 'PO',
    });

    return tx.purchaseOrder.create({
      data: {
        companyId: ctx.company.id,
        branchId: supplier.branchId,
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
  });

  await logActivity({
    ctx,
    action: 'purchase_order.created',
    entityType: 'PurchaseOrder',
    entityId: order.id,
    summary: `Created purchase order ${order.orderNumber}`,
  });

  revalidatePath('/marketplace');
  return order;
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: 'PENDING' | 'ORDERED' | 'RECEIVED'
) {
  const ctx = await requirePermission('marketplace:write');
  await requireFeature(ctx, FeatureModule.MARKETPLACE);

  await prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findFirst({
      where: { id, ...accessibleWhere(ctx) },
      include: { lines: true },
    });
    if (!order) throw new Error('Order not found.');

    if (status === 'RECEIVED') {
      if (order.status === 'RECEIVED') {
        throw new Error('Order already received — stock was already updated.');
      }
      for (const line of order.lines) {
        const part = await tx.carPart.findFirst({
          where: {
            id: line.carPartId,
            ...accessibleWhere(ctx),
            deletedAt: null,
          },
        });
        if (!part) throw new Error('Part missing for PO line');
        await tx.carPart.update({
          where: { id: line.carPartId },
          data: { stockQuantity: { increment: line.quantity } },
        });
      }
    }

    await tx.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  });

  await logActivity({
    ctx,
    action: status === 'RECEIVED' ? 'inventory.received' : 'purchase_order.status_changed',
    entityType: 'PurchaseOrder',
    entityId: id,
    summary: `Purchase order → ${status}`,
  });

  revalidatePath('/marketplace');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');
}
