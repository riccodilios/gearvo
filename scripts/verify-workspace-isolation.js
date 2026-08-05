/**
 * E2E-style verification: bootstrap a real company and assert isolation from demo-auto.
 * Usage: node scripts/verify-workspace-isolation.js
 */
const { loadEnv } = require('./load-env');
loadEnv();
const { PrismaClient, FeatureModule, IntegrationStatus } = require('@prisma/client');
const p = new PrismaClient();

const DEMO_SLUG = 'demo-auto';

(async () => {
  const stamp = Date.now().toString(36);
  const email = `e2e.owner.${stamp}@gearvo.test`;
  const clerkId = `e2e_clerk_${stamp}`;

  const user = await p.user.create({
    data: { clerkId, email, fullName: 'E2E Owner', isPlatformAdmin: false },
  });

  const slug = `e2e-shop-${stamp}`;
  const company = await p.company.create({
    data: {
      name: 'E2E Shop',
      slug,
      plan: 'TRIAL',
      currency: 'SAR',
      locale: 'en',
      timezone: 'Asia/Riyadh',
      status: 'ACTIVE',
      trialEndsAt: new Date(Date.now() + 14 * 86400000),
    },
  });
  const branch = await p.branch.create({
    data: {
      companyId: company.id,
      name: 'Main Branch',
      slug: 'main',
      isDefault: true,
    },
  });
  await p.membership.create({
    data: {
      userId: user.id,
      companyId: company.id,
      branchId: null,
      role: 'COMPANY_OWNER',
      isActive: true,
    },
  });

  const features = Object.values(FeatureModule);
  await p.companyFeatureFlag.createMany({
    data: features.map((feature) => ({
      companyId: company.id,
      feature,
      enabled: feature !== 'AI',
    })),
    skipDuplicates: true,
  });

  const customer = await p.customer.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      fullName: 'E2E Customer',
      phone: '+966500000001',
      email: `customer.${stamp}@test.local`,
    },
  });

  // Isolation assertions
  const demo = await p.company.findUnique({ where: { slug: DEMO_SLUG } });
  if (!demo) throw new Error('demo-auto missing — seed demo first');

  const prodMemberships = await p.membership.findMany({
    where: { userId: user.id, isActive: true },
    include: { company: true },
  });
  if (prodMemberships.some((m) => m.company.slug === DEMO_SLUG)) {
    throw new Error('Production user linked to demo-auto');
  }
  if (prodMemberships.length !== 1 || prodMemberships[0].company.slug !== slug) {
    throw new Error('Production user membership incorrect');
  }

  const demoCustomers = await p.customer.count({ where: { companyId: demo.id } });
  const e2eCustomers = await p.customer.count({ where: { companyId: company.id } });
  if (e2eCustomers !== 1) throw new Error('E2E customer not persisted');
  if (demoCustomers < 1) throw new Error('Demo should still have seeded customers');

  // Cleanup E2E tenant only (never touch demo)
  await p.company.delete({ where: { id: company.id } });
  await p.user.delete({ where: { id: user.id } });

  console.log(
    JSON.stringify(
      {
        ok: true,
        createdSlug: slug,
        demoSlug: DEMO_SLUG,
        demoCustomers,
        e2eCustomersBeforeCleanup: 1,
        customerId: customer.id,
        isolation: 'production company never shares demo-auto',
      },
      null,
      2
    )
  );

  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
