/**
 * Raffle Cache Manager Hook
 * Centralized cache management for raffle data with optimized storage and retrieval
 */

import { useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { OptimizedCache } from '../utils/performance';
import { RaffleInfo } from './useRaffleDataFetcher';

interface UserRafflePosition {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  userTickets: number;
  ticketsSold: number;
  maxTickets: number;
  endTime: number;
  completed: boolean;
  isActive: boolean;
  isWinner: boolean;
  winProbability: number;
  version: 'v3' | 'v4';
}

interface CacheConfig {
  maxSize: number;
  maxItems: number;
  ttl: number;
}

interface CacheKeyParams {
  type: 'raffles' | 'positions' | 'created';
  chainId?: number;
  userAddress?: string;
  limit?: number;
  offset?: number;
  page?: number;
}

// Cache configurations
const CACHE_CONFIGS = {
  raffles: { maxSize: 2 * 1024 * 1024, maxItems: 100, ttl: 60000 },
  positions: { maxSize: 1024 * 1024, maxItems: 50, ttl: 30000 },
  created: { maxSize: 512 * 1024, maxItems: 25, ttl: 45000 }
} as const;

export function useRaffleCacheManager() {
  const chainId = useChainId();

  // Initialize cache instances with memoization
  const caches = useMemo(() => ({
    raffles: new OptimizedCache<RaffleInfo[]>({
      maxSize: CACHE_CONFIGS.raffles.maxSize,
      maxItems: CACHE_CONFIGS.raffles.maxItems,
      ttl: CACHE_CONFIGS.raffles.ttl
    }),
    positions: new OptimizedCache<UserRafflePosition[]>({
      maxSize: CACHE_CONFIGS.positions.maxSize,
      maxItems: CACHE_CONFIGS.positions.maxItems,
      ttl: CACHE_CONFIGS.positions.ttl
    }),
    created: new OptimizedCache<RaffleInfo[]>({
      maxSize: CACHE_CONFIGS.created.maxSize,
      maxItems: CACHE_CONFIGS.created.maxItems,
      ttl: CACHE_CONFIGS.created.ttl
    })
  }), []);

  // Generate standardized cache keys
  const generateCacheKey = useCallback((params: CacheKeyParams): string => {
    const { type, userAddress, limit, offset, page } = params;
    const currentChainId = params.chainId || chainId;
    
    const keyParts = [`${type}_v4`, currentChainId];
    
    if (userAddress) keyParts.push(userAddress);
    if (limit !== undefined) keyParts.push(`limit_${limit}`);
    if (offset !== undefined) keyParts.push(`offset_${offset}`);
    if (page !== undefined) keyParts.push(`page_${page}`);
    
    // Add timestamp for freshness tracking
    keyParts.push(Math.floor(Date.now() / 60000).toString()); // 1-minute buckets
    
    return keyParts.join('_');
  }, [chainId]);

  // Cache operations for raffles
  const raffleCache = useMemo(() => ({
    get: (params: Omit<CacheKeyParams, 'type'>) => {
      const key = generateCacheKey({ ...params, type: 'raffles' });
      return caches.raffles.get(key);
    },
    set: (params: Omit<CacheKeyParams, 'type'>, data: RaffleInfo[]) => {
      const key = generateCacheKey({ ...params, type: 'raffles' });
      caches.raffles.set(key, data);
    },
    clear: () => caches.raffles.clear()
  }), [caches.raffles, generateCacheKey]);

  // Cache operations for user positions
  const positionCache = useMemo(() => ({
    get: (params: Omit<CacheKeyParams, 'type'>) => {
      const key = generateCacheKey({ ...params, type: 'positions' });
      return caches.positions.get(key);
    },
    set: (params: Omit<CacheKeyParams, 'type'>, data: UserRafflePosition[]) => {
      const key = generateCacheKey({ ...params, type: 'positions' });
      caches.positions.set(key, data);
    },
    clear: () => caches.positions.clear()
  }), [caches.positions, generateCacheKey]);

  // Cache operations for created raffles
  const createdCache = useMemo(() => ({
    get: (params: Omit<CacheKeyParams, 'type'>) => {
      const key = generateCacheKey({ ...params, type: 'created' });
      return caches.created.get(key);
    },
    set: (params: Omit<CacheKeyParams, 'type'>, data: RaffleInfo[]) => {
      const key = generateCacheKey({ ...params, type: 'created' });
      caches.created.set(key, data);
    },
    clear: () => caches.created.clear()
  }), [caches.created, generateCacheKey]);

  // Comprehensive cache clearing
  const clearAllCaches = useCallback(() => {
    caches.raffles.clear();
    caches.positions.clear();
    caches.created.clear();
    
    // Clear localStorage cache entries (including legacy V3 caches)
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('raffle') || key.includes('cache') || key.includes('user_positions') || key.includes('created_raffles')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    console.log('All raffle caches cleared (V3 and V4)');
  }, [caches]);

  // Clear cache for specific chain
  const clearChainCache = useCallback((targetChainId: number) => {
    // Since we can't selectively clear by key pattern in OptimizedCache,
    // we clear all caches when chain changes
    if (targetChainId !== chainId) {
      clearAllCaches();
    }
  }, [chainId, clearAllCaches]);

  // Cache statistics for debugging
  const getCacheStats = useCallback(() => ({
    raffles: {
      maxSize: CACHE_CONFIGS.raffles.maxSize,
      maxItems: CACHE_CONFIGS.raffles.maxItems,
      ttl: CACHE_CONFIGS.raffles.ttl
    },
    positions: {
      maxSize: CACHE_CONFIGS.positions.maxSize,
      maxItems: CACHE_CONFIGS.positions.maxItems,
      ttl: CACHE_CONFIGS.positions.ttl
    },
    created: {
      maxSize: CACHE_CONFIGS.created.maxSize,
      maxItems: CACHE_CONFIGS.created.maxItems,
      ttl: CACHE_CONFIGS.created.ttl
    }
  }), []);

  return {
    raffleCache,
    positionCache,
    createdCache,
    clearAllCaches,
    clearChainCache,
    getCacheStats,
    generateCacheKey
  };
}

export type { UserRafflePosition, CacheKeyParams };