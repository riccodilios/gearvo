'use server';

import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function createShopAndSignIn(formData: FormData): Promise<{ error?: string; redirect?: string }> {
  const name = (formData.get('name') as string)?.trim();
  let slug = (formData.get('slug') as string)?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!slug) slug = (name ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'my-shop';

  if (!name) {
    return { error: 'Shop name is required.' };
  }

  try {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug: finalSlug,
        plan: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const cookieStore = await cookies();
    cookieStore.set('tenant-id', tenant.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { redirect: '/dashboard' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Can't reach database") || msg.includes('Connection')) {
      return { error: 'Database is not connected. Set DATABASE_URL and run: npx prisma db push' };
    }
    return { error: msg };
  }
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
    const count = await prisma.tenant.count();
    return count > 0;
  } catch {
    return false;
  }
}

/** Clear tenant cookie and return redirect path (client should navigate). */
export async function clearTenantAndSignOut(): Promise<{ redirect: string }> {
  const cookieStore = await cookies();
  cookieStore.delete('tenant-id');
  return { redirect: '/' };
}
