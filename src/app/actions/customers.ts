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
      include: {
        vehicles: {
          where: { deletedAt: null },
          select: { id: true, make: true, model: true, year: true },
          take: 5,
        },
        _count: { select: { repairOrders: true, invoices: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

const HISTORY_TAKE = 25;

/** Lightweight profile for header / stats / contact — no history payload. */
export async function getCustomerProfile(id: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;
  return prisma.customer.findFirst({
    where: { id, ...accessibleWhere(ctx), deletedAt: null },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      address: true,
      tags: true,
      notes: true,
      totalSpent: true,
      outstandingBalance: true,
      _count: {
        select: {
          vehicles: { where: { deletedAt: null } },
          repairOrders: { where: { deletedAt: null } },
        },
      },
    },
  });
}

/** Tab history — limited rows + narrow selects, loaded in parallel. */
export async function getCustomerHistory(id: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const scoped = await prisma.customer.findFirst({
    where: { id, ...accessibleWhere(ctx), deletedAt: null },
    select: { id: true },
  });
  if (!scoped) return null;

  const companyId = ctx.company.id;
  const branchFilter = ctx.canAccessAllBranches
    ? {}
    : { branchId: { in: ctx.branchIds } };

  const [vehicles, repairOrders, invoices, payments] = await Promise.all([
    prisma.vehicle.findMany({
      where: { customerId: id, companyId, deletedAt: null, ...branchFilter },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_TAKE,
      select: {
        id: true,
        year: true,
        make: true,
        model: true,
        color: true,
        licensePlate: true,
        mileage: true,
      },
    }),
    prisma.repairOrder.findMany({
      where: { customerId: id, companyId, deletedAt: null, ...branchFilter },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_TAKE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalPrice: true,
        vehicle: { select: { make: true, model: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { customerId: id, companyId, deletedAt: null, ...branchFilter },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_TAKE,
      select: {
        id: true,
        invoiceNumber: true,
        createdAt: true,
        totalAmount: true,
        status: true,
      },
    }),
    prisma.payment.findMany({
      where: { customerId: id, companyId, ...branchFilter },
      orderBy: { paymentDate: 'desc' },
      take: HISTORY_TAKE,
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        method: true,
        invoice: { select: { invoiceNumber: true } },
      },
    }),
  ]);

  return { vehicles, repairOrders, invoices, payments };
}

/** @deprecated Prefer getCustomerProfile + getCustomerHistory */
export async function getCustomer(id: string) {
  const [profile, history] = await Promise.all([
    getCustomerProfile(id),
    getCustomerHistory(id),
  ]);
  if (!profile || !history) return null;
  return {
    ...profile,
    vehicles: history.vehicles,
    repairOrders: history.repairOrders,
    invoices: history.invoices,
    payments: history.payments,
  };
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
