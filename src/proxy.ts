import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { AUTH_BRIDGE_COOKIE, readAuthBridgeClerkId } from '@/server/clerk-bridge';

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
  '/demo(.*)',
]);

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

const isProduction = process.env.NODE_ENV === 'production';
const allowDevBypass =
  !isProduction &&
  (process.env.ALLOW_DEV_AUTH_BYPASS === 'true' || process.env.ALLOW_DEV_AUTH_BYPASS === '1');

const jwtKey = process.env.CLERK_JWT_KEY;

export default clerkMiddleware(
  async (auth, req) => {
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
  },
  {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
    ...(jwtKey ? { jwtKey } : {}),
  }
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
