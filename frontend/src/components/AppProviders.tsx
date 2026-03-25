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
import { suppressWalletConnectErrors } from '../utils/walletCleanup';
import { suppressWeb3ModalWarnings } from '../utils/suppressWarnings';
import { enableMobileErrorSuppression } from '../utils/mobileErrorSuppression';
import '../utils/consoleSecure'; // Auto-enables production console security

// Initialize Web3Modal at module level (before any components render)
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';
const walletConfig = getWalletConfig();
const isMobile = getDeviceType() === 'mobile';

console.log(`🔧 [UNIFIED] Initializing Web3Modal at module level for ${isMobile ? 'mobile' : 'desktop'} device`);

try {
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
  console.log('✅ [UNIFIED] Web3Modal initialized successfully at module level');
} catch (error) {
  console.warn('🔧 [UNIFIED] Web3Modal initialization had non-critical errors, continuing...', error);
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
        <NetworkProvider>
          {children}
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};