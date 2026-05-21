// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const clerkDomain = process.env.NEXT_PUBLIC_CLERK_CUSTOM_DOMAIN || process.env.NEXT_PUBLIC_CLERK_DOMAIN || undefined;
const isSatellite = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === 'true';
const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up';

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

export default clerkMiddleware(
  async (auth, req) => {
  if (isProtected(req)) {
    await auth().protect();
  }
  },
  {
    domain: clerkDomain,
    isSatellite,
    signInUrl,
    signUpUrl,
  },
);

export const config = {
  matcher: [
    // Skip static files and Next.js internals
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};