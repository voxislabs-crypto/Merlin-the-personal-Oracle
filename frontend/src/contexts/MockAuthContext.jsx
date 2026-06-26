import { createContext, useContext } from "react";

const MockAuthContext = createContext({
  isSignedIn: true,
  isLoaded: true,
  userId: "dev-user-1",
  sessionId: "dev-session-1",
  getToken: () => Promise.resolve("dev-token"),
  signOut: () => Promise.resolve(),
});

export function MockAuthProvider({ children }) {
  return (
    <MockAuthContext.Provider value={{
      isSignedIn: true,
      isLoaded: true,
      userId: "dev-user-1",
      sessionId: "dev-session-1",
      getToken: () => Promise.resolve("dev-token"),
      signOut: () => Promise.resolve(),
    }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  return useContext(MockAuthContext);
}
