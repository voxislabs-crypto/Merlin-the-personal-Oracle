'use client';

import type { ReactNode } from 'react';

interface StubUser {
  id: string;
  fullName: string;
  primaryEmailAddress?: {
    emailAddress: string;
  };
}

const OFFLINE_USER: StubUser = {
  id: 'offline-user',
  fullName: 'Offline User',
  primaryEmailAddress: {
    emailAddress: 'offline@merlin.local',
  },
};

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: OFFLINE_USER.id,
    sessionId: 'offline-session',
    orgId: null,
    getToken: async () => null,
    signOut: async () => undefined,
  };
}

export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: OFFLINE_USER,
  };
}

export function UserButton() {
  return null;
}

export function SignIn() {
  return null;
}

export function SignUp() {
  return null;
}
