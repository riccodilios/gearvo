import { NextResponse } from 'next/server';
import { ensurePrismaUser, getWorkspaceContext } from '@/server/auth';
import {
  authBridgeClearCookieHeader,
  authBridgeSetCookieHeader,
} from '@/server/auth-bridge-cookie';

export const dynamic = 'force-dynamic';

type Destination = '/sign-in' | '/welcome/setup' | '/dashboard';

/**
 * Post-auth continue — prefers Authorization: Bearer <Clerk session JWT>.
 * Avoids Server Action ID skew across Netlify deploys.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const sessionToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null;

    if (!sessionToken) {
      return NextResponse.json(
        {
          destination: '/sign-in' as Destination,
          error: 'Missing Clerk session token.',
        },
        { status: 401 }
      );
    }

    const user = await ensurePrismaUser({ sessionToken });
    if (!user) {
      return NextResponse.json(
        {
          destination: '/sign-in' as Destination,
          error:
            'Could not verify your Clerk session. Sign out and sign in again.',
        },
        {
          status: 401,
          headers: { 'Set-Cookie': authBridgeClearCookieHeader() },
        }
      );
    }

    const ctx = await getWorkspaceContext({ sessionToken });
    const destination: Destination = ctx ? '/dashboard' : '/welcome/setup';

    return NextResponse.json(
      { destination },
      {
        status: 200,
        headers: { 'Set-Cookie': authBridgeSetCookieHeader(user.clerkId) },
      }
    );
  } catch (err) {
    console.error('[api/auth/continue]', err);
    return NextResponse.json(
      {
        destination: '/sign-in' as Destination,
        error: 'Could not finish sign-in. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': authBridgeClearCookieHeader() } }
  );
}
