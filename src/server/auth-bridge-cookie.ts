import { createHmac, timingSafeEqual } from 'crypto';

/** HttpOnly bridge so Netlify can trust a session when Clerk cookies do not propagate. */
export const AUTH_BRIDGE_COOKIE = 'gearvo-auth';
export const BRIDGE_MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 days

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

export function authBridgeSetCookieHeader(clerkUserId: string): string {
  const value = createAuthBridgeValue(clerkUserId);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${AUTH_BRIDGE_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${BRIDGE_MAX_AGE_SEC}${secure}`;
}

export function authBridgeClearCookieHeader(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${AUTH_BRIDGE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
