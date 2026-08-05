import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs/server';
import type { AppRole, Company, Branch, User, Membership } from '@prisma/client';
import { prisma } from '@/lib/db';
import { env } from '@/server/env';
import {
  hasPermission,
  isCompanyWideRole,
  permissionsForRole,
  PERMISSIONS,
  type Permission,
} from '@/server/permissions';

export const WORKSPACE_COOKIE = 'gearvo-company-id';
export const BRANCH_COOKIE = 'gearvo-branch-id';

export type WorkspaceContext = {
  user: User;
  company: Company;
  branch: Branch;
  membership: Membership;
  role: AppRole;
  /** True only for platform admins and company-wide roles (Owner/Admin). */
  canAccessAllBranches: boolean;
  branchIds: string[];
};

async function resolveClerkUserId(): Promise<string | null> {
  if (env.clerkConfigured) {
    try {
      const session = await auth();
      return session.userId ?? null;
    } catch {
      return null;
    }
  }
  if (env.allowDevBypass) {
    const h = await headers();
    return h.get('x-dev-user-id') ?? process.env.DEV_USER_CLERK_ID ?? 'dev_clerk_owner';
  }
  return null;
}

export async function ensurePrismaUser(): Promise<User | null> {
  const clerkId = await resolveClerkUserId();
  if (!clerkId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (user) return user;

  if (env.clerkConfigured) {
    const cu = await currentUser();
    if (!cu) return null;
    const email =
      cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
      cu.emailAddresses[0]?.emailAddress ??
      `${clerkId}@users.clerk.local`;
    const fullName =
      [cu.firstName, cu.lastName].filter(Boolean).join(' ') || cu.username || 'User';
    user = await prisma.user.create({
      data: {
        clerkId,
        email,
        fullName,
        avatarUrl: cu.imageUrl ?? null,
      },
    });
    return user;
  }

  if (env.allowDevBypass) {
    user = await prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email: 'owner@demo.gearvo.local',
        fullName: 'Demo Owner',
        isPlatformAdmin: true,
      },
      update: {},
    });
    return user;
  }

  return null;
}

export const getWorkspaceContext = cache(async (): Promise<WorkspaceContext | null> => {
  const user = await ensurePrismaUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const preferredCompanyId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const preferredBranchId = cookieStore.get(BRANCH_COOKIE)?.value;

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      company: true,
      branch: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!memberships.length) {
    return null;
  }

  let membership =
    (preferredCompanyId &&
      memberships.find((m) => m.companyId === preferredCompanyId && m.isActive)) ||
    memberships[0];

  // Prefer company-wide membership only when the role is actually company-wide
  const companyWide = memberships.find(
    (m) =>
      m.companyId === membership.companyId &&
      !m.branchId &&
      isCompanyWideRole(m.role)
  );
  if (companyWide) membership = companyWide;

  if (membership.company.status === 'SUSPENDED' && !user.isPlatformAdmin) {
    return null;
  }

  const company = membership.company;

  // H1: only company-wide roles (or platform admin) see all branches — never null branchId alone
  const canAccessAllBranches =
    user.isPlatformAdmin || isCompanyWideRole(membership.role);

  // Branch-scoped roles must have a branchId
  if (!canAccessAllBranches && !membership.branchId) {
    return null;
  }

  const branches = await prisma.branch.findMany({
    where: {
      companyId: company.id,
      isArchived: false,
      deletedAt: null,
      ...(!canAccessAllBranches && membership.branchId
        ? { id: membership.branchId }
        : {}),
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });

  if (!branches.length) return null;

  let branch: Branch;
  if (canAccessAllBranches) {
    branch =
      (preferredBranchId && branches.find((b) => b.id === preferredBranchId)) ||
      branches.find((b) => b.isDefault) ||
      branches[0];
  } else {
    const allowed = branches.find((b) => b.id === membership.branchId);
    if (!allowed) return null;
    branch = allowed;
  }

  return {
    user,
    company,
    branch,
    membership,
    role: membership.role,
    canAccessAllBranches,
    branchIds: canAccessAllBranches ? branches.map((b) => b.id) : [branch.id],
  };
});

/** Scope for operational list queries (current selected branch). */
export function branchScope(ctx: WorkspaceContext): {
  companyId: string;
  branchId: string;
} {
  return { companyId: ctx.company.id, branchId: ctx.branch.id };
}

/**
 * Where clause for by-id lookups — enforces company + branch isolation.
 * Company-wide roles may access any branch in the company.
 * Branch-scoped roles are limited to their branchIds.
 */
export function accessibleWhere(ctx: WorkspaceContext): {
  companyId: string;
  branchId?: { in: string[] };
} {
  if (ctx.canAccessAllBranches) {
    return { companyId: ctx.company.id };
  }
  return { companyId: ctx.company.id, branchId: { in: ctx.branchIds } };
}

/** Assert an entity's branchId is within the caller's allowed set. */
export function assertBranchAccess(
  ctx: WorkspaceContext,
  branchId: string | null | undefined
): void {
  if (!branchId) {
    throw new Error('Access denied');
  }
  if (ctx.canAccessAllBranches) return;
  if (!ctx.branchIds.includes(branchId)) {
    throw new Error('Access denied');
  }
}

export function companyScope(ctx: WorkspaceContext) {
  return { companyId: ctx.company.id };
}

import { AppError } from '@/server/errors';

export async function requireWorkspace(): Promise<WorkspaceContext> {
  const ctx = await getWorkspaceContext();
  if (!ctx) {
    throw new AppError('UNAUTHORIZED', 'Workspace required. Sign in and select or create a company.');
  }
  return ctx;
}

export async function requirePermission(permission: Permission): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace();
  if (ctx.user.isPlatformAdmin) return ctx;
  if (!hasPermission(ctx.role, permission)) {
    throw new AppError('FORBIDDEN', `You do not have permission: ${permission}`);
  }
  return ctx;
}

export async function requirePlatformAdmin(): Promise<User> {
  const user = await ensurePrismaUser();
  if (!user?.isPlatformAdmin) {
    throw new AppError('FORBIDDEN', 'Platform admin access required.');
  }
  return user;
}

export async function getCompanyId(): Promise<string | null> {
  const ctx = await getWorkspaceContext();
  return ctx?.company.id ?? null;
}

export async function requireCompanyId(): Promise<string> {
  const ctx = await requireWorkspace();
  return ctx.company.id;
}

/** Nav/permission snapshot for client UI (no secrets). */
export async function getNavAccess(): Promise<{
  permissions: Permission[];
  features: string[];
  isPlatformAdmin: boolean;
  canAccessAllBranches: boolean;
} | null> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;

  const perms = ctx.user.isPlatformAdmin
    ? ([...PERMISSIONS] as Permission[])
    : [...permissionsForRole(ctx.role)];

  const flags = await prisma.companyFeatureFlag.findMany({
    where: { companyId: ctx.company.id, enabled: true },
    select: { feature: true },
  });

  return {
    permissions: perms,
    features: flags.map((f) => f.feature),
    isPlatformAdmin: ctx.user.isPlatformAdmin,
    canAccessAllBranches: ctx.canAccessAllBranches,
  };
}
