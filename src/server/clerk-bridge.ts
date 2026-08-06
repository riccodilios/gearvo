import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { verifyToken, createClerkClient } from '@clerk/backend';

/** HttpOnly bridge so Netlify can trust a Clerk session when Clerk cookies do not propagate. */
export const AUTH_BRIDGE_COOKIE = 'gearvo-auth';
const BRIDGE_MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 days

function signingKey() {
  return process.env.CLERK_SECRET_KEY || process.env.CRON_SECRET || 'gearvo-dev-bridge';
}

function sign(payload: string) {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

export function createAuthBridgeValue(clerkUserId: string) {
  const exp = Math.floor(Date.now() / 1000) + BRIDGE_MAX_AGE_SEC;
  const body = `${clerkUserId}.${exp}`;
  return `${body}.${sign(body)}`;
}

export function readAuthBridgeClerkId(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  const [clerkUserId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!clerkUserId || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  const expected = sign(`${clerkUserId}.${expStr}`);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return clerkUserId;
}

export async function setAuthBridgeCookie(clerkUserId: string) {
  const jar = await cookies();
  jar.set(AUTH_BRIDGE_COOKIE, createAuthBridgeValue(clerkUserId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: BRIDGE_MAX_AGE_SEC,
  });
}

export async function clearAuthBridgeCookie() {
  const jar = await cookies();
  jar.delete(AUTH_BRIDGE_COOKIE);
}

function jwtVerifyOptions() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  let jwtKey = process.env.CLERK_JWT_KEY;
  if (jwtKey?.includes('\\n')) {
    jwtKey = jwtKey.replace(/\\n/g, '\n');
  }
  return {
    secretKey,
    ...(jwtKey ? { jwtKey } : {}),
  };
}

/** Verify a Clerk session JWT from the browser (works with pk_test on Netlify). */
export async function clerkUserIdFromSessionToken(
  sessionToken: string | null | undefined
): Promise<string | null> {
  if (!sessionToken?.trim()) return null;
  try {
    const payload = await verifyToken(sessionToken, jwtVerifyOptions());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch (err) {
    console.error('[clerk-bridge] verifyToken failed:', err);
    return null;
  }
}

export type ClerkProfile = {
  clerkId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

/** Load profile via Clerk Backend API when currentUser() is unavailable. */
export async function fetchClerkProfile(clerkId: string): Promise<ClerkProfile | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  try {
    const client = createClerkClient({ secretKey });
    const u = await client.users.getUser(clerkId);
    const email =
      u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
      u.emailAddresses[0]?.emailAddress ??
      `${clerkId}@users.clerk.local`;
    const fullName =
      [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'User';
    return {
      clerkId,
      email,
      fullName,
      avatarUrl: u.imageUrl ?? null,
    };
  } catch (err) {
    console.error('[clerk-bridge] users.getUser failed:', err);
    return null;
  }
}
