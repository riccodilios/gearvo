import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { AUTH_BRIDGE_COOKIE, readAuthBridgeClerkId } from '@/server/auth-bridge-cookie';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/welcome(.*)',
  '/features(.*)',
  '/pricing(.*)',
  '/about(.*)',
  '/contact(.*)',
  '/faq(.*)',
  '/blog(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/book-demo(.*)',
  '/free-trial(.*)',
  '/api/webhooks(.*)',
  '/api/health(.*)',
  '/api/cron(.*)',
  '/api/auth/continue(.*)',
  '/demo(.*)',
]);

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

const isProduction = process.env.NODE_ENV === 'production';
const allowDevBypass =
  !isProduction &&
  (process.env.ALLOW_DEV_AUTH_BYPASS === 'true' || process.env.ALLOW_DEV_AUTH_BYPASS === '1');

function hasClerkHandshake(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  return (
    q.has('__clerk_handshake') ||
    q.has('__clerk_db_jwt') ||
    q.has('__clerk_ticket') ||
    q.has('__clerk_status')
  );
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProduction && !clerkConfigured) {
    if (isPublicRoute(req)) return NextResponse.next();
    return new NextResponse('Authentication is not configured.', { status: 503 });
  }

  if (!clerkConfigured) {
    if (!allowDevBypass && !isPublicRoute(req)) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    return NextResponse.next();
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  try {
    const session = await auth();
    if (session.userId) {
      return NextResponse.next();
    }
  } catch {
    // pk_test on Netlify often cannot read Clerk cookies — fall through to bridge
  }

  const bridged = readAuthBridgeClerkId(req.cookies.get(AUTH_BRIDGE_COOKIE)?.value);
  if (bridged) {
    return NextResponse.next();
  }

  const signIn = new URL('/sign-in', req.url);
  signIn.searchParams.set('redirect_url', req.url);
  return NextResponse.redirect(signIn);
});

/**
 * Google OAuth returns to /welcome?__clerk_handshake=…
 * On Netlify + Clerk development keys, clerkMiddleware handshake handling 500s.
 * Skip Clerk middleware for those public requests and let ClerkJS + /api/auth/continue finish.
 */
export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  if (hasClerkHandshake(req) && isPublicRoute(req)) {
    return NextResponse.next();
  }

  try {
    return await clerkHandler(req, event);
  } catch (err) {
    console.error('[proxy] clerkMiddleware threw:', err);
    if (hasClerkHandshake(req)) {
      return NextResponse.next();
    }
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
