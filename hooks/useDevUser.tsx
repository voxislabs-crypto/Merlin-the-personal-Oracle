'use client';

import { useUser as useClerkUser } from '@clerk/nextjs';
import { UserButton as ClerkUserButton } from '@clerk/nextjs';

/**
 * Direct export of Clerk's useUser (no dev bypasses)
 * @deprecated - Import directly from '@clerk/nextjs' instead
 */
export function useUser() {
  return useClerkUser();
}

/**
 * Direct export of Clerk's UserButton (no dev bypasses)
 * @deprecated - Import directly from '@clerk/nextjs' instead
 */
export function UserButton(props: any) {
  return <ClerkUserButton {...props} />;
}
