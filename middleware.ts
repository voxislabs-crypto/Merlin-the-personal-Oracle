// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/enhanced-dashboard(.*)',
  '/soul-dashboard(.*)',
  '/profile(.*)',
  '/checkout-subscription(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect dashboard routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};