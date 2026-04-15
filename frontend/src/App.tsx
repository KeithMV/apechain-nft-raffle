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
  // MOBILE SAFARI DEBUG: Check if React is rendering
  console.log('🚀 [APP] React App component rendering - this should appear on mobile!');
  console.log('🚀 [APP] User Agent:', navigator.userAgent);
  
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