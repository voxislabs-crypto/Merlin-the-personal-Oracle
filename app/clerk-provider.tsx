'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

/**
 * Clerk Provider Wrapper
 * In dev mode, bypasses Clerk if keys are invalid
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const hasValidKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                       process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_bG9jYWxob3N0JA';
  
  // In dev mode with invalid keys, skip Clerk entirely
  if (isDev && !hasValidKeys) {
    console.log('[Auth] Running in dev mode without Clerk');
    return <>{children}</>;
  }
  
  return <BaseClerkProvider>{children}</BaseClerkProvider>;
}
