import { redirect } from 'next/navigation';
import { requirePermission } from '@/server/auth';
import { requireFeature } from '@/server/features';
import type { Permission } from '@/server/permissions';
import type { FeatureModule } from '@prisma/client';

/** Server-side page gate — redirects to dashboard on denial. */
export async function gatePage(
  permission: Permission,
  feature?: FeatureModule
) {
  try {
    const ctx = await requirePermission(permission);
    if (feature) await requireFeature(ctx, feature);
    return ctx;
  } catch {
    redirect('/dashboard');
  }
}
