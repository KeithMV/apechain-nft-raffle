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
import MobileBanner from './components/MobileBanner';
import { suppressWalletConnectErrors } from './utils/walletCleanup';
import { suppressWeb3ModalWarnings } from './utils/suppressWarnings';
import { ErrorBoundary, Web3ErrorBoundary } from './components/ErrorBoundary';
import { NetworkProvider, useNetwork } from './contexts/NetworkContext';
import './utils/consoleSecure'; // Auto-enables production console security

import './index.css';

// Web3 title component with animated gradient
const Web3Title = () => {
  return (
    <div className="flex items-center gap-2">
      <h1 
        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-center leading-tight font-sans tracking-tight bg-clip-text text-transparent"
        style={{
          backgroundImage: 'linear-gradient(45deg, #10b981, #8b5cf6, #06b6d4, #10b981)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 6s ease-in-out infinite'
        }}
      >
        Web3 Raffles
      </h1>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `
      }} />
    </div>
  );
};

// Lazy load all heavy components for optimal performance
const CreateRafflePage = lazy(() => import('./components/CreateRafflePage'));
const RaffleDashboard = lazy(() => import('./components/RaffleDashboard'));
const BrowseRaffles = lazy(() => import('./components/BrowseRaffles'));
const WalletInfo = lazy(() => import('./components/WalletInfo'));

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
              <Web3Title />
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
  const handleContractClick = (address: string, explorerUrl: string) => {
    window.open(`${explorerUrl}/address/${address}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative text-white py-16 sm:py-24 lg:py-32 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Platform Description */}
        <p className="text-2xl sm:text-3xl lg:text-4xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          A NFT raffle platform. Connect wallet and have fun.
        </p>
        
        {/* Contract Description */}
        <div className="mb-6 sm:mb-8">
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            These are the smart contracts that power our platform.
          </p>
        </div>
        
        {/* Contract Address Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-12">
          <button
            onClick={() => handleContractClick('0x1627E7e63b63878E61f91D336385a59B1747934a', 'https://apescan.io')}
            className="group relative px-6 py-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 hover:border-emerald-400/50 transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-105 active:scale-95 backdrop-blur-sm w-full max-w-sm"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"></div>
                <span className="font-semibold text-base sm:text-lg">ApeChain Contract</span>
              </div>
              <code className="text-sm sm:text-base font-mono text-emerald-200 group-hover:text-emerald-100 transition-colors break-all text-center px-2">
                0x1627E7e63b63878E61f91D336385a59B1747934a
              </code>
            </div>
          </button>
          
          <button
            onClick={() => handleContractClick('0x5854AF7c836275c55469350a114F62a1609c4A42', 'https://polygonscan.com')}
            className="group relative px-6 py-4 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 text-purple-300 rounded-xl hover:from-purple-500/30 hover:to-violet-500/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 hover:scale-105 active:scale-95 backdrop-blur-sm w-full max-w-sm"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"></div>
                <span className="font-semibold text-base sm:text-lg">Polygon Contract</span>
              </div>
              <code className="text-sm sm:text-base font-mono text-purple-200 group-hover:text-purple-100 transition-colors break-all text-center px-2">
                0x5854AF7c836275c55469350a114F62a1609c4A42
              </code>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
});

const ConnectWalletPage = React.memo(function ConnectWalletPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Hero />
        </div>
      </div>
    </div>
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
              <Toaster position="top-right" />
            </BrowserRouter>
          </NetworkProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}

export default App;