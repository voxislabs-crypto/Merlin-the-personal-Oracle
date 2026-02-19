import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/checkout-subscription(.*)',
  '/api/create-checkout-session(.*)',
  '/api/stripe/webhook(.*)',
  '/api/stripe/create-subscription-session(.*)',
  '/__clerk(.*)',
  '/sign-in/sso-callback(.*)',
  '/privacy(.*)',
  '/terms(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = new URL(req.url);
  const isOnSignIn = url.pathname.startsWith('/sign-in');
  const isOnSignUp = url.pathname.startsWith('/sign-up');

  // Redirect authenticated users away from sign-in/sign-up pages
  if (userId && isOnSignIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (userId && isOnSignUp) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

