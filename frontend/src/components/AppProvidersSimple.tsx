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

// =============================================================================
// QUERY CLIENT (Code Reviewer: Simple, focused configuration)
// =============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Debug Expert: Reasonable defaults for debugging
      staleTime: 8000, // 8 seconds
      gcTime: 40000, // 40 seconds
      retry: 2,
      retryDelay: 2000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// =============================================================================
// WEB3MODAL CONFIGURATION (Web3 Expert: Mobile-optimized)
// =============================================================================

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Web3 Expert: Mobile-friendly wallet configuration
const FEATURED_WALLET_IDS = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
];

// Debug Expert: Initialize Web3Modal with proper error handling
let web3ModalInitialized = false;

function initializeWeb3Modal() {
  if (web3ModalInitialized) return;

  try {
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
        url: process.env.REACT_APP_APP_URL || window.location.origin,
        icons: [`${process.env.REACT_APP_APP_URL || window.location.origin}/favicon.ico`],
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

    web3ModalInitialized = true;
    
    // Debug Expert: Success logging
    if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
      console.log('✅ Web3Modal initialized successfully');
    }
  } catch (error) {
    // Debug Expert: Non-blocking error handling
    console.warn('⚠️ Web3Modal initialization warning (non-critical):', error);
    web3ModalInitialized = true; // Prevent infinite retries
  }
}

// =============================================================================
// APP PROVIDERS COMPONENT (Code Reviewer: Clean, simple structure)
// =============================================================================

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    // Debug Expert: Initialize Web3Modal when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeWeb3Modal);
    } else {
      // DOM already loaded
      setTimeout(initializeWeb3Modal, 0);
    }

    // Debug Expert: Basic mobile detection for logging
    if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log(`📱 Device type: ${isMobile ? 'mobile' : 'desktop'}`);
      console.log('🚀 Simplified providers initialized');
    }

    // Cleanup
    return () => {
      document.removeEventListener('DOMContentLoaded', initializeWeb3Modal);
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};