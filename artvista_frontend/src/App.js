import React from 'react';
import './App.css';
import Sidebar from './Sidebar';

function App() {
  // PUBLIC_INTERFACE
  /**
   * Main application container, now with news sidebar.
   */
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA AI
            </div>
            <button className="btn">Template Button</button>
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
            <div className="hero">
              <div className="subtitle">AI Workflow Manager Template</div>
              
              <h1 className="title">artvista_frontend</h1>
              
              <div className="description">
                Start building your application.
              </div>
              
              <button className="btn btn-large">Button</button>
            </div>
          </div>
        </main>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;