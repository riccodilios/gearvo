'use server';

import { prisma } from '@/lib/db';
import { getTenantId, requireTenantId } from '@/lib/tenant';
import { carPartSchema, type CarPartInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getCarParts(category?: string) {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.carPart.findMany({
    where: {
      tenantId,
      ...(category && category !== 'all' && { category }),
    },
    orderBy: { name: 'asc' },
    include: { supplier: true },
  });
}

/** For client components (e.g. repair order form): plain fields, serializable. */
export async function getCarPartsForSelect(): Promise<
  { id: string; name: string; stockQuantity: number; costPrice: number; retailPrice: number }[]
> {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  const rows = await prisma.carPart.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, stockQuantity: true, costPrice: true, retailPrice: true },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    stockQuantity: p.stockQuantity,
    costPrice: Number(p.costPrice),
    retailPrice: Number(p.retailPrice),
  }));
}

export async function getLowStockParts() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  try {
    const parts = await prisma.carPart.findMany({
      where: { tenantId },
      include: { supplier: true },
    });
    return parts.filter((p) => p.stockQuantity <= p.minStockLevel);
  } catch {
    return [];
  }
}

export async function createCarPart(data: CarPartInput) {
  const tenantId = await requireTenantId();
  const parsed = carPartSchema.parse(data);

  const part = await prisma.carPart.create({
    data: {
      tenantId,
      name: parsed.name,
      partNumber: parsed.partNumber ?? null,
      supplierId: parsed.supplierId ?? null,
      costPrice: parsed.costPrice,
      retailPrice: parsed.retailPrice,
      stockQuantity: parsed.stockQuantity,
      minStockLevel: parsed.minStockLevel ?? 5,
      category: parsed.category ?? null,
    },
  });

  revalidatePath('/inventory');
  revalidatePath('/dashboard');
  revalidatePath('/repair-orders');
  return part;
}

export async function updateCarPart(id: string, data: CarPartInput) {
  const tenantId = await requireTenantId();
  const parsed = carPartSchema.parse(data);

  const part = await prisma.carPart.update({
    where: { id, tenantId },
    data: {
      name: parsed.name,
      partNumber: parsed.partNumber ?? null,
      supplierId: parsed.supplierId ?? null,
      costPrice: parsed.costPrice,
      retailPrice: parsed.retailPrice,
      stockQuantity: parsed.stockQuantity,
      minStockLevel: parsed.minStockLevel ?? 5,
      category: parsed.category ?? null,
    },
  });

  revalidatePath('/inventory');
  revalidatePath('/repair-orders');
  revalidatePath('/dashboard');
  return part;
}

export async function deleteCarPart(id: string) {
  const tenantId = await requireTenantId();
  await prisma.carPart.delete({ where: { id, tenantId } });
  revalidatePath('/inventory');
  revalidatePath('/dashboard');
}
