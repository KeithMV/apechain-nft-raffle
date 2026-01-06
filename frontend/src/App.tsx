import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { config } from './config/wagmi';
import { RAFFLE_FACTORY_ADDRESS } from './config/contracts';
import { Toaster } from 'react-hot-toast';
import { WalletConnection } from './components/WalletConnection';
import MobileBanner from './components/MobileBanner';
import { suppressWalletConnectErrors } from './utils/walletCleanup';
import { suppressWeb3ModalWarnings } from './utils/suppressWarnings';
import { ErrorBoundary, Web3ErrorBoundary } from './components/ErrorBoundary';
import './utils/consoleSecure'; // Auto-enables production console security

import './index.css';

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
  const location = useLocation();
  const currentPage = location.pathname.slice(1) || 'browse';
  
  return (
    <header className="relative bg-slate-900/95 backdrop-blur-xl border-b border-emerald-400/30 shadow-2xl overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center py-4 sm:py-6 space-y-4 md:space-y-0 gap-4">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-3 lg:space-x-6 flex-shrink min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-sans tracking-tight">ApeChain Raffles</h1>
              </div>
            </div>
            {isConnected && (
              <nav className="flex space-x-1 sm:space-x-2">
                <Link
                  to="/create"
                  className={`relative px-3 py-2 sm:px-4 md:px-3 lg:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden group ${
                    currentPage === 'create' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-lg shadow-emerald-500/25' 
                      : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-400/30'
                  }`}
                >
                  <span className="relative">CREATE</span>
                </Link>
                <Link
                  to="/dashboard"
                  className={`relative px-3 py-2 sm:px-4 md:px-3 lg:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden group ${
                    currentPage === 'dashboard' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-lg shadow-emerald-500/25' 
                      : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-400/30'
                  }`}
                >
                  <span className="relative">DASHBOARD</span>
                </Link>
                <Link
                  to="/browse"
                  className={`relative px-3 py-2 sm:px-4 md:px-3 lg:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden group ${
                    currentPage === 'browse' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-lg shadow-emerald-500/25' 
                      : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-400/30'
                  }`}
                >
                  <span className="relative">BROWSE</span>
                </Link>
              </nav>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
            {isConnected && (
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <LazyWrapper>
                  <WalletInfo />
                </LazyWrapper>
              </div>
            )}
            <div className="flex-shrink-0">
              <WalletConnection />
            </div>
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
          ApeChain NFT Raffles
        </h2>
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
          Make NFT raffles. Buy tickets for raffles, completely fair.
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
  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <Routes>
          <Route path="/" element={<Navigate to="/browse" replace />} />
          <Route path="/browse" element={
            <ErrorBoundary>
              <LazyWrapper>
                <BrowseRaffles />
              </LazyWrapper>
            </ErrorBoundary>
          } />
          <Route path="/create" element={
            <Web3ErrorBoundary>
              <LazyWrapper>
                <CreateRafflePage />
              </LazyWrapper>
            </Web3ErrorBoundary>
          } />
          <Route path="/dashboard" element={
            <ErrorBoundary>
              <LazyWrapper>
                <RaffleDashboard />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <RaffleApp />
            <Toaster position="top-right" />
          </BrowserRouter>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}

export default App;