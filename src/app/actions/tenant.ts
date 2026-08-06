'use server';

import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { env } from '@/server/env';
import {
  BRANCH_COOKIE,
  WORKSPACE_COOKIE,
  ensurePrismaUser,
  setWorkspaceCookies,
} from '@/server/auth';
import { logActivity } from '@/server/audit';
import { assertRateLimit } from '@/server/rate-limit';
import { toUserError } from '@/server/errors';
import { DEMO_COMPANY_SLUG, isDemoCompanySlug, isDemoEmail } from '@/server/demo-constants';
import { bootstrapCompanyForOwner } from '@/server/workspace-bootstrap';

function createShopErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return 'That shop URL is already taken. Try a different name or slug.';
    }
    if (err.code === 'P1001' || err.code === 'P1017') {
      return 'Database is not connected. Please try again in a moment.';
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Can't reach database") || msg.includes('Connection')) {
    return 'Database is not connected. Set DATABASE_URL and run migrations.';
  }
  if (msg.toLowerCase().includes('cookie')) {
    return 'Shop was created but session cookies failed. Open the dashboard and refresh.';
  }
  return toUserError(err).message;
}

export async function createCompanyWorkspace(
  formData: FormData
): Promise<{ error?: string; redirect?: string }> {
  const name = (formData.get('name') as string)?.trim();
  let slug = (formData.get('slug') as string)
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  if (!slug) {
    slug =
      (name ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
      'my-shop';
  }

  if (!name) return { error: 'Company name is required.' };
  if (slug === DEMO_COMPANY_SLUG) {
    return { error: 'That shop URL is reserved. Please choose another.' };
  }

  try {
    await assertRateLimit(`create-company:${slug}`, 5, 60_000);
  } catch {
    return { error: 'Too many attempts. Please wait a minute.' };
  }

  try {
    let user = await ensurePrismaUser();

    if (!user) {
      if (env.clerkConfigured) {
        // ensurePrismaUser already swallowed Clerk auth errors; treat as signed out.
        return { error: 'You must sign in before creating a company.' };
      }
      if (env.allowDevBypass) {
        return { error: 'Dev bypass cannot create production shops. Configure Clerk.' };
      }
      return { error: 'Authentication required.' };
    }

    if (!user) return { error: 'Could not resolve user. Sign in, then try again.' };

    if (isDemoEmail(user.email)) {
      return {
        error:
          'You are signed in with a demo account. Sign out, then sign up or sign in with your real email to create a shop.',
      };
    }

    // Already owns a real (non-demo) shop — enter it
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        role: { in: ['COMPANY_OWNER', 'COMPANY_ADMIN'] },
        company: { slug: { not: DEMO_COMPANY_SLUG } },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (existingMembership) {
      const branch =
        (existingMembership.branchId &&
          (await prisma.branch.findFirst({
            where: { id: existingMembership.branchId, companyId: existingMembership.companyId },
          }))) ||
        (await prisma.branch.findFirst({
          where: {
            companyId: existingMembership.companyId,
            isArchived: false,
            deletedAt: null,
          },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        }));
      if (branch) {
        try {
          await setWorkspaceCookies(existingMembership.companyId, branch.id);
        } catch {
          /* membership alone is enough */
        }
      }
      return { redirect: '/dashboard' };
    }

    const locale = (formData.get('locale') as string)?.trim() || user.preferredLocale || 'en';

    const created = await prisma.$transaction(async (tx) =>
      bootstrapCompanyForOwner(
        user!,
        {
          name,
          slug,
          locale,
        },
        tx
      )
    );

    try {
      await setWorkspaceCookies(created.company.id, created.branch.id);
    } catch (cookieErr) {
      console.error('[createCompanyWorkspace] cookie set failed', cookieErr);
    }

    await logActivity({
      ctx: {
        user,
        company: created.company,
        branch: created.branch,
        membership: created.membership,
        role: 'COMPANY_OWNER',
        canAccessAllBranches: true,
        branchIds: [created.branch.id],
      },
      action: 'company.created',
      entityType: 'Company',
      entityId: created.company.id,
      summary: `Created company ${created.company.name}`,
    });

    return { redirect: '/dashboard' };
  } catch (err) {
    console.error('[createCompanyWorkspace]', err);
    return { error: createShopErrorMessage(err) };
  }
}

/** @deprecated use createCompanyWorkspace */
export async function createShopAndSignIn(formData: FormData) {
  return createCompanyWorkspace(formData);
}

const DB_CHECK_TIMEOUT_MS = 10000;

export async function isDatabaseConnected(): Promise<boolean> {
  if (!process.env.DATABASE_URL?.trim()) return false;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), DB_CHECK_TIMEOUT_MS)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function hasAnyTenant(): Promise<boolean> {
  try {
    const count = await prisma.company.count({
      where: { slug: { not: DEMO_COMPANY_SLUG } },
    });
    return count > 0;
  } catch {
    return false;
  }
}

export async function clearTenantAndSignOut(): Promise<{ redirect: string }> {
  const cookieStore = await cookies();
  cookieStore.delete(WORKSPACE_COOKIE);
  cookieStore.delete(BRANCH_COOKIE);
  cookieStore.delete('tenant-id');
  const { clearAuthBridgeCookie } = await import('@/server/clerk-bridge');
  await clearAuthBridgeCookie();
  return { redirect: '/' };
}

export async function switchWorkspace(companyId: string, branchId?: string) {
  const user = await ensurePrismaUser();
  if (!user) throw new Error('Not authenticated');

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Company not found');

  const demoUser = isDemoEmail(user.email);
  const demoCo = isDemoCompanySlug(company.slug);
  if (demoUser !== demoCo) {
    throw new Error('Demo and production workspaces are isolated.');
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, companyId, isActive: true },
  });
  if (!membership && !user.isPlatformAdmin) {
    throw new Error('No access to this company');
  }
  // Platform admins still cannot enter demo from a production identity
  if (!membership && user.isPlatformAdmin && demoCo && !demoUser) {
    throw new Error('Demo and production workspaces are isolated.');
  }

  const branch = branchId
    ? await prisma.branch.findFirst({ where: { id: branchId, companyId } })
    : await prisma.branch.findFirst({
        where: { companyId, isDefault: true, isArchived: false },
      });

  if (!branch) throw new Error('Branch not found');

  await setWorkspaceCookies(companyId, branch.id);
  return { ok: true };
}

export async function getMyMemberships() {
  const user = await ensurePrismaUser();
  if (!user) return [];
  const demoUser = isDemoEmail(user.email);
  return prisma.membership.findMany({
    where: {
      userId: user.id,
      isActive: true,
      company: demoUser
        ? { slug: DEMO_COMPANY_SLUG }
        : { slug: { not: DEMO_COMPANY_SLUG } },
    },
    include: {
      company: true,
      branch: true,
    },
  });
}
