/**
 * SIMPLE CACHE INVALIDATION
 * Direct React Query cache management without complex abstractions
 * 
 * Expert Collaboration:
 * - Code Reviewer: Clean, focused cache operations
 * - Debug Expert: Clear logging and error handling
 * - Web3 Expert: Optimized for Web3 data patterns
 */

import { useQueryClient } from '@tanstack/react-query';
import { useChainId } from 'wagmi';

// =============================================================================
// CACHE INVALIDATION UTILITIES (Code Reviewer: Simple, focused functions)
// =============================================================================

/**
 * Simple cache invalidation hook
 */
export function useSimpleCacheInvalidation() {
  const queryClient = useQueryClient();
  const chainId = useChainId();

  return {
    // Debug Expert: Clear, specific invalidation functions
    invalidateRaffles: () => {
      queryClient.invalidateQueries({ queryKey: ['raffles', chainId] });
      if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
        console.log(`🔄 Invalidated raffles cache for chain ${chainId}`);
      }
    },

    invalidateUserNFTs: () => {
      queryClient.invalidateQueries({ queryKey: ['userNFTs', chainId] });
      if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
        console.log(`🔄 Invalidated user NFTs cache for chain ${chainId}`);
      }
    },

    invalidateRaffleData: (raffleAddress: string) => {
      queryClient.invalidateQueries({ queryKey: ['raffle', raffleAddress, chainId] });
      if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
        console.log(`🔄 Invalidated raffle data cache for ${raffleAddress}`);
      }
    },

    // Web3 Expert: Aggressive Polygon cache invalidation for faster UI updates
    invalidatePolygonCache: () => {
      if (chainId === 137) {
        queryClient.invalidateQueries({ queryKey: ['raffles', 137] });
        queryClient.invalidateQueries({ queryKey: ['userNFTs', 137] });
        if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
          console.log('🔄 Aggressive Polygon cache invalidation for faster UI updates');
        }
      }
    },

    // Code Reviewer: Simple, complete cache clear
    invalidateAll: () => {
      queryClient.invalidateQueries();
      if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
        console.log('🔄 Invalidated all cache');
      }
    },

    // Debug Expert: Cache inspection for troubleshooting
    logCacheState: () => {
      if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
        const cache = queryClient.getQueryCache();
        console.log('📊 Cache state:', {
          queries: cache.getAll().length,
          chainId,
          timestamp: new Date().toISOString(),
        });
      }
    },
  };
}

/**
 * Web3 Expert: Custom event-based cache invalidation for cross-component updates
 */
export function useEventBasedInvalidation() {
  const { invalidateRaffles, invalidateUserNFTs, invalidatePolygonCache } = useSimpleCacheInvalidation();

  // Listen for custom events
  React.useEffect(() => {
    const handleRaffleUpdate = () => {
      invalidateRaffles();
      invalidatePolygonCache(); // Extra invalidation for Polygon
    };

    const handleNFTUpdate = () => {
      invalidateUserNFTs();
    };

    // Debug Expert: Event listeners with proper cleanup
    window.addEventListener('raffle-updated', handleRaffleUpdate);
    window.addEventListener('nft-updated', handleNFTUpdate);

    return () => {
      window.removeEventListener('raffle-updated', handleRaffleUpdate);
      window.removeEventListener('nft-updated', handleNFTUpdate);
    };
  }, [invalidateRaffles, invalidateUserNFTs, invalidatePolygonCache]);
}

/**
 * Trigger custom cache invalidation events
 */
export function triggerCacheUpdate(type: 'raffle' | 'nft') {
  const event = new CustomEvent(`${type}-updated`);
  window.dispatchEvent(event);
  
  if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
    console.log(`🔔 Triggered ${type} cache update event`);
  }
}

// Import React for useEffect
import React from 'react';