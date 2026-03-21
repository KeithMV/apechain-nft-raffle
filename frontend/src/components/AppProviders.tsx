/**
 * App Providers Component
 * Centralized provider management for Web3, queries, and application context
 */

import React, { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../config/wagmi';
import { NetworkProvider } from '../contexts/NetworkContext';
import { suppressWalletConnectErrors } from '../utils/walletCleanup';
import { suppressWeb3ModalWarnings } from '../utils/suppressWarnings';
import '../utils/consoleSecure'; // Auto-enables production console security

// Optimized QueryClient configuration with chain-specific settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 429 rate limit errors
        if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 10 * 60 * 1000, // 10 minutes for Polygon
      gcTime: 20 * 60 * 1000, // 20 minutes
      // Add network-specific timeouts
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 2000,
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    // Suppress WalletConnect console errors
    suppressWalletConnectErrors();
    
    // Suppress Web3Modal font warnings
    suppressWeb3ModalWarnings();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          {children}
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};