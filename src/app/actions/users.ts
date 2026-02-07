'use server';

import { prisma } from '@/lib/db';
import { getTenantId } from '@/lib/tenant';

export async function getTeamUsers() {
  const tenantId = await getTenantId();
  if (!tenantId) return [];
  return prisma.user.findMany({
    where: { tenantId },
    orderBy: { fullName: 'asc' },
  });
}
