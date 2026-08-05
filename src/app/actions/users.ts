'use server';

import { requirePermission, requirePlatformAdmin } from '@/server/auth';
import { logActivity } from '@/server/audit';
import { isCompanyWideRole } from '@/server/permissions';
import { assertRateLimit } from '@/server/rate-limit';
import type { AppRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export async function getTeamUsers() {
  const ctx = await requirePermission('members:manage');
  return prisma.membership.findMany({
    where: { companyId: ctx.company.id, isActive: true },
    include: {
      user: true,
      branch: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addMember(data: {
  email: string;
  fullName: string;
  role: AppRole;
  branchId?: string | null;
  clerkId?: string;
}) {
  const ctx = await requirePermission('members:manage');
  await assertRateLimit(`add-member:${ctx.company.id}`, 20, 60_000);

  if (['PLATFORM_OWNER', 'PLATFORM_ADMIN'].includes(data.role) && !ctx.user.isPlatformAdmin) {
    throw new Error('Cannot assign platform roles');
  }

  const companyWide = isCompanyWideRole(data.role);
  if (!companyWide && !data.branchId) {
    throw new Error('Branch is required for this role');
  }
  if (companyWide) {
    data.branchId = null;
  } else if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, companyId: ctx.company.id, deletedAt: null },
    });
    if (!branch) throw new Error('Branch not found');
  }

  const clerkId = data.clerkId ?? `pending_${data.email.toLowerCase()}`;

  const user = await prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email: data.email,
      fullName: data.fullName,
    },
    update: { email: data.email, fullName: data.fullName },
  });

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      companyId: ctx.company.id,
      branchId: data.branchId ?? null,
      role: data.role,
    },
  });

  await logActivity({
    ctx,
    action: 'employee.added',
    entityType: 'Membership',
    entityId: membership.id,
    summary: `Added ${data.fullName} as ${data.role}`,
  });

  revalidatePath('/settings');
  revalidatePath('/employees');
  return membership;
}

export async function listCompaniesForPlatform() {
  await requirePlatformAdmin();
  return prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { memberships: true, branches: true, customers: true } },
      featureFlags: true,
    },
  });
}

export async function suspendCompany(companyId: string) {
  await requirePlatformAdmin();
  await prisma.company.update({
    where: { id: companyId },
    data: { status: 'SUSPENDED', suspendedAt: new Date() },
  });
  revalidatePath('/platform');
}

export async function activateCompany(companyId: string) {
  await requirePlatformAdmin();
  await prisma.company.update({
    where: { id: companyId },
    data: { status: 'ACTIVE', suspendedAt: null },
  });
  revalidatePath('/platform');
}
