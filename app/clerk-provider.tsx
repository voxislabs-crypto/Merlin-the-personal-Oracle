'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  // Dev mode bypass: skip Clerk entirely to avoid invalid key issues
  const isDev = process.env.NODE_ENV === 'development' || 
    process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  
  if (isDev) {
    console.log('🔓 Dev mode: Clerk authentication bypassed');
    return <>{children}</>;
  }
  
  // Production mode: use real Clerk authentication
  return <BaseClerkProvider>{children}</BaseClerkProvider>;
}
