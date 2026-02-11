'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  // Always provide ClerkProvider context so useUser() and other hooks work
  // Dev mode bypasses are handled in middleware and auth checks, not here
  return <BaseClerkProvider>{children}</BaseClerkProvider>;
}
