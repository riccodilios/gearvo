'use server';

import { prisma } from '@/lib/db';
import { requirePermission, branchScope, getWorkspaceContext, accessibleWhere } from '@/server/auth';
import { logActivity } from '@/server/audit';
import { supplierSchema, type SupplierInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getSuppliersForSelect() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  return prisma.supplier.findMany({
    where: { ...branchScope(ctx), deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}

export async function getSuppliers(options?: { q?: string; page?: number; pageSize?: number }) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { items: [], total: 0 };
  const page = options?.page ?? 1;
  const pageSize = Math.min(options?.pageSize ?? 50, 100);
  const q = options?.q?.trim();

  const where = {
    ...branchScope(ctx),
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { contactPerson: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { carParts: true, purchaseOrders: true } } },
    }),
    prisma.supplier.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function createSupplier(data: SupplierInput) {
  const ctx = await requirePermission('suppliers:write');
  const parsed = supplierSchema.parse(data);

  const supplier = await prisma.supplier.create({
    data: {
      companyId: ctx.company.id,
      branchId: ctx.branch.id,
      name: parsed.name,
      contactPerson: parsed.contactPerson || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
      notes: parsed.notes || null,
    },
  });

  await logActivity({
    ctx,
    action: 'supplier.created',
    entityType: 'Supplier',
    entityId: supplier.id,
    summary: `Created supplier ${supplier.name}`,
  });

  revalidatePath('/suppliers');
  revalidatePath('/marketplace');
  return supplier;
}

export async function updateSupplier(id: string, data: SupplierInput) {
  const ctx = await requirePermission('suppliers:write');
  const parsed = supplierSchema.parse(data);

  const existing = await prisma.supplier.findFirst({
    where: { id, ...accessibleWhere(ctx), deletedAt: null },
  });
  if (!existing) throw new Error('Supplier not found');

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      name: parsed.name,
      contactPerson: parsed.contactPerson || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
      notes: parsed.notes || null,
    },
  });

  await logActivity({
    ctx,
    action: 'supplier.updated',
    entityType: 'Supplier',
    entityId: supplier.id,
    summary: `Updated supplier ${supplier.name}`,
  });

  revalidatePath('/suppliers');
  return supplier;
}

export async function deleteSupplier(id: string) {
  const ctx = await requirePermission('suppliers:delete');
  const existing = await prisma.supplier.findFirst({
    where: { id, ...accessibleWhere(ctx) },
  });
  if (!existing) throw new Error('Supplier not found');

  await prisma.supplier.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logActivity({
    ctx,
    action: 'supplier.deleted',
    entityType: 'Supplier',
    entityId: id,
    summary: `Archived supplier ${existing.name}`,
  });

  revalidatePath('/suppliers');
}
