/**
 * Main App Component
 * Clean, focused entry point with provider management and routing
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { AppProviders, Phase3RouterProvider } from './components/AppProviders';
import { AppLayout } from './components/AppLayout';
import { ConnectWalletPage } from './components/ConnectWalletPage';

import './index.css';

const RaffleApp = React.memo(function RaffleApp() {
  const { isConnected } = useAccount();
  
  if (!isConnected) {
    return <ConnectWalletPage />;
  }

  return <AppLayout />;
});

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative z-0">
      <AppProviders>
        <BrowserRouter>
          <Phase3RouterProvider>
            <RaffleApp />
            <Toaster position="top-right" />
          </Phase3RouterProvider>
        </BrowserRouter>
      </AppProviders>
    </div>
  );
}

export default App;