'use server';

import { prisma } from '@/lib/db';
import { requirePermission, getWorkspaceContext, accessibleWhere } from '@/server/auth';
import { logActivity } from '@/server/audit';
import { vehicleSchema, type VehicleInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getVehiclesForSelect(customerId?: string) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  return prisma.vehicle.findMany({
    where: {
      companyId: ctx.company.id,
      deletedAt: null,
      ...(customerId ? { customerId } : { branchId: ctx.branch.id }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      licensePlate: true,
      customerId: true,
    },
  });
}

export async function createVehicle(data: VehicleInput) {
  const ctx = await requirePermission('vehicles:write');
  const parsed = vehicleSchema.parse(data);

  const customer = await prisma.customer.findFirst({
    where: {
      id: parsed.customerId,
      ...accessibleWhere(ctx),
      deletedAt: null,
    },
  });
  if (!customer) throw new Error('Customer not found in this workspace');

  const vehicle = await prisma.vehicle.create({
    data: {
      companyId: ctx.company.id,
      branchId: customer.branchId,
      customerId: parsed.customerId,
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
      licensePlate: parsed.licensePlate || null,
      vin: parsed.vin || null,
      color: parsed.color || null,
      mileage: parsed.mileage ?? null,
    },
  });

  await logActivity({
    ctx,
    action: 'vehicle.created',
    entityType: 'Vehicle',
    entityId: vehicle.id,
    summary: `Added ${vehicle.make} ${vehicle.model} for ${customer.fullName}`,
    branchId: customer.branchId,
  });

  revalidatePath(`/customers/${parsed.customerId}`);
  revalidatePath('/customers');
  return vehicle;
}

export async function updateVehicle(id: string, data: Partial<VehicleInput>) {
  const ctx = await requirePermission('vehicles:write');
  const existing = await prisma.vehicle.findFirst({
    where: { id, ...accessibleWhere(ctx), deletedAt: null },
  });
  if (!existing) throw new Error('Vehicle not found');

  if (data.customerId && data.customerId !== existing.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, ...accessibleWhere(ctx), deletedAt: null },
    });
    if (!customer) throw new Error('Customer not found in this workspace');
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      ...(data.make !== undefined && { make: data.make }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.year !== undefined && { year: data.year }),
      ...(data.licensePlate !== undefined && { licensePlate: data.licensePlate || null }),
      ...(data.vin !== undefined && { vin: data.vin || null }),
      ...(data.color !== undefined && { color: data.color || null }),
      ...(data.mileage !== undefined && { mileage: data.mileage ?? null }),
      ...(data.customerId !== undefined && { customerId: data.customerId }),
    },
  });

  await logActivity({
    ctx,
    action: 'vehicle.updated',
    entityType: 'Vehicle',
    entityId: vehicle.id,
    summary: `Updated vehicle ${vehicle.make} ${vehicle.model}`,
  });

  revalidatePath(`/customers/${vehicle.customerId}`);
  return vehicle;
}

export async function getVehicles(options?: { q?: string; page?: number; pageSize?: number }) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { items: [], total: 0 };
  const page = options?.page ?? 1;
  const pageSize = Math.min(options?.pageSize ?? 50, 100);
  const q = options?.q?.trim();

  const where = {
    companyId: ctx.company.id,
    branchId: ctx.branch.id,
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { make: { contains: q, mode: 'insensitive' as const } },
            { model: { contains: q, mode: 'insensitive' as const } },
            { licensePlate: { contains: q, mode: 'insensitive' as const } },
            { vin: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: true },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
