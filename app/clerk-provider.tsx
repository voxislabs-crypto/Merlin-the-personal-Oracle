'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

/**
* Clerk Provider Wrapper
 * Configured for secondary application with custom domain.
 * Satellite apps require absolute URLs for signInUrl/signUpUrl.
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://merlin.voxislabs.com';
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

  return (
    <BaseClerkProvider
      signInUrl={`${url}/sign-in`}
      signUpUrl={`${url}/sign-up`}
      signInFallbackRedirectUrl={`${url}/dashboard`}
      signUpFallbackRedirectUrl={`${url}/dashboard`}
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
