'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://merlin.voxislabs.com';
const appUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

const resolveAbsoluteUrl = (value: string | undefined, fallbackPath: string) => {
  if (!value) {
    return `${appUrl}${fallbackPath}`;
  }

  return value.startsWith('http') ? value : `${appUrl}${value.startsWith('/') ? value : `/${value}`}`;
};

/**
 * Clerk Provider Wrapper.
 * Secondary apps need the domain/satellite settings and absolute sign-in URLs.
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
  const signInUrl = resolveAbsoluteUrl(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL, '/sign-in');
  const signUpUrl = resolveAbsoluteUrl(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL, '/sign-up');
  const signInFallbackRedirectUrl = resolveAbsoluteUrl(
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
    '/dashboard',
  );
  const signUpFallbackRedirectUrl = resolveAbsoluteUrl(
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
    '/dashboard',
  );

  return (
    <BaseClerkProvider
      frontendApi="merlin.voxislabs.com"
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      signInFallbackRedirectUrl={signInFallbackRedirectUrl}
      signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
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
