import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { AppProviders } from './components/AppProviders';
import { AppProviders as AppProvidersSimple } from './components/AppProvidersSimple';
import { AppLayout } from './components/AppLayout';
import { ConnectWalletPage } from './components/ConnectWalletPage';
import EmergencyReset from './components/EmergencyReset';
import { USE_SIMPLIFIED_CONFIG } from './config/featureFlags';

import './index.css';

const RaffleApp = React.memo(function RaffleApp() {
  const { isConnected } = useAccount();
  
  if (!isConnected) {
    return <ConnectWalletPage />;
  }

  return <AppLayout />;
});

function App() {
  // Feature flag: Switch between old and new configuration systems
  const ProvidersComponent = USE_SIMPLIFIED_CONFIG ? AppProvidersSimple : AppProviders;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative z-0">
      <ProvidersComponent>
        <BrowserRouter>
          <RaffleApp />
          <Toaster position="top-right" />
          <EmergencyReset />
        </BrowserRouter>
      </ProvidersComponent>
    </div>
  );
}

export default App;