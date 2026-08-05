import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ensurePrismaUser, getWorkspaceContext } from '@/server/auth';
import { env } from '@/server/env';

export const dynamic = 'force-dynamic';

/**
 * Post-auth router:
 * - signed out → sign-in
 * - signed in, no real/demo workspace → setup
 * - signed in with workspace → dashboard
 */
export default async function WelcomeContinuePage() {
  if (env.clerkConfigured) {
    const session = await auth();
    if (!session.userId) {
      redirect('/sign-in');
    }
  }

  const user = await ensurePrismaUser();
  if (!user) {
    redirect('/sign-in');
  }

  const ctx = await getWorkspaceContext();
  if (!ctx) {
    redirect('/welcome/setup');
  }

  redirect('/dashboard');
}
