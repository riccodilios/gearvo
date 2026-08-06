import { redirect } from 'next/navigation';
import { ensurePrismaUser, getWorkspaceContext } from '@/server/auth';

export const dynamic = 'force-dynamic';

/**
 * Post-auth router:
 * - signed out → sign-in
 * - signed in, no real/demo workspace → setup
 * - signed in with workspace → dashboard
 *
 * Uses ensurePrismaUser (which wraps Clerk auth() in try/catch) so a missing
 * Clerk "dev browser" cookie on Netlify does not 500 the page.
 */
export default async function WelcomeContinuePage() {
  let user = null;
  let ctx = null;
  try {
    user = await ensurePrismaUser();
    if (user) {
      ctx = await getWorkspaceContext();
    }
  } catch (err) {
    // Never surface opaque RSC digests for auth/DB blips — send user somewhere recoverable.
    console.error('[welcome] post-auth routing failed:', err);
    redirect('/sign-in');
  }

  if (!user) {
    redirect('/sign-in');
  }

  if (!ctx) {
    redirect('/welcome/setup');
  }

  redirect('/dashboard');
}
