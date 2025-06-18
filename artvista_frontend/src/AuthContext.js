import React, { createContext, useContext, useEffect, useState } from "react";

// PUBLIC_INTERFACE
/**
 * Authentication context for ArtVista — Username-only.
 * Provides user object (string username), loading state, and handy setters.
 * Stores username in localStorage.
 */
const AuthContext = createContext();

/**
 * AuthProvider wraps the app, exposing username (if any), and loading state.
 */
export function AuthProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("av_username");
    setUsername(saved || null);
    setLoading(false);
  }, []);

  // Login/set-username action
  const login = (username) => {
    if (username && typeof username === "string" && username.length) {
      setUsername(username);
      localStorage.setItem("av_username", username);
    }
  };

  // Logout/clear action
  const logout = () => {
    setUsername(null);
    localStorage.removeItem("av_username");
  };

  return (
    <AuthContext.Provider value={{ user: username, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for consuming AuthContext — gets { user, loading, login, logout }
 */
// PUBLIC_INTERFACE
export function useAuth() {
  return useContext(AuthContext);
}
