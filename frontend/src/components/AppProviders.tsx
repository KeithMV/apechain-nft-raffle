/**
 * SIMPLIFIED APP PROVIDERS
 * Clean, direct Web3 setup without complex abstractions
 * 
 * Expert Collaboration:
 * - Code Reviewer: Single responsibility, clean structure
 * - Debug Expert: Clear initialization and error handling
 * - Web3 Expert: Mobile-optimized Web3Modal setup
 */

import React, { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config, apeChain, polygon } from '../config/wagmi';
import { NetworkProvider } from '../contexts/NetworkContext'; // CRITICAL: Missing provider
import { transactionQueryClient } from '../utils/transactionQueryClient'; // Use existing query client

// =============================================================================
// QUERY CLIENT (Code Reviewer: Simple, focused configuration)
// =============================================================================

// Use existing transaction query client instead of creating new one
// const queryClient = new QueryClient({...}); // REMOVED

// =============================================================================
// WEB3MODAL INITIALIZATION (CRITICAL: Must happen before component render)
// =============================================================================

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Web3 Expert: Mobile-friendly wallet configuration
const FEATURED_WALLET_IDS = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
];

// CRITICAL FIX: Initialize Web3Modal at module level (guaranteed synchronous)
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  
  // Web3 Expert: Essential settings for mobile compatibility
  enableAnalytics: false,
  enableOnramp: false,
  enableSwaps: false,
  themeMode: 'dark',
  
  // Debug Expert: Environment-aware metadata for CORS
  metadata: {
    name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
    description: 'Decentralized NFT raffle platform on ApeChain and Polygon',
    url: process.env.REACT_APP_APP_URL || 'https://web3raffles.io',
    icons: ['https://web3raffles.io/favicon.ico'],
  },
  
  // Web3 Expert: Mobile-optimized wallet selection
  featuredWalletIds: FEATURED_WALLET_IDS,
  defaultChain: apeChain,
  
  // Chain-specific branding
  chainImages: {
    [apeChain.id]: 'https://apechain.calderaexplorer.xyz/favicon.ico',
    [polygon.id]: 'https://polygon.technology/favicon.ico',
  },
});

// =============================================================================
// APP PROVIDERS COMPONENT (Code Reviewer: Clean, simple structure)
// =============================================================================

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    // CRITICAL: Clear old WalletConnect sessions that conflict with new config
    if (typeof window !== 'undefined') {
      // Clear WalletConnect storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('wc@2') || key.startsWith('@walletconnect') || key.includes('walletconnect')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear session storage too
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('wc@2') || key.startsWith('@walletconnect') || key.includes('walletconnect')) {
          sessionStorage.removeItem(key);
        }
      });
      
      if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
        console.log('🧹 Cleared old WalletConnect sessions for simplified config');
      }
    }

    // Debug Expert: Basic mobile detection for logging
    if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log(`📱 Device type: ${isMobile ? 'mobile' : 'desktop'}`);
      console.log('🚀 Simplified providers initialized');
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={transactionQueryClient}>
        <NetworkProvider>
          {children}
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};