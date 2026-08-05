'use server';

import { prisma } from '@/lib/db';
import { requirePermission, branchScope, getWorkspaceContext, accessibleWhere } from '@/server/auth';
import { assertRateLimit } from '@/server/rate-limit';
import { requireFeature } from '@/server/features';
import { logActivity } from '@/server/audit';
import { carPartSchema, type CarPartInput } from '@/lib/validations';
import { FeatureModule } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getCarPartsForSelect() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const parts = await prisma.carPart.findMany({
    where: { ...branchScope(ctx), deletedAt: null },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      partNumber: true,
      costPrice: true,
      retailPrice: true,
      stockQuantity: true,
    },
  });
  return parts.map((p) => ({
    ...p,
    costPrice: Number(p.costPrice),
    retailPrice: Number(p.retailPrice),
  }));
}

export async function getCarParts(options?: {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { items: [], total: 0 };
  const page = options?.page ?? 1;
  const pageSize = Math.min(options?.pageSize ?? 50, 100);
  const q = options?.q?.trim();

  const where = {
    ...branchScope(ctx),
    deletedAt: null,
    ...(options?.category && options.category !== 'all'
      ? { category: options.category }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { partNumber: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carPart.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { supplier: true },
    }),
    prisma.carPart.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getLowStockParts() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const scope = branchScope(ctx);
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "CarPart"
    WHERE "companyId" = ${scope.companyId}
      AND "branchId" = ${scope.branchId}
      AND "deletedAt" IS NULL
      AND "stockQuantity" <= "minStockLevel"
    ORDER BY "stockQuantity" ASC
    LIMIT 50
  `;
  if (!rows.length) return [];
  return prisma.carPart.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    include: { supplier: true },
  });
}

export async function createCarPart(data: CarPartInput) {
  const ctx = await requirePermission('inventory:write');
  await requireFeature(ctx, FeatureModule.INVENTORY);
  const parsed = carPartSchema.parse(data);

  if (parsed.supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: parsed.supplierId,
        ...accessibleWhere(ctx),
        deletedAt: null,
      },
    });
    if (!supplier) throw new Error('Supplier not found in this workspace');
  }

  const part = await prisma.carPart.create({
    data: {
      companyId: ctx.company.id,
      branchId: ctx.branch.id,
      name: parsed.name,
      partNumber: parsed.partNumber || null,
      costPrice: parsed.costPrice,
      retailPrice: parsed.retailPrice,
      stockQuantity: parsed.stockQuantity ?? 0,
      minStockLevel: parsed.minStockLevel ?? 5,
      category: parsed.category || null,
      supplierId: parsed.supplierId || null,
    },
  });

  await logActivity({
    ctx,
    action: 'inventory.created',
    entityType: 'CarPart',
    entityId: part.id,
    summary: `Added part ${part.name}`,
  });

  revalidatePath('/inventory');
  revalidatePath('/dashboard');
  return part;
}

export async function updateCarPart(id: string, data: CarPartInput) {
  const ctx = await requirePermission('inventory:write');
  const parsed = carPartSchema.parse(data);

  const existing = await prisma.carPart.findFirst({
    where: { id, ...accessibleWhere(ctx), deletedAt: null },
  });
  if (!existing) throw new Error('Part not found');

  if (parsed.supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: parsed.supplierId, ...accessibleWhere(ctx), deletedAt: null },
    });
    if (!supplier) throw new Error('Supplier not found in this workspace');
  }

  const part = await prisma.carPart.update({
    where: { id },
    data: {
      name: parsed.name,
      partNumber: parsed.partNumber || null,
      costPrice: parsed.costPrice,
      retailPrice: parsed.retailPrice,
      stockQuantity: parsed.stockQuantity ?? existing.stockQuantity,
      minStockLevel: parsed.minStockLevel ?? 5,
      category: parsed.category || null,
      supplierId: parsed.supplierId || null,
    },
  });

  await logActivity({
    ctx,
    action: 'inventory.updated',
    entityType: 'CarPart',
    entityId: part.id,
    summary: `Updated part ${part.name}`,
  });

  revalidatePath('/inventory');
  return part;
}

export async function deleteCarPart(id: string) {
  const ctx = await requirePermission('inventory:delete');
  const existing = await prisma.carPart.findFirst({
    where: { id, ...accessibleWhere(ctx) },
  });
  if (!existing) throw new Error('Part not found');

  await prisma.carPart.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logActivity({
    ctx,
    action: 'inventory.deleted',
    entityType: 'CarPart',
    entityId: id,
    summary: `Archived part ${existing.name}`,
  });

  revalidatePath('/inventory');
}

export async function adjustStock(id: string, delta: number, reason?: string) {
  const ctx = await requirePermission('inventory:adjust');
  await assertRateLimit(`stock-adjust:${ctx.company.id}:${ctx.user.id}`, 60, 60_000);

  await prisma.$transaction(async (tx) => {
    const part = await tx.carPart.findFirst({
      where: { id, ...accessibleWhere(ctx), deletedAt: null },
    });
    if (!part) throw new Error('Part not found');
    const next = part.stockQuantity + delta;
    if (next < 0) throw new Error('Insufficient stock');
    await tx.carPart.update({
      where: { id },
      data: { stockQuantity: next },
    });
  });

  await logActivity({
    ctx,
    action: 'inventory.adjusted',
    entityType: 'CarPart',
    entityId: id,
    summary: `Adjusted stock by ${delta}${reason ? `: ${reason}` : ''}`,
    metadata: { delta, reason },
  });

  revalidatePath('/inventory');
  revalidatePath('/dashboard');
}
