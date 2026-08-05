import type { Plan, Prisma, User } from '@prisma/client';
import { prisma } from '@/lib/db';
import { seedCompanyFeatures } from '@/server/features';
import { ensureCompanyIntegrations } from '@/server/integrations/registry';
import { DEMO_COMPANY_SLUG } from '@/server/demo-constants';

type DbClient = Prisma.TransactionClient | typeof prisma;

export type BootstrapCompanyInput = {
  name: string;
  slug: string;
  locale?: string;
  plan?: Plan;
  currency?: string;
  timezone?: string;
};

/**
 * Create a production company with branch, owner membership, features, and integrations.
 * Never creates or joins the presentation demo company.
 */
export async function bootstrapCompanyForOwner(
  user: User,
  input: BootstrapCompanyInput,
  db: DbClient = prisma
) {
  const name = input.name.trim();
  let slug = input.slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  if (!slug) {
    slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'my-shop';
  }
  if (slug === DEMO_COMPANY_SLUG) {
    slug = `${slug}-shop`;
  }

  const existing = await db.company.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;
  const plan = input.plan ?? 'TRIAL';

  const company = await db.company.create({
    data: {
      name,
      slug: finalSlug,
      plan,
      currency: input.currency ?? 'SAR',
      locale: input.locale === 'ar' ? 'ar' : 'en',
      timezone: input.timezone ?? 'Asia/Riyadh',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
    },
  });

  const branch = await db.branch.create({
    data: {
      companyId: company.id,
      name: 'Main Branch',
      slug: 'main',
      isDefault: true,
    },
  });

  const membership = await db.membership.create({
    data: {
      userId: user.id,
      companyId: company.id,
      branchId: null,
      role: 'COMPANY_OWNER',
      isActive: true,
    },
  });

  await seedCompanyFeatures(company.id, plan, db);
  await ensureCompanyIntegrations(company.id, db);

  return { company, branch, membership };
}

/** Ensure feature flags exist (heals companies created before flags were seeded). */
export async function ensureCompanyFeatureFlags(companyId: string, plan: Plan = 'TRIAL') {
  const count = await prisma.companyFeatureFlag.count({ where: { companyId } });
  if (count === 0) {
    await seedCompanyFeatures(companyId, plan);
  }
}
