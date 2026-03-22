/**
 * App Providers Component
 * Unified Web3 configuration for all devices
 */

import React, { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config, apeChain, polygonChain, isMobile, getWalletConfig } from '../config/wagmiUnified';
import { transactionQueryClient } from '../utils/transactionQueryClient';
import { NetworkProvider } from '../contexts/NetworkContext';
import { suppressWalletConnectErrors } from '../utils/walletCleanup';
import { suppressWeb3ModalWarnings } from '../utils/suppressWarnings';
import { enableMobileErrorSuppression } from '../utils/mobileErrorSuppression';
import '../utils/consoleSecure'; // Auto-enables production console security

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  // Create Web3Modal with unified configuration
  useEffect(() => {
    const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';
    const walletConfig = getWalletConfig();
    
    console.log(`🔧 [UNIFIED] Initializing Web3Modal for ${isMobile ? 'mobile' : 'desktop'} device`);
    
    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      enableAnalytics: false,
      enableOnramp: false,
      enableSwaps: false,
      themeMode: 'dark',
      
      // Device-adaptive wallet configuration
      featuredWalletIds: walletConfig.featuredWalletIds,
      includeWalletIds: walletConfig.includeWalletIds,
      excludeWalletIds: walletConfig.excludeWalletIds,
      
      allWallets: 'HIDE',
      defaultChain: apeChain,
      
      chainImages: {
        [apeChain.id]: 'https://apechain.calderaexplorer.xyz/favicon.ico',
        [polygonChain.id]: 'https://polygon.technology/favicon.ico'
      }
    });
  }, []); // Remove dependencies to prevent re-initialization
  
  useEffect(() => {
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
        <NetworkProvider>
          {children}
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};