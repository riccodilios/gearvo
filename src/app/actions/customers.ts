'use server';

import { prisma } from '@/lib/db';
import { requirePermission, branchScope, getWorkspaceContext, accessibleWhere } from '@/server/auth';
import { requireFeature } from '@/server/features';
import { logActivity } from '@/server/audit';
import { customerSchema, type CustomerInput } from '@/lib/validations';
import { FeatureModule } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getCustomersForSelect() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  return prisma.customer.findMany({
    where: { ...branchScope(ctx), deletedAt: null },
    orderBy: { fullName: 'asc' },
    select: {
      id: true,
      fullName: true,
      phone: true,
      vehicles: {
        where: { deletedAt: null },
        select: { id: true, make: true, model: true, year: true, licensePlate: true },
      },
    },
  });
}

export async function getCustomers(options?: { q?: string; page?: number; pageSize?: number }) {
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
            { fullName: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { vehicles: true, _count: { select: { repairOrders: true, invoices: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getCustomer(id: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;
  return prisma.customer.findFirst({
    where: { id, ...accessibleWhere(ctx), deletedAt: null },
    include: {
      vehicles: { where: { deletedAt: null } },
      repairOrders: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { vehicle: true, invoice: true },
      },
      invoices: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { payments: true },
      },
    },
  });
}

export async function createCustomer(data: CustomerInput) {
  const ctx = await requirePermission('customers:write');
  await requireFeature(ctx, FeatureModule.CRM);
  const parsed = customerSchema.parse(data);

  const customer = await prisma.customer.create({
    data: {
      companyId: ctx.company.id,
      branchId: ctx.branch.id,
      fullName: parsed.fullName,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
      tags: parsed.tags ?? [],
      notes: parsed.notes || null,
    },
  });

  await logActivity({
    ctx,
    action: 'customer.created',
    entityType: 'Customer',
    entityId: customer.id,
    summary: `Created customer ${customer.fullName}`,
  });

  revalidatePath('/customers');
  revalidatePath('/dashboard');
  return customer;
}

export async function updateCustomer(id: string, data: CustomerInput) {
  const ctx = await requirePermission('customers:write');
  const parsed = customerSchema.parse(data);

  const existing = await prisma.customer.findFirst({
    where: { id, ...accessibleWhere(ctx), deletedAt: null },
  });
  if (!existing) throw new Error('Customer not found');

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      fullName: parsed.fullName,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
      tags: parsed.tags ?? [],
      notes: parsed.notes || null,
    },
  });

  await logActivity({
    ctx,
    action: 'customer.updated',
    entityType: 'Customer',
    entityId: customer.id,
    summary: `Updated customer ${customer.fullName}`,
  });

  revalidatePath('/customers');
  revalidatePath(`/customers/${id}`);
  return customer;
}

export async function deleteCustomer(id: string) {
  const ctx = await requirePermission('customers:delete');
  const existing = await prisma.customer.findFirst({
    where: { id, ...accessibleWhere(ctx) },
  });
  if (!existing) throw new Error('Customer not found');

  await prisma.$transaction([
    prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
    prisma.vehicle.updateMany({
      where: { customerId: id, companyId: ctx.company.id },
      data: { deletedAt: new Date() },
    }),
  ]);

  await logActivity({
    ctx,
    action: 'customer.deleted',
    entityType: 'Customer',
    entityId: id,
    summary: `Archived customer ${existing.fullName}`,
  });

  revalidatePath('/customers');
}
