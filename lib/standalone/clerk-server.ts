type StubAuth = {
  userId: string;
  sessionId: string;
  orgId: null;
};

export function createRouteMatcher() {
  return () => false;
}

export function clerkMiddleware(
  handler?: (auth: { protect: () => Promise<void> }, req: Request) => Promise<Response | void> | Response | void
) {
  return async (req: Request) => {
    if (!handler) {
      return;
    }

    return handler(
      {
        protect: async () => undefined,
      },
      req
    );
  };
}

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
      updateUser: async () => ({}),
    },
  };
}
