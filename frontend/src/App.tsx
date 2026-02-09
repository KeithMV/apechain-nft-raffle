import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { config } from './config/wagmi';
import { RAFFLE_FACTORY_ADDRESS } from './config/contracts';
import { Toaster } from 'react-hot-toast';
import { WalletConnection } from './components/WalletConnection';
import { NetworkSwitcher } from './components/NetworkSwitcher';
import { NetworkAwareHeader } from './components/NetworkAwareHeader';
import { MobileDebug } from './components/MobileDebug';
import MobileBanner from './components/MobileBanner';
import { suppressWalletConnectErrors } from './utils/walletCleanup';
import { suppressWeb3ModalWarnings } from './utils/suppressWarnings';
import { ErrorBoundary, Web3ErrorBoundary } from './components/ErrorBoundary';
import { NetworkProvider, useNetwork } from './contexts/NetworkContext';
import { EnvironmentDebugger } from './components/EnvironmentDebugger';
import { WagmiDebugger } from './components/WagmiDebugger';
import './utils/consoleSecure'; // Auto-enables production console security

import './index.css';

// Network-aware title component
const NetworkAwareTitle = () => {
  const { theme, networkName, nativeCurrency, isApeChain } = useNetwork();
  
  const titleStyle = isApeChain 
    ? 'text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-sans tracking-tight text-center'
    : 'text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent font-sans tracking-tight text-center';
    
  const badgeStyle = isApeChain
    ? 'px-2 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-medium'
    : 'px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-medium';
  
  return (
    <div className="flex items-center gap-2">
      <h1 className={titleStyle}>
        {networkName} Raffles
      </h1>
      <span className={badgeStyle}>
        {nativeCurrency}
      </span>
    </div>
  );
};

// Lazy load all heavy components for optimal performance
const CreateRafflePage = lazy(() => import('./components/CreateRafflePage'));
const RaffleDashboard = lazy(() => import('./components/RaffleDashboard'));
const BrowseRaffles = lazy(() => import('./components/BrowseRaffles'));
const WalletInfo = lazy(() => import('./components/WalletInfo'));
const NetworkStatus = lazy(() => import('./components/NetworkStatus'));

// Optimized loading fallback with memoization
const LoadingFallback = React.memo(() => (
  <div className="flex items-center justify-center py-8">
    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
));

// Lazy wrapper component
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const Header = React.memo(function Header() {
  const { isConnected } = useAccount();
  const { isApeChain } = useNetwork();
  const location = useLocation();
  const currentPage = location.pathname.slice(1) || 'browse';
  
  // Network-aware header styling
  const headerBorderColor = isApeChain ? 'border-emerald-400/30' : 'border-blue-400/30';
  const navActiveStyle = isApeChain 
    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
    : 'bg-blue-500/20 text-blue-300 border border-blue-400/50';
  const navHoverStyle = isApeChain
    ? 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-400/30'
    : 'text-slate-300 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent hover:border-blue-400/30';
  
  return (
    <header className={`relative bg-slate-900/95 backdrop-blur-xl border-b ${headerBorderColor} shadow-2xl z-10`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col justify-center items-center py-4 space-y-3">
          <div className="flex flex-col items-center space-y-2">
            <div>
              <NetworkAwareTitle />
            </div>
            {isConnected && (
              <nav className="flex space-x-2">
                <Link
                  to="/create"
                  className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    currentPage === 'create' 
                      ? navActiveStyle
                      : navHoverStyle
                  }`}
                >
                  CREATE
                </Link>
                <Link
                  to="/dashboard"
                  className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    currentPage === 'dashboard' 
                      ? navActiveStyle
                      : navHoverStyle
                  }`}
                >
                  DASHBOARD
                </Link>
                <Link
                  to="/browse"
                  className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    currentPage === 'browse' 
                      ? navActiveStyle
                      : navHoverStyle
                  }`}
                >
                  BROWSE
                </Link>
              </nav>
            )}
          </div>
          <div className="flex flex-col items-center space-y-2">
            {isConnected && (
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <NetworkSwitcher />
                <LazyWrapper>
                  <WalletInfo />
                </LazyWrapper>
              </div>
            )}
            <WalletConnection />
          </div>
        </div>
      </div>
    </header>
  );
});

const Hero = React.memo(function Hero() {
  return (
    <div className="relative text-white py-12 sm:py-16 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center px-3 py-2 sm:px-4 bg-emerald-500/10 border border-emerald-400/30 rounded-full mb-6 sm:mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 shadow-lg shadow-emerald-400/50"></span>
          <span className="text-emerald-300 text-xs sm:text-sm font-medium tracking-wider">Live on ApeChain</span>
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent leading-tight font-sans tracking-tight">
          NFT Raffles
        </h2>
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
          Create and participate in NFT raffles with transparent, provably fair results.
        </p>
        <div className="relative bg-slate-800/80 backdrop-blur-xl border border-emerald-400/30 rounded-3xl p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0 sm:inline-block shadow-2xl shadow-emerald-500/20 max-w-full">
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-3 h-3 bg-emerald-400 rounded-full mr-3 shadow-lg shadow-emerald-400/50"></div>
              <p className="text-xs sm:text-sm text-emerald-400 font-semibold tracking-wider">Contract Active</p>
            </div>
            <div className="text-xs text-slate-400 font-mono mb-3 break-all px-2">
              {RAFFLE_FACTORY_ADDRESS}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 shadow-sm shadow-emerald-400/50"></div>
                <span className="text-emerald-400 font-medium tracking-wider">Fair</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-teal-400 rounded-full mr-2 shadow-sm shadow-teal-400/50"></div>
                <span className="text-teal-400 font-medium tracking-wider">5% Fee</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 shadow-sm shadow-cyan-400/50"></div>
                <span className="text-cyan-400 font-medium tracking-wider">Fast</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ConnectWalletPage = React.memo(function ConnectWalletPage() {
  return (
    <>
      <Header />
      <Hero />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <MobileBanner />
      </div>
    </>
  );
});

const AppLayout = React.memo(function AppLayout() {
  const { chainId } = useNetwork();
  
  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <Routes>
          <Route path="/" element={<Navigate to="/browse" replace />} />
          <Route path="/browse" element={
            <ErrorBoundary>
              <LazyWrapper>
                <BrowseRaffles key={`browse-${chainId}`} />
              </LazyWrapper>
            </ErrorBoundary>
          } />
          <Route path="/create" element={
            <Web3ErrorBoundary>
              <LazyWrapper>
                <CreateRafflePage key={`create-${chainId}`} />
              </LazyWrapper>
            </Web3ErrorBoundary>
          } />
          <Route path="/dashboard" element={
            <ErrorBoundary>
              <LazyWrapper>
                <RaffleDashboard key={`dashboard-${chainId}`} />
              </LazyWrapper>
            </ErrorBoundary>
          } />
        </Routes>
      </div>
    </>
  );
});

const RaffleApp = React.memo(function RaffleApp() {
  const { isConnected } = useAccount();
  
  if (!isConnected) {
    return <ConnectWalletPage />;
  }

  return <AppLayout />;
});

function App() {
  useEffect(() => {
    // Suppress WalletConnect console errors
    suppressWalletConnectErrors();
    
    // Suppress Web3Modal font warnings
    suppressWeb3ModalWarnings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative z-0">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <NetworkProvider>
            <BrowserRouter>
              <RaffleApp />
              <EnvironmentDebugger />
              <WagmiDebugger />
              <Toaster position="top-right" />
            </BrowserRouter>
          </NetworkProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}

export default App;