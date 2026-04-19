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
import { QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config, apeChain, polygon } from '../config/wagmi';
import { NetworkProvider } from '../contexts/NetworkContext';
import { transactionQueryClient } from '../utils/transactionQueryClient';

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

// STEP 3: Synchronous Web3Modal initialization - no delays that cause race conditions
const initializeWeb3Modal = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Check for existing Web3Modal instances more thoroughly
  const existingModals = document.querySelectorAll('w3m-modal, wcm-modal, w3m-router, w3m-toast, [data-w3m], [data-wcm]');
  const hasExistingInstance = (window as any).__WEB3MODAL_INSTANCE__ || existingModals.length > 0;
  
  if (hasExistingInstance) {
    console.log('⚠️ Web3Modal instance detected, cleaning up before reinitializing');
    
    // Clean up existing DOM elements
    existingModals.forEach(modal => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
    
    // Reset global state
    delete (window as any).__WEB3MODAL_INSTANCE__;
    delete (window as any).__WEB3MODAL_INITIALIZED__;
  }
  
  try {
    // CRITICAL FIX: No delays - initialize immediately to prevent race condition
    const web3modal = createWeb3Modal({
      wagmiConfig: config,
      projectId,
      
      // CRITICAL: Mobile-optimized settings
      allowUnsupportedChain: false,
      enableAnalytics: false,
      enableOnramp: false,
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
    
    // Store instance reference to prevent duplicates
    (window as any).__WEB3MODAL_INSTANCE__ = web3modal;
    (window as any).__WEB3MODAL_INITIALIZED__ = true;
    
    console.log(`✅ Web3Modal initialized successfully - ${isMobile ? 'Mobile' : 'Desktop'} - Build v1.0.3`);
    return web3modal;
  } catch (error) {
    console.error('❌ CRITICAL: Web3Modal initialization failed:', error);
    // Clean up failed state
    delete (window as any).__WEB3MODAL_INSTANCE__;
    delete (window as any).__WEB3MODAL_INITIALIZED__;
    throw error; // Re-throw to prevent app from continuing with broken state
  }
};

// Initialize Web3Modal immediately - no delays
initializeWeb3Modal();

// =============================================================================
// APP PROVIDERS COMPONENT (Code Reviewer: Clean, simple structure)
// =============================================================================

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // STEP 3: Enhanced cleanup and mobile-specific duplicate monitoring
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
      
      // Mobile-specific duplicate monitoring
      if (isMobile) {
        const checkForDuplicates = () => {
          const modals = document.querySelectorAll('w3m-modal, wcm-modal');
          if (modals.length > 1) {
            console.warn('📱 Mobile duplicate Web3Modal/WalletConnect detected, cleaning up');
            // Keep only the first one, remove the rest
            for (let i = 1; i < modals.length; i++) {
              const modal = modals[i];
              if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
              }
            }
          }
        };
        
        // Check immediately
        checkForDuplicates();
        
        // Monitor for DOM changes (mobile keyboards, orientation changes, etc.)
        const observer = new MutationObserver(() => {
          setTimeout(checkForDuplicates, 100);
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Cleanup observer on unmount
        return () => {
          observer.disconnect();
        };
      }
      
      if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
        console.log(`🧹 Enhanced cleanup initialized - ${isMobile ? 'Mobile' : 'Desktop'} mode`);
      }
    }

    // Debug Expert: Enhanced mobile detection logging
    if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
      console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'} - ${navigator.userAgent.split(' ')[0]}`);
      console.log('🚀 Enhanced providers initialized with duplicate protection');
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