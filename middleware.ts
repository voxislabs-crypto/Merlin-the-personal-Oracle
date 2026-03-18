// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes (these require auth)
const isProtected = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/enhanced-dashboard(.*)',
  '/soul-dashboard(.*)',
  // Oracle routes are public for now (testing)
  // '/oracle-chat(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth().protect();
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