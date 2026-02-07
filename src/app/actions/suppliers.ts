'use server';

import { prisma } from '@/lib/db';
import { getTenantId, requireTenantId } from '@/lib/tenant';
import { supplierSchema, type SupplierInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getSuppliers() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.supplier.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { carParts: true } } },
  });
}

/** For client components (e.g. dropdowns): returns only id and name, serializable. */
export async function getSuppliersForSelect(): Promise<{ id: string; name: string }[]> {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  const rows = await prisma.supplier.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return rows;
}

export async function createSupplier(data: SupplierInput) {
  const tenantId = await requireTenantId();
  const parsed = supplierSchema.parse(data);

  const supplier = await prisma.supplier.create({
    data: {
      tenantId,
      name: parsed.name,
      contactPerson: parsed.contactPerson ?? null,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      address: parsed.address ?? null,
      notes: parsed.notes ?? null,
    },
  });

  revalidatePath('/suppliers');
  revalidatePath('/inventory');
  return supplier;
}

export async function updateSupplier(id: string, data: SupplierInput) {
  const tenantId = await requireTenantId();
  const parsed = supplierSchema.parse(data);

  const supplier = await prisma.supplier.update({
    where: { id, tenantId },
    data: {
      name: parsed.name,
      contactPerson: parsed.contactPerson ?? null,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      address: parsed.address ?? null,
      notes: parsed.notes ?? null,
    },
  });

  revalidatePath('/suppliers');
  revalidatePath('/inventory');
  return supplier;
}

export async function deleteSupplier(id: string) {
  const tenantId = await requireTenantId();
  await prisma.supplier.delete({ where: { id, tenantId } });
  revalidatePath('/suppliers');
  revalidatePath('/inventory');
}
