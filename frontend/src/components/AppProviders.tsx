/**
 * App Providers Component
 * Unified Web3 configuration for all devices
 */

import React, { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config, apeChain, polygonChain, getDeviceType, getWalletConfig } from '../config/wagmiUnified';
import { transactionQueryClient } from '../utils/transactionQueryClient';
import { NetworkProvider } from '../contexts/NetworkContext';
import { ChainConfigProvider } from '../config/ChainConfigProvider';
import { suppressWalletConnectErrors } from '../utils/walletCleanup';
import { suppressWeb3ModalWarnings } from '../utils/suppressWarnings';
import { enableMobileErrorSuppression } from '../utils/mobileErrorSuppression';
import '../utils/consoleSecure'; // Auto-enables production console security


// Initialize Web3Modal with proper mobile detection and error handling
let web3ModalInitialized = false;

const initializeWeb3Modal = () => {
  if (web3ModalInitialized) return;
  
  // Get fresh device detection at initialization time
  const currentIsMobile = getDeviceType() === 'mobile';
  const currentWalletConfig = getWalletConfig();
  
  console.log(`🔧 [UNIFIED] Initializing Web3Modal for ${currentIsMobile ? 'mobile' : 'desktop'} device`);
  
  try {
    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      enableAnalytics: false,
      enableOnramp: false,
      enableSwaps: false,
      themeMode: 'dark',
      
      // CRITICAL: Add explicit metadata for CORS
      metadata: {
        name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
        description: 'Decentralized NFT raffle platform on ApeChain and Polygon',
        url: process.env.REACT_APP_APP_URL || window.location.origin,
        icons: [`${process.env.REACT_APP_APP_URL || window.location.origin}/favicon.ico`]
      },
      
      // FIXED: Use proper wallet configuration instead of hiding all
      featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
      ],
      
      // Use ApeChain as default
      defaultChain: apeChain,
      
      chainImages: {
        [apeChain.id]: 'https://apechain.calderaexplorer.xyz/favicon.ico',
        [polygonChain.id]: 'https://polygon.technology/favicon.ico'
      }
    });
    web3ModalInitialized = true;
    console.log('✅ [UNIFIED] Web3Modal initialized successfully');
  } catch (error) {
    console.warn('🔧 [UNIFIED] Web3Modal initialization had non-critical errors, continuing...', error);
    web3ModalInitialized = true; // Prevent infinite retries
  }
};

// Initialize Web3Modal with proper timing for all devices
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Initialize Web3Modal when DOM is ready (works for both mobile and desktop)
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWeb3Modal);
  } else {
    // DOM already loaded, initialize immediately
    setTimeout(initializeWeb3Modal, 0);
  }
}



interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    const isMobile = getDeviceType() === 'mobile';
    
    // Suppress WalletConnect console errors
    suppressWalletConnectErrors();
    
    // Suppress Web3Modal font warnings
    suppressWeb3ModalWarnings();
    
    // Mobile-specific error handling
    if (isMobile) {
      console.log('📱 [MOBILE] Mobile error suppression enabled');
      enableMobileErrorSuppression();
    }
    
    console.log('✅ [UNIFIED] App providers initialized successfully');
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={transactionQueryClient}>
        <ChainConfigProvider>
          <NetworkProvider>
            {children}
          </NetworkProvider>
        </ChainConfigProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};