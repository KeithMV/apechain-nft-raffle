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
import { useIntelligentCache } from '../hooks/useIntelligentCache';
import { useAdvancedErrorRecovery } from '../hooks/useAdvancedErrorRecovery';
import { usePredictivePreloading } from '../hooks/usePredictivePreloading';
import { usePerformanceAnalytics } from '../hooks/usePerformanceAnalytics';

// Initialize Web3Modal with proper mobile timing
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';
const walletConfig = getWalletConfig();
const isMobile = getDeviceType() === 'mobile';

console.log(`🔧 [UNIFIED] Preparing Web3Modal for ${isMobile ? 'mobile' : 'desktop'} device`);

// Initialize Web3Modal with mobile-safe timing
let web3ModalInitialized = false;

const initializeWeb3Modal = () => {
  if (web3ModalInitialized) return;
  
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
    web3ModalInitialized = true;
    console.log('✅ [UNIFIED] Web3Modal initialized successfully');
  } catch (error) {
    console.warn('🔧 [UNIFIED] Web3Modal initialization had non-critical errors, continuing...', error);
  }
};

// Initialize immediately for desktop, or on DOM ready for mobile
if (!isMobile) {
  initializeWeb3Modal();
} else {
  // Mobile-safe initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWeb3Modal);
  } else {
    setTimeout(initializeWeb3Modal, 100); // Small delay for mobile
  }
}

// Phase 3 Optimization Provider (router-independent)
const Phase3OptimizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const intelligentCache = useIntelligentCache();
  const errorRecovery = useAdvancedErrorRecovery();
  const performanceAnalytics = usePerformanceAnalytics();

  // Initialize Phase 3 optimizations (without predictive preloading)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [PHASE3] Optimization features initialized');
    }
    
    // Track app initialization (silent)
    performanceAnalytics.trackUserAction('app_init');
    
    // Initialize error recovery patterns (silent)
    errorRecovery.preventiveActions();
  }, [performanceAnalytics, errorRecovery]);

  return <>{children}</>;
};

// Router-dependent Phase 3 Provider (must be inside BrowserRouter)
export const Phase3RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const predictivePreloading = usePredictivePreloading();

  // Initialize router-dependent optimizations
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔮 [PHASE3] Predictive preloading initialized');
    }
    
    // Start predictive preloading (silent)
    predictivePreloading.backgroundPreload();
  }, [predictivePreloading]);

  return <>{children}</>;
};

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
          <Phase3OptimizationProvider>
            <NetworkProvider>
              {children}
            </NetworkProvider>
          </Phase3OptimizationProvider>
        </ChainConfigProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};