import React from 'react';
import './App.css';
import Sidebar from './Sidebar';
import ArtFeed from './ArtFeed';

function App() {
  // PUBLIC_INTERFACE
  /**
   * Main application container with art feed and news sidebar.
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

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        minHeight: '100vh',
        marginTop: '64px'
      }}>
        <main style={{ flex: 1 }}>
          <div className="container">
            <ArtFeed />
          </div>
        </main>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;