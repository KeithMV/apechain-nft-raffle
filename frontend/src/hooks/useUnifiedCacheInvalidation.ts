/**
 * Unified Cache Invalidation System
 * Coordinates React Query cache and localStorage cleanup for real-time frontend updates
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useChainId } from 'wagmi';
import { optimisticUpdateHelpers, transactionQueryClient } from '../utils/transactionQueryClient';
import { useChainConfig } from '../hooks/useChainConfig';

export interface CacheInvalidationOptions {
  raffleContract?: string;
  userAddress?: string;
  transactionType?: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle';
  immediate?: boolean;
  chainId?: number;
}

/**
 * Unified cache invalidation hook that coordinates all cache layers
 */
export function useUnifiedCacheInvalidation() {
  const queryClient = useQueryClient();
  const currentChainId = useChainId();
  
  // Use centralized chain configuration
  const { invalidationDelay } = useChainConfig();
  
  // Clear localStorage cache entries (chain-specific)
  const clearAllCaches = useCallback((chainId?: number) => {
    if (typeof window !== 'undefined') {
      const targetChainId = chainId || currentChainId;
      Object.keys(localStorage).forEach(key => {
        if ((key.includes('raffle') || key.includes('cache') || key.includes('user_positions') || key.includes('created_raffles')) &&
            (key.includes(`_${targetChainId}_`) || !key.includes('_'))) {
          localStorage.removeItem(key);
        }
      });
    }
    console.log(`🧹 [CACHE] Chain ${chainId || currentChainId} localStorage caches cleared`);
  }, [currentChainId]);

  // Comprehensive cache invalidation for transaction completion with progressive refetch
  const invalidateAfterTransaction = useCallback(async (options: CacheInvalidationOptions = {}) => {
    const { raffleContract, userAddress, transactionType, immediate = true, chainId } = options;
    const targetChainId = chainId || currentChainId;
    
    // Use centralized invalidation delay
    const delay = invalidationDelay;
    
    console.log('🔄 [CACHE] Starting unified cache invalidation:', { ...options, chainId: targetChainId, delay });
    
    try {
      // 1. Clear custom cache system immediately (chain-specific)
      clearAllCaches(targetChainId);
      
      // 2. Invalidate React Query caches with chain-specific patterns
      const invalidationPromises = [
        // Core raffle data (chain-specific) - Updated to match useRaffleData query keys
        queryClient.invalidateQueries({ queryKey: ['raffles', targetChainId] }),
        queryClient.invalidateQueries({ queryKey: ['user-positions', targetChainId] }),
        queryClient.invalidateQueries({ queryKey: ['created-raffles', targetChainId] }),
        queryClient.invalidateQueries({ queryKey: ['all-raffles', targetChainId] }),
        
        // Browse page specific invalidation (matches useAllRaffles query key)
        queryClient.invalidateQueries({ queryKey: ['raffles', targetChainId, 'all'] }),
        
        // V4 specific queries (chain-specific)
        queryClient.invalidateQueries({ queryKey: ['raffles-v4', targetChainId] }),
        queryClient.invalidateQueries({ queryKey: ['positions-v4', targetChainId] }),
        queryClient.invalidateQueries({ queryKey: ['created-v4', targetChainId] }),
        
        // User NFTs cache - CRITICAL for raffle creation
        queryClient.invalidateQueries({ queryKey: ['user-nfts', targetChainId] }),
        queryClient.invalidateQueries({ queryKey: ['user-nfts'] }), // Also invalidate without chainId for backward compatibility
      ];
      
      // 3. Specific raffle invalidation
      if (raffleContract) {
        invalidationPromises.push(
          queryClient.invalidateQueries({ queryKey: ['raffle', targetChainId, raffleContract] }),
          queryClient.invalidateQueries({ queryKey: ['raffle-state', targetChainId, raffleContract] }),
          queryClient.invalidateQueries({ queryKey: ['ticket-count', targetChainId, raffleContract] })
        );
      }
      
      // 4. User-specific invalidation (chain-specific)
      if (userAddress) {
        invalidationPromises.push(
          queryClient.invalidateQueries({ queryKey: ['user-balance', targetChainId, userAddress] }),
          queryClient.invalidateQueries({ queryKey: ['user-positions', targetChainId, userAddress] }),
          queryClient.invalidateQueries({ queryKey: ['user-created', targetChainId, userAddress] }),
          // User NFTs for specific address
          queryClient.invalidateQueries({ queryKey: ['user-nfts', userAddress.toLowerCase(), targetChainId] })
        );
      }
      
      // 5. Transaction-specific optimistic updates cleanup
      if (raffleContract && transactionType) {
        optimisticUpdateHelpers.invalidateTransactionQueries(transactionQueryClient, raffleContract);
      }
      
      // Execute all invalidations
      await Promise.all(invalidationPromises);
      
      // Dispatch custom event for components using event-based invalidation
      window.dispatchEvent(new CustomEvent('cache-invalidated', { 
        detail: { raffleContract, chainId: targetChainId, timestamp: Date.now(), transactionType } 
      }));
      
      // 6. Progressive refetch strategy for winner selection with centralized delay
      if (immediate && transactionType === 'select-winner' && delay > 0) {
        console.log('🔄 [CACHE] Starting progressive refetch for delayed invalidation chain');
        
        // Progressive refetch with exponential backoff for chains with delayed invalidation
        const progressiveRefetch = async () => {
          const refetchQueries = [
            queryClient.refetchQueries({ queryKey: ['raffles', targetChainId] }),
            queryClient.refetchQueries({ queryKey: ['user-positions', targetChainId] }),
            queryClient.refetchQueries({ queryKey: ['created-raffles', targetChainId] })
          ];
          
          if (raffleContract) {
            refetchQueries.push(
              queryClient.refetchQueries({ queryKey: ['raffle', targetChainId, raffleContract] })
            );
          }
          
          return Promise.all(refetchQueries);
        };
        
        // Immediate optimistic refetch
        progressiveRefetch().catch(console.error);
        
        // Safety net refetch after delay + 2 seconds
        setTimeout(() => {
          console.log('🔄 [CACHE] Safety net refetch for delayed invalidation');
          progressiveRefetch().catch(console.error);
        }, delay + 2000);
        
        // Final guarantee refetch after delay + 7 seconds
        setTimeout(() => {
          console.log('🔄 [CACHE] Final guarantee refetch for delayed invalidation');
          progressiveRefetch().catch(console.error);
        }, delay + 7000);
        
      } else if (immediate) {
        // Standard immediate refetch for ApeChain or raffle creation
        const refetchPromises = [
          queryClient.refetchQueries({ queryKey: ['raffles', targetChainId] }),
          queryClient.refetchQueries({ queryKey: ['user-positions', targetChainId] }),
          queryClient.refetchQueries({ queryKey: ['created-raffles', targetChainId] })
        ];
        
        // For raffle creation, also refetch user NFTs immediately
        if (transactionType === 'create-raffle') {
          console.log('🎯 [CACHE] Raffle creation detected - refreshing user NFTs');
          refetchPromises.push(
            queryClient.refetchQueries({ queryKey: ['user-nfts', targetChainId] }),
            queryClient.refetchQueries({ queryKey: ['user-nfts'] })
          );
          
          if (userAddress) {
            refetchPromises.push(
              queryClient.refetchQueries({ queryKey: ['user-nfts', userAddress.toLowerCase(), targetChainId] })
            );
          }
        }
        
        if (raffleContract) {
          refetchPromises.push(
            queryClient.refetchQueries({ queryKey: ['raffle', targetChainId, raffleContract] })
          );
        }
        
        // Don't await refetch - let it happen in background
        Promise.all(refetchPromises).catch(console.error);
      }
      
      console.log(`✅ [CACHE] Unified cache invalidation completed successfully for chain ${targetChainId}`);
      
    } catch (error) {
      console.error('❌ [CACHE] Cache invalidation failed:', error);
    }
  }, [queryClient, clearAllCaches, currentChainId, invalidationDelay]);

  // Quick invalidation for immediate UI feedback (chain-specific)
  const quickInvalidate = useCallback((raffleContract?: string, chainId?: number) => {
    const targetChainId = chainId || currentChainId;
    console.log('⚡ [CACHE] Quick invalidation for chain:', targetChainId, 'raffle:', raffleContract);
    
    // Clear custom caches immediately (chain-specific)
    clearAllCaches(targetChainId);
    
    // Invalidate core queries without waiting (chain-specific)
    queryClient.invalidateQueries({ queryKey: ['raffles', targetChainId] });
    queryClient.invalidateQueries({ queryKey: ['user-positions', targetChainId] });
    queryClient.invalidateQueries({ queryKey: ['created-raffles', targetChainId] });
    queryClient.invalidateQueries({ queryKey: ['all-raffles', targetChainId] });
    
    // Browse page specific invalidation
    queryClient.invalidateQueries({ queryKey: ['raffles', targetChainId, 'all'] });
    
    // Also invalidate any React Query queries that might exist (chain-specific)
    queryClient.invalidateQueries({ queryKey: ['raffles-v4', targetChainId] });
    queryClient.invalidateQueries({ queryKey: ['positions-v4', targetChainId] });
    queryClient.invalidateQueries({ queryKey: ['created-v4', targetChainId] });
    
    if (raffleContract) {
      queryClient.invalidateQueries({ queryKey: ['raffle', targetChainId, raffleContract] });
    }
    
    // Dispatch custom event to trigger refetch in components using custom cache
    window.dispatchEvent(new CustomEvent('cache-invalidated', { 
      detail: { raffleContract, chainId: targetChainId, timestamp: Date.now() } 
    }));
  }, [queryClient, clearAllCaches, currentChainId]);

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