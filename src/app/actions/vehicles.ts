'use server';

import { prisma } from '@/lib/db';
import { getTenantId, requireTenantId } from '@/lib/tenant';
import { vehicleSchema, type VehicleInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getVehicles(customerId?: string) {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.vehicle.findMany({
    where: { tenantId, ...(customerId && { customerId }) },
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  });
}

export async function createVehicle(data: VehicleInput) {
  const tenantId = await requireTenantId();
  const parsed = vehicleSchema.parse(data);

  const vehicle = await prisma.vehicle.create({
    data: {
      tenantId,
      customerId: parsed.customerId,
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
      licensePlate: parsed.licensePlate ?? null,
      vin: parsed.vin ?? null,
      color: parsed.color ?? null,
      mileage: parsed.mileage ?? null,
    },
  });

  revalidatePath('/customers');
  revalidatePath(`/customers/${parsed.customerId}`);
  return vehicle;
}

export async function updateVehicle(id: string, data: VehicleInput) {
  const tenantId = await requireTenantId();
  const parsed = vehicleSchema.parse(data);

  const vehicle = await prisma.vehicle.update({
    where: { id, tenantId },
    data: {
      customerId: parsed.customerId,
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
      licensePlate: parsed.licensePlate ?? null,
      vin: parsed.vin ?? null,
      color: parsed.color ?? null,
      mileage: parsed.mileage ?? null,
    },
  });

  revalidatePath('/customers');
  revalidatePath(`/customers/${parsed.customerId}`);
  return vehicle;
}

export async function deleteVehicle(id: string) {
  const tenantId = await requireTenantId();
  await prisma.vehicle.delete({ where: { id, tenantId } });
  revalidatePath('/customers');
}
