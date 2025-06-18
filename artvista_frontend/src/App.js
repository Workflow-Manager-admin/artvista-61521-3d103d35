import React, { useState } from 'react';
import './App.css';
import ArtFeed from './ArtFeed';
import ArtOfTheDay from './ArtOfTheDay';
import AuthUI from './AuthUI';
import { AuthProvider, useAuth } from './AuthContext';
import MyCollection from './MyCollection';

// PUBLIC_INTERFACE
/**
 * Main application container focusing on the art feed, with authentication and per-user saved collection.
 */
function AppShell() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState("explore"); // "explore" | "mycollection"
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
              {user && (
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
              )}
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
      <AppShell />
    </AuthProvider>
  );
}

export default App;