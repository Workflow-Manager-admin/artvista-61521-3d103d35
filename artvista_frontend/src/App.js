import React, { useState } from 'react';
import './App.css';
import ArtFeed from './ArtFeed';
import ArtOfTheDay from './ArtOfTheDay';
import AuthUI from './AuthUI';
import { AuthProvider, useAuth } from './AuthContext';
import MyCollection from './MyCollection';

/**
 * Enforces authentication before allowing access to ArtVista main interface.
 */
function AuthGateApp() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState("explore"); // "explore" | "mycollection"

  // Always show loading spinner until auth is resolved.
  if (loading) {
    return (
      <div className="app" style={{ background: "none", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#6A0DAD", fontWeight: 700, fontSize: "1.4em" }}>Loading...</span>
      </div>
    );
  }

  // Gate: show only AuthUI (centered) if not logged in
  if (!user) {
    return (
      <div className="app" style={{ background: "none", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginBottom: 40 }}>
          <div className="logo" style={{ fontSize: "2.15rem", textAlign: "center", marginBottom: 10 }}>
            <span className="logo-symbol" aria-label="star">*</span> ArtVista
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "1.16rem", maxWidth: 340, margin: "0 auto 25px", textAlign: "center" }}>
            Welcome to ArtVista! Please enter a username to continue.
          </div>
        </div>
        <div style={{ minWidth: 320, maxWidth: 450, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <AuthUI />
        </div>
      </div>
    );
  }

  // MAIN APP content (user is authenticated)
  return (
    <div className="app" style={{ background: "none" }}>
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div
              className="logo"
              tabIndex={0}
              aria-label="ArtVista Home"
              role="button"
              style={{ cursor: "pointer" }}
              onClick={() => setActivePage("explore")}
            >
              <span className="logo-symbol" aria-label="star">*</span> ArtVista
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <button
                className="btn"
                tabIndex={0}
                aria-label="Go to Art Feed"
                style={{ fontWeight: activePage === "explore" ? 700 : 500 }}
                onClick={() => setActivePage("explore")}
              >
                Explore
              </button>
              {/* Main app content is only visible to authed user,
                  so safe to render My Collection tab directly */}
              <button
                className="btn"
                style={{
                  fontWeight: activePage === "mycollection" ? 700 : 500,
                  background: "#d4bee8",
                  color: "#6A0DAD",
                }}
                aria-label="View My Collection"
                onClick={() => setActivePage("mycollection")}
              >
                My Collection
              </button>
              <span style={{ marginLeft: 8 }} />
              <AuthUI />
            </div>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, marginTop: '86px', minHeight: '100vh', background: "none" }}>
        <div className="container">
          {activePage === "explore" && (
            <>
              <ArtOfTheDay />
              <ArtFeed />
            </>
          )}
          {activePage === "mycollection" && <MyCollection />}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGateApp />
    </AuthProvider>
  );
}

export default App;