type StubAuth = {
  userId: string;
  sessionId: string;
  orgId: null;
};

export async function auth(): Promise<StubAuth> {
  return {
    userId: 'offline-user',
    sessionId: 'offline-session',
    orgId: null,
  };
}

export async function currentUser() {
  return {
    id: 'offline-user',
    fullName: 'Offline User',
    primaryEmailAddress: {
      emailAddress: 'offline@merlin.local',
    },
  };
}

export function clerkClient() {
  return {
    users: {
      updateUserMetadata: async () => ({}),
    },
  };
}
