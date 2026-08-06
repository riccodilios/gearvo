import { cookies } from 'next/headers';
import { verifyToken, createClerkClient } from '@clerk/backend';
import {
  AUTH_BRIDGE_COOKIE,
  BRIDGE_MAX_AGE_SEC,
  createAuthBridgeValue,
  readAuthBridgeClerkId,
} from '@/server/auth-bridge-cookie';

export { AUTH_BRIDGE_COOKIE, readAuthBridgeClerkId, createAuthBridgeValue };

/**
 * Public JWT verification key for Clerk development instance
 * `maximum-squid-62` (from /.well-known/jwks.json). Safe to ship — it is public.
 */
const CLERK_DEV_INSTANCE_JWT_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvklA4GlE0+iWFLxyq0hg
zU54pvfm6aTK/gHCFy+vKX6QTMjgHB5a2JxBGxq7Wib1fjKQxC9fMzcMtcU2dq6I
IHao3GtiQ2ANGU4yrjLN5xiViJzxz3H6i54j9K3RX6PIt/ROw95xyFKuj7wnH8OX
Cd02VJhT1l+oGON8XnoEjmhpu79f2aCKNmZSEgoyLIvuk/Fqt+rbhEkgCU7e83ww
BUeXt8SsSIR3lQbibboZoGylhs8MPbOf5P8NSYLAqeblh9Hm4o3OzM/WKz5VHo/e
ffPcywjG99hB0VEEA1bZpkOZAmcJErWLjvVa6hVkZFC/whDmNt6x4yYgSH/jIx4U
wQIDAQAB
-----END PUBLIC KEY-----
`;

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
  let jwtKey = process.env.CLERK_JWT_KEY || CLERK_DEV_INSTANCE_JWT_KEY;
  if (jwtKey.includes('\\n')) {
    jwtKey = jwtKey.replace(/\\n/g, '\n');
  }
  return { secretKey, jwtKey };
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
    try {
      const payload = await verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch (err2) {
      console.error('[clerk-bridge] verifyToken secretKey-only failed:', err2);
      return null;
    }
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
