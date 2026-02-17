import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',  // Make all API routes public
]);

export default clerkMiddleware(async (auth, request) => {
  // Dev mode bypass: skip auth entirely
  const isDev = process.env.NODE_ENV === 'development' || 
    process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  
  if (isDev) {
    return; // Allow all routes
  }
  
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
