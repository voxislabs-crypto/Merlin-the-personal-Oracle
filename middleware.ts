// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes (these require auth)
const isProtected = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/enhanced-dashboard(.*)',
  '/soul-dashboard(.*)',
  '/astro-calculator(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      // Redirect to sign-in if not authenticated
      const signInUrl = new URL('/sign-in', req.url);
      return Response.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip static files and Next.js internals
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};