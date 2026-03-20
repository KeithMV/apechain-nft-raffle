/**
 * Main App Component
 * Clean, focused entry point with provider management and routing
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { AppProviders } from './components/AppProviders';
import { AppLayout } from './components/AppLayout';
import { ConnectWalletPage } from './components/ConnectWalletPage';
// Phase 10: Performance monitoring integration
import PerformanceMonitor from './components/PerformanceMonitor';

import './index.css';

const RaffleApp = React.memo(function RaffleApp() {
  const { isConnected } = useAccount();
  
  if (!isConnected) {
    return <ConnectWalletPage />;
  }

  return <AppLayout />;
});

function App() {
  // Phase 10: Enable performance monitoring in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative z-0">
      <AppProviders>
        <BrowserRouter>
          <RaffleApp />
          <Toaster position="top-right" />
          {/* Phase 10: Performance monitoring overlay */}
          <PerformanceMonitor 
            isVisible={isDevelopment} 
            position="bottom-right" 
          />
        </BrowserRouter>
      </AppProviders>
    </div>
  );
}

export default App;