/**
 * Compatibility helpers during Tenant → Company migration.
 */
export {
  getCompanyId as getTenantId,
  requireCompanyId as requireTenantId,
  requireWorkspace,
  requirePermission,
  branchScope,
  companyScope,
  getWorkspaceContext,
} from '@/server/auth';

import { cache } from 'react';
import { getWorkspaceContext } from '@/server/auth';

/** Display helper used by layouts (name/slug). */
export const getTenant = cache(async (): Promise<{ id: string; name: string; slug: string } | null> => {
  const ctx = await getWorkspaceContext();
  if (!ctx) return null;
  return { id: ctx.company.id, name: ctx.company.name, slug: ctx.company.slug };
});
