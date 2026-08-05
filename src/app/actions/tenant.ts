'use server';

import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { env } from '@/server/env';
import {
  BRANCH_COOKIE,
  WORKSPACE_COOKIE,
  ensurePrismaUser,
} from '@/server/auth';
import { seedCompanyFeatures } from '@/server/features';
import { ensureCompanyIntegrations } from '@/server/integrations/registry';
import { logActivity } from '@/server/audit';
import { assertRateLimit } from '@/server/rate-limit';
import { toUserError } from '@/server/errors';

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

  try {
    await assertRateLimit(`create-company:${slug}`, 5, 60_000);
  } catch {
    return { error: 'Too many attempts. Please wait a minute.' };
  }

  try {
    let user = await ensurePrismaUser();

    if (!user) {
      if (env.clerkConfigured) {
        const session = await auth();
        if (!session.userId) {
          return { error: 'You must sign in before creating a company.' };
        }
        user = await ensurePrismaUser();
      } else if (env.allowDevBypass) {
        user = await prisma.user.upsert({
          where: { clerkId: 'dev_clerk_owner' },
          create: {
            clerkId: 'dev_clerk_owner',
            email: 'owner@demo.gearvo.local',
            fullName: 'Demo Owner',
            isPlatformAdmin: true,
          },
          update: {},
        });
      } else {
        return { error: 'Authentication required.' };
      }
    }

    if (!user) return { error: 'Could not resolve user.' };

    const existing = await prisma.company.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const company = await prisma.$transaction(async (tx) => {
      const c = await tx.company.create({
        data: {
          name,
          slug: finalSlug,
          plan: 'TRIAL',
          currency: 'SAR',
          locale: 'en',
          timezone: 'Asia/Riyadh',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      const branch = await tx.branch.create({
        data: {
          companyId: c.id,
          name: 'Main Branch',
          slug: 'main',
          isDefault: true,
        },
      });

      await tx.membership.create({
        data: {
          userId: user!.id,
          companyId: c.id,
          branchId: null,
          role: 'COMPANY_OWNER',
        },
      });

      return { company: c, branch };
    });

    await seedCompanyFeatures(company.company.id, 'TRIAL');
    await ensureCompanyIntegrations(company.company.id);

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, company.company.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
    cookieStore.set(BRANCH_COOKIE, company.branch.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
    // Clear legacy cookie
    cookieStore.delete('tenant-id');

    await logActivity({
      ctx: {
        user,
        company: company.company,
        branch: company.branch,
        membership: {
          id: '',
          userId: user.id,
          companyId: company.company.id,
          branchId: null,
          role: 'COMPANY_OWNER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        role: 'COMPANY_OWNER',
        canAccessAllBranches: true,
        branchIds: [company.branch.id],
      },
      action: 'company.created',
      entityType: 'Company',
      entityId: company.company.id,
      summary: `Created company ${company.company.name}`,
    });

    return { redirect: '/dashboard' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Can't reach database") || msg.includes('Connection')) {
      return {
        error: 'Database is not connected. Set DATABASE_URL and run migrations.',
      };
    }
    return { error: toUserError(err).message };
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
    const count = await prisma.company.count();
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
  return { redirect: '/' };
}

export async function switchWorkspace(companyId: string, branchId?: string) {
  const user = await ensurePrismaUser();
  if (!user) throw new Error('Not authenticated');

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, companyId, isActive: true },
  });
  if (!membership && !user.isPlatformAdmin) {
    throw new Error('No access to this company');
  }

  const branch = branchId
    ? await prisma.branch.findFirst({ where: { id: branchId, companyId } })
    : await prisma.branch.findFirst({
        where: { companyId, isDefault: true, isArchived: false },
      });

  if (!branch) throw new Error('Branch not found');

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, companyId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });
  cookieStore.set(BRANCH_COOKIE, branch.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });

  return { ok: true };
}

export async function getMyMemberships() {
  const user = await ensurePrismaUser();
  if (!user) return [];
  return prisma.membership.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      company: true,
      branch: true,
    },
  });
}
