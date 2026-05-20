'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

/**
 * Clerk Provider Wrapper
 * Configured for secondary application with custom domain.
 * Domain and satellite config is handled via env vars:
 *   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_CLERK_CUSTOM_DOMAIN
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <BaseClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#f59e0b', // Amber-500
          colorBackground: '#1f2937', // Gray-800  
          colorText: '#f3f4f6', // Gray-100
        },
        elements: {
          formButtonPrimary: 'bg-amber-600 hover:bg-amber-700 text-white',
          card: 'bg-gray-900 border border-amber-800',
          headerTitle: 'text-amber-400',
          headerSubtitle: 'text-gray-300',
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
