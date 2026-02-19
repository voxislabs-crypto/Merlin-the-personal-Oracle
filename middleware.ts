// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes (these do NOT require auth)
const isPublic = createRouteMatcher([
  '/',                        // landing page
  '/sign-in(.*)',             // sign-in page
  '/sign-up(.*)',             // sign-up page
  '/api/create-checkout-session(.*)',  // Stripe checkout API
  '/api/webhook/stripe(.*)',  // Stripe webhook (if you have one)
  '/__clerk_callback(.*)',    // Clerk OAuth callback
  '/sso-callback(.*)',        // SSO callback variant
]);

export default clerkMiddleware((auth, req) => {
  // If the route is NOT public AND user is NOT authenticated → redirect to sign-in
  if (!isPublic(req)) {
    const { userId } = auth();
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // If authenticated user tries to access sign-in page → redirect to dashboard
  if (req.url.startsWith('/sign-in') && auth().userId) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Continue normally
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run middleware on all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};