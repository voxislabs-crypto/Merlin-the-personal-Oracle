import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Public routes that don't require authentication
 * - Homepage, auth pages, checkout
 * - All API routes (Stripe needs this for webhooks/checkout)
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',           // Clerk SSO callback
  '/checkout-subscription(.*)',  // Allow subscription checkout page
  '/api/(.*)',                   // Make all API routes public (Stripe, calculations, etc.)
  '/privacy(.*)',                // Public policy pages
  '/terms(.*)',
]);

/**
 * Clerk Middleware - Production Mode
 * Protected routes: /dashboard, /profile, /enhanced-dashboard, /soul-dashboard, etc.
 * Public routes: /, /sign-in, /sign-up, /checkout-subscription, /api/*
 */
export default clerkMiddleware(async (auth, request) => {
  // Only protect non-public routes
  if (!isPublicRoute(request)) {
    await auth().protect();
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
