/**
 * Transaction-Aware Query Client
 * Optimized for real-time transaction feedback with device-specific configurations
 */

import { QueryClient } from '@tanstack/react-query';
import { getDeviceType } from '../config/wagmiUnified';
import { getChainConfig } from '../config/chainConfigurations';

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
          // Don't retry rate limit errors
          if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
            return false;
          }
          // Don't retry user rejection errors
          if (error?.message?.includes('User rejected') || error?.message?.includes('user rejected')) {
            return false;
          }
          // Don't retry timeout errors
          if (error?.message?.includes('timeout') || error?.message?.includes('408')) {
            return false;
          }
          // Don't retry network errors that are likely permanent
          if (error?.message?.includes('400') || error?.message?.includes('Bad Request')) {
            return false;
          }
          // Limit retries more aggressively
          return failureCount < 1; // Only 1 retry maximum
        },
        retryDelay: (attemptIndex) => {
          // Faster retries for better UX
          const baseDelay = isMobile ? 500 : 300;
          return Math.min(baseDelay * Math.pow(1.5, attemptIndex), 3000);
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Optimized stale times for better performance
        staleTime: 30 * 1000, // 30 seconds - good balance
        gcTime: 5 * 60 * 1000, // 5 minutes
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