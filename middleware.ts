import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/checkout-subscription(.*)',  // Allow subscription checkout page
  '/api/(.*)',                   // Make all API routes public (Stripe, calculations, etc.)
]);

// In dev mode, also allow dashboard and profile without auth
const isDevModeRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Dev mode bypass: allow additional routes without auth
  const isDev = process.env.NODE_ENV === 'development' || 
    process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  
  // Always allow public routes
  if (isPublicRoute(request)) {
    return;
  }
  
  // In dev mode, also allow dashboard/profile
  if (isDev && isDevModeRoute(request)) {
    return;
  }
  
  // Protect all other routes
  await auth().protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
