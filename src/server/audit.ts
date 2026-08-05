import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { WorkspaceContext } from '@/server/auth';

type LogInput = {
  ctx: WorkspaceContext;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
  branchId?: string | null;
};

export async function logActivity(input: LogInput) {
  const { ctx, action, entityType, entityId, summary, metadata, branchId } = input;
  try {
    await prisma.activityLog.create({
      data: {
        companyId: ctx.company.id,
        branchId: branchId ?? ctx.branch.id,
        userId: ctx.user.id,
        action,
        entityType,
        entityId: entityId ?? null,
        summary,
        metadata: metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error('[activity]', err);
  }
}

export async function getActivityFeed(
  ctx: WorkspaceContext,
  options?: { take?: number; entityType?: string; entityId?: string }
) {
  return prisma.activityLog.findMany({
    where: {
      companyId: ctx.company.id,
      ...(!ctx.canAccessAllBranches ? { branchId: { in: ctx.branchIds } } : {}),
      ...(options?.entityType && { entityType: options.entityType }),
      ...(options?.entityId && { entityId: options.entityId }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.take ?? 50,
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });
}
