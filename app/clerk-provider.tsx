'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  // Always provide ClerkProvider context so useUser() and other hooks work
  // In dev mode, dummy keys are used and middleware bypasses all auth
  return <BaseClerkProvider>{children}</BaseClerkProvider>;
}
