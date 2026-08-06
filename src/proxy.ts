import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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

export default clerkMiddleware(
  async (auth, req) => {
    // Production must always have Clerk configured — fail closed
    if (isProduction && !clerkConfigured) {
      if (isPublicRoute(req)) return NextResponse.next();
      return new NextResponse('Authentication is not configured.', { status: 503 });
    }

    // Development without Clerk only when explicitly allowed
    if (!clerkConfigured) {
      if (!allowDevBypass && !isPublicRoute(req)) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
      return NextResponse.next();
    }

    try {
      if (!isPublicRoute(req)) {
        await auth().protect();
      }
    } catch {
      if (isPublicRoute(req)) return NextResponse.next();
      const signIn = new URL('/sign-in', req.url);
      signIn.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signIn);
    }
  },
  {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
  }
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
