/**
 * Unified Cache Invalidation System
 * Coordinates React Query cache and custom cache systems for real-time frontend updates
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useRaffleCacheManager } from './useRaffleCacheManager';
import { optimisticUpdateHelpers, transactionQueryClient } from '../utils/transactionQueryClient';

export interface CacheInvalidationOptions {
  raffleContract?: string;
  userAddress?: string;
  transactionType?: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle';
  immediate?: boolean;
}

/**
 * Unified cache invalidation hook that coordinates all cache layers
 */
export function useUnifiedCacheInvalidation() {
  const queryClient = useQueryClient();
  const { clearAllCaches, clearChainCache } = useRaffleCacheManager();

  // Comprehensive cache invalidation for transaction completion
  const invalidateAfterTransaction = useCallback(async (options: CacheInvalidationOptions = {}) => {
    const { raffleContract, userAddress, transactionType, immediate = true } = options;
    
    console.log('🔄 [CACHE] Starting unified cache invalidation:', options);
    
    try {
      // 1. Clear custom cache system immediately
      clearAllCaches();
      
      // 2. Invalidate React Query caches with specific patterns
      const invalidationPromises = [
        // Core raffle data
        queryClient.invalidateQueries({ queryKey: ['raffles'] }),
        queryClient.invalidateQueries({ queryKey: ['user-positions'] }),
        queryClient.invalidateQueries({ queryKey: ['created-raffles'] }),
        queryClient.invalidateQueries({ queryKey: ['all-raffles'] }),
        
        // V4 specific queries
        queryClient.invalidateQueries({ queryKey: ['raffles-v4'] }),
        queryClient.invalidateQueries({ queryKey: ['positions-v4'] }),
        queryClient.invalidateQueries({ queryKey: ['created-v4'] }),
      ];
      
      // 3. Specific raffle invalidation
      if (raffleContract) {
        invalidationPromises.push(
          queryClient.invalidateQueries({ queryKey: ['raffle', raffleContract] }),
          queryClient.invalidateQueries({ queryKey: ['raffle-state', raffleContract] }),
          queryClient.invalidateQueries({ queryKey: ['ticket-count', raffleContract] })
        );
      }
      
      // 4. User-specific invalidation
      if (userAddress) {
        invalidationPromises.push(
          queryClient.invalidateQueries({ queryKey: ['user-balance', userAddress] }),
          queryClient.invalidateQueries({ queryKey: ['user-positions', userAddress] }),
          queryClient.invalidateQueries({ queryKey: ['user-created', userAddress] })
        );
      }
      
      // 5. Transaction-specific optimistic updates cleanup
      if (raffleContract && transactionType) {
        optimisticUpdateHelpers.invalidateTransactionQueries(transactionQueryClient, raffleContract);
      }
      
      // Execute all invalidations
      await Promise.all(invalidationPromises);
      
      // 6. Force refetch critical queries immediately if requested
      if (immediate) {
        const refetchPromises = [
          queryClient.refetchQueries({ queryKey: ['raffles'] }),
          queryClient.refetchQueries({ queryKey: ['user-positions'] }),
          queryClient.refetchQueries({ queryKey: ['created-raffles'] })
        ];
        
        if (raffleContract) {
          refetchPromises.push(
            queryClient.refetchQueries({ queryKey: ['raffle', raffleContract] })
          );
        }
        
        // Don't await refetch - let it happen in background
        Promise.all(refetchPromises).catch(console.error);
      }
      
      console.log('✅ [CACHE] Unified cache invalidation completed successfully');
      
    } catch (error) {
      console.error('❌ [CACHE] Cache invalidation failed:', error);
    }
  }, [queryClient, clearAllCaches, clearChainCache]);

  // Quick invalidation for immediate UI feedback
  const quickInvalidate = useCallback((raffleContract?: string) => {
    console.log('⚡ [CACHE] Quick invalidation for:', raffleContract);
    
    // Clear custom caches immediately
    clearAllCaches();
    
    // Invalidate core queries without waiting
    queryClient.invalidateQueries({ queryKey: ['raffles'] });
    queryClient.invalidateQueries({ queryKey: ['user-positions'] });
    queryClient.invalidateQueries({ queryKey: ['created-raffles'] });
    
    if (raffleContract) {
      queryClient.invalidateQueries({ queryKey: ['raffle', raffleContract] });
    }
  }, [queryClient, clearAllCaches]);

  // Emergency cache reset (use sparingly)
  const emergencyReset = useCallback(async () => {
    console.log('🚨 [CACHE] Emergency cache reset initiated');
    
    try {
      // Clear all custom caches
      clearAllCaches();
      
      // Clear all React Query caches
      queryClient.clear();
      
      // Force reload of critical data
      await queryClient.refetchQueries();
      
      console.log('✅ [CACHE] Emergency reset completed');
    } catch (error) {
      console.error('❌ [CACHE] Emergency reset failed:', error);
    }
  }, [queryClient, clearAllCaches]);

  return {
    invalidateAfterTransaction,
    quickInvalidate,
    emergencyReset,
  };
}