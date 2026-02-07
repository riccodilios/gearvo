'use server';

import { prisma } from '@/lib/db';
import { getTenantId, requireTenantId } from '@/lib/tenant';
import { customerSchema, type CustomerInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getCustomers() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.customer.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { vehicles: true, repairOrders: true },
      },
    },
  });
}

/** For client components (e.g. dropdowns): id and fullName only, serializable. */
export async function getCustomersForSelect(): Promise<{ id: string; fullName: string }[]> {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.customer.findMany({
    where: { tenantId },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true },
  });
}

export async function getCustomer(id: string) {
  const tenantId = await getTenantId();
  if (!tenantId) return null;
  return prisma.customer.findFirst({
    where: { id, tenantId },
    include: {
      vehicles: true,
      repairOrders: {
        include: { vehicle: true },
        orderBy: { createdAt: 'desc' },
      },
      invoices: {
        include: { payments: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createCustomer(data: CustomerInput) {
  const tenantId = await requireTenantId();
  const parsed = customerSchema.parse(data);

  const customer = await prisma.customer.create({
    data: {
      tenantId,
      fullName: parsed.fullName,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      address: parsed.address ?? null,
      tags: parsed.tags ?? [],
      notes: parsed.notes ?? null,
    },
  });

  revalidatePath('/customers');
  revalidatePath('/dashboard');
  return customer;
}

export async function updateCustomer(id: string, data: CustomerInput) {
  const tenantId = await requireTenantId();
  const parsed = customerSchema.parse(data);

  const customer = await prisma.customer.update({
    where: { id, tenantId },
    data: {
      fullName: parsed.fullName,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      address: parsed.address ?? null,
      tags: parsed.tags ?? [],
      notes: parsed.notes ?? null,
    },
  });

  revalidatePath('/customers');
  revalidatePath(`/customers/${id}`);
  revalidatePath('/dashboard');
  return customer;
}

export async function deleteCustomer(id: string) {
  const tenantId = await requireTenantId();
  await prisma.customer.delete({ where: { id, tenantId } });
  revalidatePath('/customers');
  revalidatePath('/dashboard');
}
