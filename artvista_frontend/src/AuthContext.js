import React, { createContext, useContext } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

// PUBLIC_INTERFACE
/**
 * Authentication context for ArtVista.
 * Provides user object, loading state, and the raw auth instance.
 */
const AuthContext = createContext();

/**
 * AuthProvider wraps the app, exposing user and auth state.
 */
export function AuthProvider({ children }) {
  const [user, loading, error] = useAuthState(auth);

  return (
    <AuthContext.Provider value={{ user, loading, error, auth }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for consuming AuthContext.
 */
export function useAuth() {
  return useContext(AuthContext);
}
