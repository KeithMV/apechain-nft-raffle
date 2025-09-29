import React, { useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { wagmiConfig } from './config/wagmi';
import { raffleService } from './services/raffleService';
import { RAFFLE_FACTORY_ADDRESS } from './config/contracts';
import { NETWORK_CONFIG } from './config/addresses';
import { Toaster } from 'react-hot-toast';
import CreateRafflePage from './components/CreateRafflePage';
import RaffleDashboard from './components/RaffleDashboard';
import BrowseRaffles from './components/BrowseRaffles';

import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Header({ currentPage, setCurrentPage }: { 
  currentPage: string, 
  setCurrentPage: (page: 'create' | 'dashboard' | 'browse') => void 
}) {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 backdrop-blur-md border-b border-blue-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm sm:text-lg">🎫</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">NFT Raffle Pro</h1>
                <span className="text-xs text-purple-300 font-medium hidden sm:inline">ApeCoin Edition</span>
              </div>
              <span className="px-2 py-1 sm:px-3 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-xs sm:text-sm font-medium">ApeChain</span>
            </div>
            <nav className="flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentPage('create')}
                className={`px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  currentPage === 'create' 
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-lg shadow-purple-500/25' 
                    : 'text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-400/30'
                }`}
              >
                Create Raffle
              </button>
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  currentPage === 'dashboard' 
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-lg shadow-purple-500/25' 
                    : 'text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-400/30'
                }`}
              >
                My Raffles
              </button>
              <button
                onClick={() => setCurrentPage('browse')}
                className={`px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  currentPage === 'browse' 
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-lg shadow-purple-500/25' 
                    : 'text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-400/30'
                }`}
              >
                Browse Raffles
              </button>
            </nav>
          </div>
          <div className="scale-90 sm:scale-100">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white py-12 sm:py-16 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] sm:bg-[size:50px_50px]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center px-3 py-2 sm:px-4 bg-purple-500/10 border border-purple-400/30 rounded-full mb-6 sm:mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          <span className="text-purple-300 text-xs sm:text-sm font-medium">Live on ApeChain • Fair & Secure</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight">
          NFT Raffle Platform
        </h2>
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
          Make expensive NFTs accessible to everyone. Create raffles for your valuable NFTs or buy affordable tickets to win amazing prizes.
        </p>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0 sm:inline-block shadow-2xl max-w-full">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
            <p className="text-xs sm:text-sm text-purple-400 font-semibold">ApeCoin NFT Raffle System</p>
          </div>
          <p className="font-mono text-slate-300 text-xs sm:text-sm mb-3 sm:mb-4 bg-slate-900/50 px-2 sm:px-4 py-2 rounded-lg break-all">
            {RAFFLE_FACTORY_ADDRESS || 'Deploying...'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-green-400 font-medium">Provably Fair</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
              <span className="text-purple-400 font-medium">10% Platform Fee</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
              <span className="text-pink-400 font-medium">Instant Payouts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RaffleApp() {
  const { isConnected, address } = useAccount();
  const [currentPage, setCurrentPage] = useState<'create' | 'dashboard' | 'browse'>('browse');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <Hero />
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <span className="text-white text-xl sm:text-2xl">🎫</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Connect Your Wallet</h3>
            <p className="text-slate-300 mb-6 sm:mb-8 text-base sm:text-lg px-2">Connect your wallet to create raffles or buy tickets</p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {currentPage === 'create' && <CreateRafflePage />}
        {currentPage === 'dashboard' && <RaffleDashboard />}
        {currentPage === 'browse' && <BrowseRaffles />}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#a855f7',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
          })}
        >
          <RaffleApp />
          <Toaster position="top-right" />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;