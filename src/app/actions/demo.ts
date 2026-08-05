'use server';

import { prisma } from '@/lib/db';
import { requirePlatformAdmin, requirePermission } from '@/server/auth';
import { revalidatePath } from 'next/cache';
import { seedDemoCompany, DEMO_COMPANY_SLUG } from '@/server/demo-seed';

/**
 * One-click reset for presentation demos.
 * Available to platform admins, or company managers on demo-auto.
 */
export async function resetAndReseedDemo() {
  const user = await requirePlatformAdmin().catch(async () => {
    const ctx = await requirePermission('workspace:manage');
    if (ctx.company.slug !== DEMO_COMPANY_SLUG) {
      throw new Error('Reset demo is only available for the demo company or platform admins.');
    }
    return ctx.user;
  });

  void user;

  const result = await seedDemoCompany(prisma);

  revalidatePath('/dashboard');
  revalidatePath('/customers');
  revalidatePath('/inventory');
  revalidatePath('/repair-orders');
  revalidatePath('/invoices');
  revalidatePath('/analytics');
  revalidatePath('/platform');
  revalidatePath('/employees');
  revalidatePath('/suppliers');
  revalidatePath('/marketplace');
  revalidatePath('/activity');
  revalidatePath('/settings');

  return {
    ok: true as const,
    message: `Demo reset complete. ${result.stats.customers} customers, ${result.stats.parts} parts, ${result.stats.vehicles} vehicles, ${result.stats.staff} staff.`,
    result,
  };
}

/** @deprecated use resetAndReseedDemo */
export async function resetDemoData() {
  return resetAndReseedDemo();
}
