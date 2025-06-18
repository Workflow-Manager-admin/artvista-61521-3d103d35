import React from 'react';
import './App.css';
import ArtFeed from './ArtFeed';

function App() {
  // PUBLIC_INTERFACE
  /**
   * Main application container focusing on the art feed (no news sidebar).
   */
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol" aria-label="star" style={{color: 'var(--primary-color, #6A0DAD)'}}>*</span> ArtVista
            </div>
            {/* Sample Button, replace if needed */}
            <button className="btn" style={{background: 'var(--accent-color, #FF69B4)'}}>Explore</button>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, marginTop: '64px', minHeight: '100vh' }}>
        <div className="container">
          <ArtFeed />
        </div>
      </main>
    </div>
  );
}

export default App;