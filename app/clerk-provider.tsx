'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

/**
 * Clerk Provider Wrapper
 * Configured for secondary application with custom domain
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  const customDomain = process.env.NEXT_PUBLIC_CLERK_CUSTOM_DOMAIN;
  
  return (
    <BaseClerkProvider
      domain={customDomain}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
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
