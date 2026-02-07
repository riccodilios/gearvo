import { cache } from 'react';
import { headers, cookies } from 'next/headers';
import { prisma } from './db';

const DB_TIMEOUT_MS = 1500;

/**
 * Get current tenant ID from request context.
 * Order: x-tenant-id header → tenant-id cookie → first tenant in DB.
 * When database is unreachable or slow, returns null after a short timeout (demo mode).
 * Cached per request so the DB is only checked once per page load.
 */
export const getTenantId = cache(async (): Promise<string | null> => {
  const headersList = await headers();
  const tenantIdFromHeader = headersList.get('x-tenant-id');
  if (tenantIdFromHeader) return tenantIdFromHeader;

  const cookieStore = await cookies();
  const tenantIdFromCookie = cookieStore.get('tenant-id')?.value;
  if (tenantIdFromCookie) return tenantIdFromCookie;

  try {
    const tenant = await Promise.race([
      prisma.tenant.findFirst(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), DB_TIMEOUT_MS)
      ),
    ]);
    if (!tenant) return null;
    return tenant.id;
  } catch {
    return null;
  }
});

/** Throw with a friendly message when in demo mode (no DB). Use in create/update/delete actions. */
export async function requireTenantId(): Promise<string> {
  const id = await getTenantId();
  if (!id) {
    throw new Error(
      'Database is not connected. Connect PostgreSQL and run db:push and db:seed to enable creating and editing data.'
    );
  }
  return id;
}
