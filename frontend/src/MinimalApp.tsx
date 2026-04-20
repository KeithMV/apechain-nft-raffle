/**
 * Minimal Test App - Debug Blank Screen
 */

import React from 'react';

function MinimalApp() {
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🔍 Debug Mode - App is Loading</h1>
      <p>If you see this, React is working.</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#333' }}>
        <h3>Environment Check:</h3>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
        <p>REACT_APP_ENV: {process.env.REACT_APP_ENV}</p>
        <p>Window location: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
      </div>
    </div>
  );
}

export default MinimalApp;