'use server';

import { ensurePrismaUser, getWorkspaceContext } from '@/server/auth';

export type PostAuthDestination = '/sign-in' | '/welcome/setup' | '/dashboard';

/**
 * Resolve where a signed-in user should go after Clerk auth.
 * Called from the client after ClerkJS reports isSignedIn, so session cookies
 * are already present (avoids racing the OAuth handshake on a server redirect).
 */
export async function resolvePostAuthDestination(): Promise<{
  destination: PostAuthDestination;
  error?: string;
}> {
  try {
    const user = await ensurePrismaUser();
    if (!user) {
      return {
        destination: '/sign-in',
        error:
          'Browser session is active but the server could not verify it. Sign out, then try again — or switch Netlify to Clerk production (pk_live) keys.',
      };
    }

    const ctx = await getWorkspaceContext();
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
