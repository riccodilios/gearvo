/**
 * Keep presentation demo Clerk accounts linked to Al-Noor memberships.
 * Seed recreates staff under placeholder clerkIds; this reattaches real Clerk users.
 */
import type { PrismaClient } from '@prisma/client';

export const DEMO_PRESENTATION_ACCOUNTS = [
  {
    placeholderClerkId: 'dev_clerk_owner',
    email: 'demo.owner@gearvo.app',
    fullName: 'Ahmed Al-Rashid',
    isPlatformAdmin: true,
  },
  {
    placeholderClerkId: 'dev_clerk_manager',
    email: 'demo.manager@gearvo.app',
    fullName: 'Sara Al-Harbi',
    isPlatformAdmin: false,
  },
] as const;

async function clerkFetch(path: string, init?: RequestInit) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) return null;
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as { id?: string } | { id?: string }[] | null;
}

/**
 * Resolve the Prisma user that should own demo memberships for a presentation account.
 * Prefers an existing real Clerk-linked row (by email) over the seed placeholder.
 */
export async function resolveDemoStaffUser(
  prisma: PrismaClient,
  account: {
    placeholderClerkId: string;
    email: string;
    fullName: string;
    isPlatformAdmin: boolean;
  }
) {
  const byEmail = await prisma.user.findFirst({
    where: { email: account.email },
  });
  const byPlaceholder = await prisma.user.findUnique({
    where: { clerkId: account.placeholderClerkId },
  });

  if (byEmail) {
    const updated = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        fullName: account.fullName,
        isPlatformAdmin: account.isPlatformAdmin,
        email: account.email,
      },
    });
    if (byPlaceholder && byPlaceholder.id !== byEmail.id) {
      await prisma.membership.deleteMany({ where: { userId: byPlaceholder.id } });
      await prisma.user.delete({ where: { id: byPlaceholder.id } }).catch(() => undefined);
    }
    return updated;
  }

  if (byPlaceholder) {
    return prisma.user.update({
      where: { id: byPlaceholder.id },
      data: {
        email: account.email,
        fullName: account.fullName,
        isPlatformAdmin: account.isPlatformAdmin,
      },
    });
  }

  return prisma.user.create({
    data: {
      clerkId: account.placeholderClerkId,
      email: account.email,
      fullName: account.fullName,
      isPlatformAdmin: account.isPlatformAdmin,
    },
  });
}

/** Link placeholder / email-matched Prisma users to live Clerk accounts when secret is set. */
export async function linkDemoClerkAccounts(prisma: PrismaClient) {
  if (!process.env.CLERK_SECRET_KEY) {
    return { linked: 0, skipped: true as const };
  }

  let linked = 0;
  for (const account of DEMO_PRESENTATION_ACCOUNTS) {
    const list = await clerkFetch(
      `/users?email_address=${encodeURIComponent(account.email)}&limit=1`
    );
    const clerkUser = Array.isArray(list) ? list[0] : null;
    if (!clerkUser?.id) continue;

    const clerkId = clerkUser.id;
    const target =
      (await prisma.user.findFirst({ where: { email: account.email } })) ||
      (await prisma.user.findUnique({ where: { clerkId: account.placeholderClerkId } }));

    if (!target) continue;

    const clash = await prisma.user.findUnique({ where: { clerkId } });
    if (clash && clash.id !== target.id) {
      // Move memberships from orphan Clerk-synced row onto the seeded staff row
      await prisma.membership.updateMany({
        where: { userId: clash.id },
        data: { userId: target.id },
      });
      await prisma.user.delete({ where: { id: clash.id } }).catch(() => undefined);
    }

    await prisma.user.update({
      where: { id: target.id },
      data: {
        clerkId,
        email: account.email,
        fullName: account.fullName,
        isPlatformAdmin: account.isPlatformAdmin,
      },
    });

    try {
      await clerkFetch(`/users/${clerkId}/disable_mfa`, { method: 'POST' });
    } catch {
      /* ignore */
    }

    linked += 1;
  }

  return { linked, skipped: false as const };
}
