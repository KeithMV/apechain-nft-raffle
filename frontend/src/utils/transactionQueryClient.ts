/**
 * Transaction-Aware Query Client
 * Optimized for real-time transaction feedback with device-specific configurations
 */

import { QueryClient } from '@tanstack/react-query';
import { getDeviceSettings } from '../config/mobileSafeWagmi';

// Transaction-specific cache keys
export const TRANSACTION_CACHE_KEYS = {
  PENDING_TRANSACTIONS: 'pending-transactions',
  RAFFLE_STATE: 'raffle-state',
  USER_BALANCE: 'user-balance',
  TICKET_COUNT: 'ticket-count',
} as const;

// Create transaction-optimized QueryClient
export const createTransactionQueryClient = () => {
  const deviceSettings = getDeviceSettings();
  
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
          return failureCount < (deviceSettings.isMobile ? 1 : 2);
        },
        retryDelay: (attemptIndex) => {
          // Faster retries for better UX
          const baseDelay = deviceSettings.isMobile ? 500 : 300;
          return Math.min(baseDelay * Math.pow(1.5, attemptIndex), 3000);
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Adaptive stale times based on data type
        staleTime: deviceSettings.staleTime,
        gcTime: deviceSettings.staleTime * 2,
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
  const deviceSettings = getDeviceSettings();
  
  const baseOptions = {
    'buy-tickets': {
      staleTime: 1000, // 1 second - need real-time updates
      gcTime: 5000,
      refetchInterval: deviceSettings.isMobile ? 3000 : 2000,
    },
    'select-winner': {
      staleTime: 2000, // 2 seconds - slightly less critical
      gcTime: 10000,
      refetchInterval: deviceSettings.isMobile ? 4000 : 3000,
    },
    'create-raffle': {
      staleTime: 5000, // 5 seconds - less time-sensitive
      gcTime: 30000,
      refetchInterval: deviceSettings.isMobile ? 6000 : 4000,
    },
    'cancel-raffle': {
      staleTime: 3000, // 3 seconds - moderate priority
      gcTime: 15000,
      refetchInterval: deviceSettings.isMobile ? 5000 : 3000,
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

// Progressive timeout configuration
export const getProgressiveTimeout = (transactionType: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle', attempt: number = 0) => {
  const deviceSettings = getDeviceSettings();
  
  const baseTimeouts = {
    'buy-tickets': deviceSettings.isMobile ? 25000 : 20000, // 25s mobile, 20s desktop
    'select-winner': deviceSettings.isMobile ? 50000 : 40000, // 50s mobile, 40s desktop
    'create-raffle': deviceSettings.isMobile ? 40000 : 30000, // 40s mobile, 30s desktop
    'cancel-raffle': deviceSettings.isMobile ? 35000 : 25000, // 35s mobile, 25s desktop
  };

  // Increase timeout with each attempt
  return baseTimeouts[transactionType] + (attempt * 10000);
};

export const transactionQueryClient = createTransactionQueryClient();