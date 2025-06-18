import React from 'react';
import './App.css';
import ArtFeed from './ArtFeed';
import ArtOfTheDay from './ArtOfTheDay';

// PUBLIC_INTERFACE
/**
 * Main application container focusing on the art feed with "Art of the Day" featured banner above it.
 */
function App() {
  return (
    <div className="app" style={{ background: "none" }}>
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="logo" tabIndex={0} aria-label="ArtVista Home">
              <span className="logo-symbol" aria-label="star">*</span> ArtVista
            </div>
            {/* Sample Button, replace as needed */}
            <button className="btn" tabIndex={0}>Explore</button>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, marginTop: '86px', minHeight: '100vh', background: "none" }}>
        <div className="container">
          <ArtOfTheDay />
          <ArtFeed />
        </div>
      </main>
    </div>
  );
}

export default App;