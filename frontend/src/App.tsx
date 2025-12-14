import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { config } from './config/wagmi';
import { RAFFLE_FACTORY_ADDRESS } from './config/contracts';
import { Toaster } from 'react-hot-toast';
import ProfessionalWalletConnection from './components/ProfessionalWalletConnection';
import { suppressWalletConnectErrors, cleanWalletConnectStorage } from './utils/walletCleanup';
import { ErrorBoundary, Web3ErrorBoundary } from './components/ErrorBoundary';

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
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(-45deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center py-4 sm:py-6 space-y-4 md:space-y-0 gap-4">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-3 lg:space-x-6 flex-shrink min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-xl blur-sm animate-pulse"></div>
                <span className="relative text-slate-900 font-bold text-lg sm:text-xl">🎯</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-sans tracking-tight">ApeChain Raffles</h1>
                <span className="text-xs text-emerald-300 font-medium hidden sm:inline">Powered by ApeChain</span>
              </div>
              <div className="relative px-2 py-1 sm:px-3 bg-emerald-500/10 border border-emerald-400/50 rounded-xl text-emerald-300 text-xs sm:text-sm font-semibold">
                <div className="absolute inset-0 bg-emerald-400/5 rounded-xl animate-pulse"></div>
                <span className="relative">LIVE</span>
              </div>
            </div>
            <nav className="flex space-x-1 sm:space-x-2">
              <Link
                to="/create"
                className={`relative px-3 py-2 sm:px-4 md:px-3 lg:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden group ${
                  currentPage === 'create' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-lg shadow-emerald-500/25' 
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-400/30'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
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
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
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
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative">BROWSE</span>
              </Link>
            </nav>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
            {isConnected && (
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <NetworkStatus />
                <LazyWrapper>
                  <WalletInfo />
                </LazyWrapper>
              </div>
            )}
            <div className="flex-shrink-0">
              <ProfessionalWalletConnection />
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
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(-45deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-teal-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center px-3 py-2 sm:px-4 bg-emerald-500/10 border border-emerald-400/30 rounded-full mb-6 sm:mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse shadow-lg shadow-emerald-400/50"></span>
          <span className="text-emerald-300 text-xs sm:text-sm font-medium tracking-wider">ApeChain Protocol • Secure & Fair</span>
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent leading-tight font-sans tracking-tight">
          ApeChain Raffles
        </h2>
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
          The premier NFT raffle platform on ApeChain. Create, participate, and win amazing digital collectibles with complete transparency and fairness.
        </p>
        <div className="relative bg-slate-800/80 backdrop-blur-xl border border-emerald-400/30 rounded-3xl p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0 sm:inline-block shadow-2xl shadow-emerald-500/20 max-w-full">
          {/* Glowing border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-sm animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-3 h-3 bg-emerald-400 rounded-full mr-3 animate-pulse shadow-lg shadow-emerald-400/50"></div>
              <p className="text-xs sm:text-sm text-emerald-400 font-semibold tracking-wider">ApeChain Protocol Active</p>
            </div>
            <p className="text-emerald-300 text-xs sm:text-sm mb-3 sm:mb-4 bg-slate-900/50 px-2 sm:px-4 py-2 rounded-xl break-all border border-emerald-500/20 font-mono">
              {RAFFLE_FACTORY_ADDRESS || 'Initializing...'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse shadow-sm shadow-emerald-400/50"></div>
                <span className="text-emerald-400 font-medium tracking-wider">Provably Fair</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-teal-400 rounded-full mr-2 animate-pulse shadow-sm shadow-teal-400/50"></div>
                <span className="text-teal-400 font-medium tracking-wider">10% Platform Fee</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse shadow-sm shadow-cyan-400/50"></div>
                <span className="text-cyan-400 font-medium tracking-wider">Instant Execution</span>
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
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center">
        <div className="relative bg-slate-800/80 backdrop-blur-xl border border-emerald-400/30 rounded-3xl shadow-2xl shadow-emerald-500/20 p-6 sm:p-10">
          {/* Glowing border */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl blur-sm animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg shadow-emerald-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur-sm animate-pulse"></div>
              <span className="relative text-slate-900 text-xl sm:text-2xl font-bold">🔗</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 font-sans tracking-tight">Connect Your Wallet</h3>
            <p className="text-slate-300 mb-6 sm:mb-8 text-base sm:text-lg px-2">Connect your wallet to start creating and participating in NFT raffles</p>
            <p className="text-emerald-400 text-sm font-medium">Use the Connect Wallet button in the header above</p>
          </div>
        </div>
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
    
    // Clean stale WalletConnect storage on app load
    cleanWalletConnectStorage();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <BrowserRouter>
            <RaffleApp />
            <Toaster position="top-right" />
          </BrowserRouter>
        </WagmiProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;