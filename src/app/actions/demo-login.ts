'use server';

import { prisma } from '@/lib/db';
import { assertRateLimit } from '@/server/rate-limit';
import { DEMO_COMPANY_SLUG } from '@/server/demo-seed';

const DEMO_EMAILS = new Set(['demo.owner@gearvo.app', 'demo.manager@gearvo.app']);
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'GearvoDemo2026!';

async function clerkFetch(path: string, init?: RequestInit) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error('Clerk is not configured');
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json === 'object' && json && 'errors' in json
        ? JSON.stringify((json as { errors: unknown }).errors)
        : `Clerk error ${res.status}`
    );
  }
  return json as { id?: string; token?: string; url?: string };
}

/** Password demo login that issues a Clerk sign-in ticket (no email OTP). */
export async function enterDemoWithPassword(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  await assertRateLimit(`demo-enter:${email}`, 10, 60_000);

  if (!DEMO_EMAILS.has(email) || password !== DEMO_PASSWORD) {
    return { ok: false as const, error: 'Invalid demo email or password.' };
  }

  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      memberships: {
        where: { isActive: true, company: { slug: DEMO_COMPANY_SLUG } },
        take: 1,
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    return {
      ok: false as const,
      error: 'Demo account is not linked. Ask an admin to run the demo provision script.',
    };
  }

  if (user.clerkId.startsWith('dev_clerk_')) {
    return {
      ok: false as const,
      error: 'Demo Clerk user missing. Run: node scripts/provision-demo-clerk.js',
    };
  }

  // Best-effort: disable MFA so password sign-in is cleaner too
  try {
    await clerkFetch(`/users/${user.clerkId}/disable_mfa`, { method: 'POST' });
  } catch {
    /* ignore if already disabled */
  }

  const token = await clerkFetch('/sign_in_tokens', {
    method: 'POST',
    body: JSON.stringify({
      user_id: user.clerkId,
      expires_in_seconds: 60 * 10, // 10 minutes
    }),
  });

  if (!token.token) {
    return { ok: false as const, error: 'Could not create demo session.' };
  }

  return {
    ok: true as const,
    ticket: token.token,
    redirectTo: '/dashboard',
  };
}
