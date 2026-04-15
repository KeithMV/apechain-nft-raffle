import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { AppProviders } from './components/AppProviders';
import { AppLayout } from './components/AppLayout';
import { ConnectWalletPage } from './components/ConnectWalletPage';
import EmergencyReset from './components/EmergencyReset';

import './index.css';

const RaffleApp = React.memo(function RaffleApp() {
  const { isConnected } = useAccount();
  
  // MOBILE SAFARI DEBUG: Check if RaffleApp renders
  console.log('🎯 [RAFFLE-APP] RaffleApp component rendering, isConnected:', isConnected);
  
  if (!isConnected) {
    return <ConnectWalletPage />;
  }

  return <AppLayout />;
});

function App() {
  // CRITICAL: Mobile Safari React mounting test
  console.log('🚀 [APP] React App component rendering - MOBILE SAFARI TEST!');
  console.log('🚀 [APP] User Agent:', navigator.userAgent);
  console.log('🚀 [APP] SES Mobile Debug:', (window as any).__SES_MOBILE_DEBUG__);
  console.log('🚀 [APP] Window location:', window.location.href);
  console.log('🚀 [APP] Document ready state:', document.readyState);
  
  // Test if this component is actually rendering
  React.useEffect(() => {
    console.log('🚀 [APP] React useEffect fired - component mounted successfully!');
    
    // Add visible indicator for mobile testing
    const indicator = document.createElement('div');
    indicator.id = 'react-mount-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: lime;
      color: black;
      padding: 5px;
      font-size: 12px;
      z-index: 9999;
      border-radius: 3px;
    `;
    indicator.textContent = 'React Mounted ✅';
    document.body.appendChild(indicator);
    
    // Remove after 5 seconds
    setTimeout(() => {
      indicator.remove();
    }, 5000);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative z-0">
      <AppProviders>
        <BrowserRouter>
          <RaffleApp />
          <Toaster position="top-right" />
          <EmergencyReset />
        </BrowserRouter>
      </AppProviders>
    </div>
  );
}

export default App;