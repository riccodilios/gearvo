'use server';

import { ensurePrismaUser, getWorkspaceContext } from '@/server/auth';
import { clearAuthBridgeCookie, setAuthBridgeCookie } from '@/server/clerk-bridge';

export type PostAuthDestination = '/sign-in' | '/welcome/setup' | '/dashboard';

/**
 * Resolve where a signed-in user should go after Clerk auth.
 * Prefer passing the browser session JWT — Clerk cookies often do not reach
 * Netlify functions when using development (pk_test) keys.
 */
export async function resolvePostAuthDestination(sessionToken?: string | null): Promise<{
  destination: PostAuthDestination;
  error?: string;
}> {
  try {
    const user = await ensurePrismaUser({ sessionToken });
    if (!user) {
      return {
        destination: '/sign-in',
        error:
          'Could not verify your Clerk session on the server. Sign out and sign in again. If it keeps failing, confirm CLERK_SECRET_KEY and CLERK_JWT_KEY are set on Netlify.',
      };
    }

    await setAuthBridgeCookie(user.clerkId);

    const ctx = await getWorkspaceContext({ sessionToken });
    if (!ctx) {
      return { destination: '/welcome/setup' };
    }

    return { destination: '/dashboard' };
  } catch (err) {
    console.error('[post-auth] resolve failed:', err);
    return {
      destination: '/sign-in',
      error: 'Could not finish sign-in. Please try again.',
    };
  }
}

export async function clearAuthBridge() {
  await clearAuthBridgeCookie();
}
