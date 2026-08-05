'use server';

import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
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
    // Company may still have been created — membership is enough for workspace.
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

    if (!user) return { error: 'Could not resolve user. Sign in, then try again.' };

    // Already owns a shop — send them in instead of failing oddly
    const existingMembership = await prisma.membership.findFirst({
      where: { userId: user.id, isActive: true, role: { in: ['COMPANY_OWNER', 'COMPANY_ADMIN'] } },
      include: { company: true, branch: true },
      orderBy: { createdAt: 'asc' },
    });
    if (existingMembership) {
      try {
        const cookieStore = await cookies();
        cookieStore.set(WORKSPACE_COOKIE, existingMembership.companyId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
        });
        const branchId =
          existingMembership.branchId ??
          (
            await prisma.branch.findFirst({
              where: {
                companyId: existingMembership.companyId,
                isArchived: false,
                deletedAt: null,
              },
              orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
            })
          )?.id;
        if (branchId) {
          cookieStore.set(BRANCH_COOKIE, branchId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
          });
        }
      } catch {
        /* membership alone is enough */
      }
      return { redirect: '/dashboard' };
    }

    const existing = await prisma.company.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const created = await prisma.$transaction(async (tx) => {
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

      await seedCompanyFeatures(c.id, 'TRIAL', tx);
      await ensureCompanyIntegrations(c.id, tx);

      return { company: c, branch };
    });

    try {
      const cookieStore = await cookies();
      cookieStore.set(WORKSPACE_COOKIE, created.company.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      });
      cookieStore.set(BRANCH_COOKIE, created.branch.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      });
      cookieStore.delete('tenant-id');
    } catch (cookieErr) {
      console.error('[createCompanyWorkspace] cookie set failed', cookieErr);
    }

    await logActivity({
      ctx: {
        user,
        company: created.company,
        branch: created.branch,
        membership: {
          id: '',
          userId: user.id,
          companyId: created.company.id,
          branchId: null,
          role: 'COMPANY_OWNER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
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
