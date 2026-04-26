// Mock Clerk hooks for development
export const useAuth = () => ({
  isSignedIn: true,
  isLoaded: true,
  userId: "1", // Use numeric ID for backend compatibility
  sessionId: "dev-session-1",
  getToken: () => Promise.resolve("dev-token-mock-auth"),
  signOut: () => Promise.resolve(),
});

export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: "1",
    firstName: "Dev",
    lastName: "User",
    fullName: "Dev User",
    emailAddresses: [{ emailAddress: "dev@example.com" }],
  },
});

export const ClerkProvider = ({ children }) => <>{children}</>;
export const SignIn = () => <div>Sign In (Mock)</div>;
export const SignUp = () => <div>Sign Up (Mock)</div>;
export const UserButton = () => <div>User Button (Mock)</div>;
