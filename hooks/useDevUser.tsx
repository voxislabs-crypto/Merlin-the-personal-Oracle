'use client';

import { useUser as useClerkUser } from '@clerk/nextjs';
import { UserButton as ClerkUserButton } from '@clerk/nextjs';

/**
 * Check if we're in dev mode
 */
const isDev = () => {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development' || 
           process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  }
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true';
};

/**
 * Wrapper around Clerk's useUser that returns mock data in dev mode
 */
export function useUser() {
  // Don't call Clerk hooks at all in dev mode
  if (isDev()) {
    // Return mock user data in dev mode
    return {
      user: {
        id: 'dev-user-123',
        firstName: 'Dev',
        lastName: 'User',
        fullName: 'Dev User',
        primaryEmailAddress: {
          emailAddress: 'dev@localhost.com'
        }
      } as any,
      isLoaded: true,
      isSignedIn: true
    };
  }
  
  // Production: use real Clerk hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkUser();
}

/**
 * Wrapper around Clerk's UserButton that shows a mock button in dev mode
 */
export function UserButton(props: any) {
  if (isDev()) {
    // Return mock user button in dev mode
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
          DU
        </div>
        <span className="text-sm text-slate-300 hidden sm:inline">Dev User</span>
      </div>
    );
  }
  
  // Production: use real Clerk UserButton
  return <ClerkUserButton {...props} />;
}
