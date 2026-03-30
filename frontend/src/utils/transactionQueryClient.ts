/**
 * Transaction-Aware Query Client
 * Optimized for real-time transaction feedback with device-specific configurations
 */

import { QueryClient } from '@tanstack/react-query';
import { getDeviceType } from '../config/wagmiUnified';
import { getChainConfig } from '../config/wagmiUnified';

// Transaction-specific cache keys
export const TRANSACTION_CACHE_KEYS = {
  PENDING_TRANSACTIONS: 'pending-transactions',
  RAFFLE_STATE: 'raffle-state',
  USER_BALANCE: 'user-balance',
  TICKET_COUNT: 'ticket-count',
} as const;

// Create transaction-optimized QueryClient
export const createTransactionQueryClient = () => {
  const isMobile = getDeviceType() === 'mobile';
  
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // AGGRESSIVE: No retries for any HTTP errors to prevent infinite loops
          if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
            console.warn('🚫 [QUERY] Rate limit detected - no retries');
            return false;
          }
          if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
            console.warn('🚫 [QUERY] Auth error detected - no retries');
            return false;
          }
          if (error?.message?.includes('400') || error?.message?.includes('Bad Request')) {
            console.warn('🚫 [QUERY] Bad request detected - no retries');
            return false;
          }
          if (error?.message?.includes('timeout') || error?.message?.includes('408')) {
            console.warn('🚫 [QUERY] Timeout detected - no retries');
            return false;
          }
          if (error?.message?.includes('User rejected') || error?.message?.includes('user rejected')) {
            return false;
          }
          // Network/DNS failures
          if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
            console.warn('🚫 [QUERY] Network error detected - no retries');
            return false;
          }
          // CORS errors
          if (error?.message?.includes('CORS') || error?.message?.includes('access control')) {
            console.warn('🚫 [QUERY] CORS error detected - no retries');
            return false;
          }
          // Mobile: No retries at all to prevent cascade failures
          if (isMobile) {
            console.warn('🚫 [QUERY] Mobile device - no retries to prevent cascade failures');
            return false;
          }
          // Desktop: Very limited retries
          return failureCount < 1;
        },
        retryDelay: (attemptIndex) => {
          // Much longer delays to prevent hammering
          const baseDelay = isMobile ? 5000 : 2000; // 5s mobile, 2s desktop
          return Math.min(baseDelay * Math.pow(2, attemptIndex), 30000); // Max 30s
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Much longer stale times to reduce requests
        staleTime: isMobile ? 60 * 1000 : 30 * 1000, // 60s mobile, 30s desktop
        gcTime: 10 * 60 * 1000, // 10 minutes
        networkMode: 'online',
      },
      mutations: {
        retry: 0, // No retries for mutations - handle in transaction manager
        networkMode: 'online',
      },
    },
  });
};

// Transaction-specific query options
export const getTransactionQueryOptions = (transactionType: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => {
  const isMobile = getDeviceType() === 'mobile';
  
  const baseOptions = {
    'buy-tickets': {
      staleTime: 1000, // 1 second - need real-time updates
      gcTime: 5000,
      refetchInterval: isMobile ? 3000 : 2000,
    },
    'select-winner': {
      staleTime: 2000, // 2 seconds - slightly less critical
      gcTime: 10000,
      refetchInterval: isMobile ? 4000 : 3000,
    },
    'create-raffle': {
      staleTime: 5000, // 5 seconds - less time-sensitive
      gcTime: 30000,
      refetchInterval: isMobile ? 6000 : 4000,
    },
    'cancel-raffle': {
      staleTime: 3000, // 3 seconds - moderate priority
      gcTime: 15000,
      refetchInterval: isMobile ? 5000 : 3000,
    },
  };

  return baseOptions[transactionType];
};

// Optimistic update helpers
export const optimisticUpdateHelpers = {
  // Optimistically update ticket count
  updateTicketCount: (queryClient: QueryClient, raffleId: string, newCount: number) => {
    queryClient.setQueryData([TRANSACTION_CACHE_KEYS.TICKET_COUNT, raffleId], newCount);
  },

  // Optimistically update user balance
  updateUserBalance: (queryClient: QueryClient, userAddress: string, newBalance: string) => {
    queryClient.setQueryData([TRANSACTION_CACHE_KEYS.USER_BALANCE, userAddress], newBalance);
  },

  // Optimistically update raffle state
  updateRaffleState: (queryClient: QueryClient, raffleId: string, newState: any) => {
    queryClient.setQueryData([TRANSACTION_CACHE_KEYS.RAFFLE_STATE, raffleId], newState);
  },

  // Invalidate transaction-related queries
  invalidateTransactionQueries: (queryClient: QueryClient, raffleId?: string) => {
    queryClient.invalidateQueries({ queryKey: [TRANSACTION_CACHE_KEYS.PENDING_TRANSACTIONS] });
    if (raffleId) {
      queryClient.invalidateQueries({ queryKey: [TRANSACTION_CACHE_KEYS.RAFFLE_STATE, raffleId] });
      queryClient.invalidateQueries({ queryKey: [TRANSACTION_CACHE_KEYS.TICKET_COUNT, raffleId] });
    }
  },
};

// Progressive timeout configuration with centralized chain-specific optimizations
export const getProgressiveTimeout = (transactionType: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle', attempt: number = 0, chainId?: number) => {
  const isMobile = getDeviceType() === 'mobile';
  
  // Use centralized chain configuration
  const chainConfig = getChainConfig(chainId);
  const timeoutMultiplier = chainConfig.transaction.timeoutMultiplier;
  
  // Base timeouts with device considerations
  const baseTimeouts = {
    'buy-tickets': isMobile ? 25000 : 20000, // 25s mobile, 20s desktop
    'select-winner': isMobile ? 50000 : 40000, // 50s mobile, 40s desktop
    'create-raffle': isMobile ? 40000 : 30000, // 40s mobile, 30s desktop
    'cancel-raffle': isMobile ? 35000 : 25000, // 35s mobile, 25s desktop
  };
  
  // Apply centralized chain multiplier
  const adjustedTimeout = Math.floor(baseTimeouts[transactionType] * timeoutMultiplier);

  // Increase timeout with each attempt (more aggressive for reliability)
  return adjustedTimeout + (attempt * 15000); // Increased from 10000 to 15000
};

export const transactionQueryClient = createTransactionQueryClient();