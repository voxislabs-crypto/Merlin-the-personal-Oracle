'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

/**
 * Clerk Provider Wrapper
 * Always uses real Clerk authentication - no dev mode bypasses
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  return <BaseClerkProvider>{children}</BaseClerkProvider>;
}
