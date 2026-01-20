import { clerkMiddleware } from '@clerk/nextjs/server';

// Check for required Clerk environment variables
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

// Provide helpful error messages if keys are missing
if (!clerkPublishableKey) {
  console.error('❌ ERROR: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing!');
  console.error('   Add it to your environment variables:');
  console.error('   - Local: .env.local file');
  console.error('   - Vercel: Project Settings → Environment Variables');
  console.error('   See VERCEL_DEPLOYMENT.md for setup instructions');
}

if (!clerkSecretKey) {
  console.error('❌ ERROR: CLERK_SECRET_KEY is missing!');
  console.error('   Add it to your environment variables:');
  console.error('   - Local: .env.local file');
  console.error('   - Vercel: Project Settings → Environment Variables');
  console.error('   See VERCEL_DEPLOYMENT.md for setup instructions');
}

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
