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
import { isDemoCompanySlug, isDemoEmail } from '@/server/demo-constants';
import { ensureCompanyFeatureFlags } from '@/server/workspace-bootstrap';
import { AppError } from '@/server/errors';
import {
  AUTH_BRIDGE_COOKIE,
  clerkUserIdFromSessionToken,
  fetchClerkProfile,
  readAuthBridgeClerkId,
  setAuthBridgeCookie,
} from '@/server/clerk-bridge';

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

export type EnsureUserOptions = {
  /** Clerk session JWT from the browser when Netlify cannot read Clerk cookies. */
  sessionToken?: string | null;
};

async function resolveClerkUserId(options?: EnsureUserOptions): Promise<string | null> {
  if (env.clerkConfigured) {
    try {
      const session = await auth();
      if (session.userId) return session.userId;
    } catch {
      // fall through — common with pk_test on Netlify
    }

    const fromToken = await clerkUserIdFromSessionToken(options?.sessionToken);
    if (fromToken) return fromToken;

    try {
      const jar = await cookies();
      const bridged = readAuthBridgeClerkId(jar.get(AUTH_BRIDGE_COOKIE)?.value);
      if (bridged) return bridged;
    } catch {
      // cookies() unavailable in some contexts
    }
  }
  if (env.allowDevBypass) {
    const h = await headers();
    return h.get('x-dev-user-id') ?? process.env.DEV_USER_CLERK_ID ?? 'dev_clerk_owner';
  }
  return null;
}

export async function ensurePrismaUser(options?: EnsureUserOptions): Promise<User | null> {
  const clerkId = await resolveClerkUserId(options);
  if (!clerkId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (user) {
    if (options?.sessionToken) {
      await setAuthBridgeCookie(clerkId).catch(() => undefined);
    }
    return user;
  }

  if (env.clerkConfigured) {
    let email: string | null = null;
    let fullName = 'User';
    let avatarUrl: string | null = null;

    try {
      const cu = await currentUser();
      if (cu) {
        email =
          cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
          cu.emailAddresses[0]?.emailAddress ??
          null;
        fullName =
          [cu.firstName, cu.lastName].filter(Boolean).join(' ') || cu.username || 'User';
        avatarUrl = cu.imageUrl ?? null;
      }
    } catch {
      // ignore — use Backend API fallback
    }

    if (!email) {
      const profile = await fetchClerkProfile(clerkId);
      if (!profile) return null;
      email = profile.email;
      fullName = profile.fullName;
      avatarUrl = profile.avatarUrl;
    }

    // Re-link if a row exists for this email with a stale clerkId (e.g. after re-provision)
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (byEmail && byEmail.clerkId !== clerkId) {
      const clash = await prisma.user.findUnique({ where: { clerkId } });
      if (clash && clash.id !== byEmail.id) {
        await prisma.membership.updateMany({
          where: { userId: clash.id },
          data: { userId: byEmail.id },
        });
        await prisma.user.delete({ where: { id: clash.id } }).catch(() => undefined);
      }
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          clerkId,
          email,
          fullName,
          avatarUrl,
        },
      });
      await setAuthBridgeCookie(clerkId).catch(() => undefined);
      return user;
    }

    user = await prisma.user.create({
      data: {
        clerkId,
        email,
        fullName,
        avatarUrl,
      },
    });
    await setAuthBridgeCookie(clerkId).catch(() => undefined);
    return user;
  }

  if (env.allowDevBypass) {
    user = await prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email: 'demo.owner@gearvo.app',
        fullName: 'Demo Owner',
        isPlatformAdmin: true,
      },
      update: {},
    });
    return user;
  }

  return null;
}

export const getWorkspaceContext = cache(async (options?: EnsureUserOptions): Promise<WorkspaceContext | null> => {
  const user = await ensurePrismaUser(options);
  if (!user) return null;

  const cookieStore = await cookies();
  const preferredCompanyId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const preferredBranchId = cookieStore.get(BRANCH_COOKIE)?.value;
  const demoUser = isDemoEmail(user.email);

  const allMemberships = await prisma.membership.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      company: true,
      branch: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Hard isolation: demo accounts only see demo-auto; production accounts never see demo-auto
  const memberships = allMemberships.filter((m) => {
    const isDemoCo = isDemoCompanySlug(m.company.slug);
    return demoUser ? isDemoCo : !isDemoCo;
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

  const canAccessAllBranches =
    user.isPlatformAdmin || isCompanyWideRole(membership.role);

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

  // Heal companies that were created without feature flags
  await ensureCompanyFeatureFlags(ctx.company.id, ctx.company.plan);

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

export async function setWorkspaceCookies(companyId: string, branchId: string) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  cookieStore.set(WORKSPACE_COOKIE, companyId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure,
    httpOnly: true,
  });
  cookieStore.set(BRANCH_COOKIE, branchId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure,
    httpOnly: true,
  });
  cookieStore.delete('tenant-id');
}
