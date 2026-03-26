/**
 * V4-Aware Raffle Position Hooks
 * Combines raffles from both V3 and V4 contracts
 */

import { useChainId } from 'wagmi';
import { useCallback, useMemo } from 'react';
import { useRaffleDataFetcher, RaffleInfo } from './useRaffleDataFetcher';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';
import { useRafflePositionProcessor } from './useRafflePositionProcessor';
import { useAsyncCachedLoader } from './useAsyncCachedLoader';
import { getRaffleFactoryAddress, isV4Available } from '../config/addresses';
import { debounce } from '../utils/performance';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useChainConfig } from '../hooks/useChainConfig';

// Type aliases for backward compatibility
export interface CreatedRaffle extends RaffleInfo {}

// PHASE 1: New Infinite Query Hook for Browse Raffles
export function useInfiniteAllRafflesV4(limit: number = 10) {
  const chainId = useChainId();
  const dataFetcher = useRaffleDataFetcher();
  
  // Use centralized cache configuration
  const { config: chainConfig } = useChainConfig();
  const cacheConfig = {
    staleTime: chainConfig.cache.staleTime,
    gcTime: chainConfig.cache.gcTime,
  };

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['raffles-infinite-v4', chainId],
    queryFn: ({ pageParam = 0 }) => {
      // Reduced logging frequency
      if (pageParam === 0) console.log(`🔄 [INFINITE] Fetching initial page with limit ${limit}`);
      return dataFetcher.fetchAllRaffles({ 
        limit, 
        offset: pageParam * limit 
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than limit, we've reached the end
      if (lastPage.length < limit) {
        if (allPages.length <= 2) console.log(`📄 [INFINITE] Reached end at page ${allPages.length - 1}`);
        return undefined;
      }
      if (allPages.length <= 2) console.log(`📄 [INFINITE] Next page available: ${allPages.length}`);
      return allPages.length;
    },
    enabled: dataFetcher.isReady,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    // Ensure pages don't get garbage collected too quickly
    maxPages: 10, // Keep up to 10 pages in memory
  });

  // Flatten all pages into single array with memoization
  const allRaffles = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];
    const flattened = infiniteQuery.data.pages.flat();
    // Only log on significant changes
    if (flattened.length > 0 && flattened.length % 10 === 0) {
      console.log(`📊 [INFINITE] Total raffles across ${infiniteQuery.data.pages.length} pages: ${flattened.length}`);
    }
    return flattened;
  }, [infiniteQuery.data?.pages]);

  // Debounced refetch function
  const debouncedRefetch = useMemo(
    () => debounce(infiniteQuery.refetch, 300),
    [infiniteQuery.refetch]
  );

  return {
    raffles: allRaffles,
    loading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    refetch: debouncedRefetch,
    // Infinite query specific methods
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    // Debug info
    pageCount: infiniteQuery.data?.pages.length || 0,
  };
}

// EXISTING: Original hook remains unchanged for backward compatibility
export function useAllRafflesV4(limit: number = 15, offset: number = 0) {
  const chainId = useChainId();
  const dataFetcher = useRaffleDataFetcher();
  
  // Use centralized cache configuration
  const { config: chainConfig } = useChainConfig();
  const staleTime = chainConfig.cache.staleTime;
  const gcTime = chainConfig.cache.gcTime;

  const { data: raffles, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['raffles-v4', chainId, limit, offset],
    queryFn: () => dataFetcher.fetchAllRaffles({ limit, offset }),
    enabled: dataFetcher.isReady,
    staleTime,
    gcTime,
  });

  const debouncedRefetch = useMemo(
    () => debounce(refetch, 300),
    [refetch]
  );

  return { 
    raffles: raffles || [], 
    loading, 
    error, 
    refetch: debouncedRefetch 
  };
}

// Clear cache utility - using unified system
export function useClearRaffleCacheV4() {
  const { quickInvalidate } = useUnifiedCacheInvalidation();
  return quickInvalidate;
}
// Get user's raffle positions (network-aware)
export function useUserRafflePositionsV4(userAddress?: string) {
  const chainId = useChainId();
  const { getCombinedUserPositions } = useRafflePositionProcessor();
  
  // Use centralized cache configuration
  const { config: chainConfig } = useChainConfig();
  const cacheConfig = {
    userStaleTime: chainConfig.cache.userStaleTime,
    userGcTime: chainConfig.cache.userGcTime,
  };

  const { data: positions, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['positions-v4', userAddress, chainId],
    queryFn: async () => {
      if (!userAddress || !chainId) throw new Error('Missing required parameters');

      // Build factory list based on available versions
      const factories: Array<{ address: string; version: 'v3' | 'v4' }> = [];
      
      if (isV4Available(chainId)) {
        const v4Address = getRaffleFactoryAddress(chainId, true);
        factories.push({ address: v4Address, version: 'v4' as const });
      }
      
      const v3Address = getRaffleFactoryAddress(chainId, false);
      factories.push({ address: v3Address, version: 'v3' as const });
      
      return await getCombinedUserPositions(factories, userAddress);
    },
    enabled: Boolean(userAddress && chainId),
    staleTime: cacheConfig.userStaleTime,
    gcTime: cacheConfig.userGcTime,
  });

  return { 
    positions: positions || [], 
    loading, 
    error, 
    refetch 
  };
}


// PHASE 1: New Infinite Query Hook for Dashboard Created Raffles
export function useInfiniteCreatedRafflesV4(userAddress?: string, limit: number = 15) {
  const chainId = useChainId();
  const dataFetcher = useRaffleDataFetcher();
  
  // Use centralized cache configuration
  const { config: chainConfig } = useChainConfig();
  const staleTime = chainConfig.cache.staleTime;
  const gcTime = chainConfig.cache.gcTime;

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['created-infinite-v4', chainId, userAddress],
    queryFn: async ({ pageParam = 0 }) => {
      if (!dataFetcher.isReady || !userAddress) {
        throw new Error('Missing required parameters');
      }

      // Reduced logging - only log first fetch
      if (pageParam === 0) console.log(`🔄 [INFINITE-CREATED] Fetching initial page for user ${userAddress}`);
      
      // Fetch more raffles to filter from (since we're filtering by creator)
      const fetchLimit = 30;
      const allRaffles = await dataFetcher.fetchAllRaffles({ 
        limit: fetchLimit,
        offset: pageParam * fetchLimit
      });
      
      // Filter by creator and sort by creation time (newest first)
      const createdRaffles = allRaffles
        .filter(r => r.creator.toLowerCase() === userAddress.toLowerCase())
        .sort((a, b) => b.endTime - a.endTime);
      
      // Only log if found raffles
      if (createdRaffles.length > 0 && pageParam === 0) {
        console.log(`📊 [INFINITE-CREATED] Page ${pageParam}: ${createdRaffles.length} created raffles found`);
      }
      return createdRaffles;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // For created raffles, we continue if we got any results
      // (since filtering might result in fewer items per page)
      if (lastPage.length === 0) {
        console.log(`📄 [INFINITE-CREATED] No more created raffles at page ${allPages.length - 1}`);
        return undefined;
      }
      return allPages.length;
    },
    enabled: Boolean(dataFetcher.isReady && userAddress && chainId),
    staleTime,
    gcTime,
    maxPages: 5, // Keep fewer pages for user-specific data
  });

  // Flatten and deduplicate created raffles
  const allCreatedRaffles = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];
    
    const flattened = infiniteQuery.data.pages.flat();
    
    // Remove duplicates based on contract + raffle ID
    const unique = flattened.filter((raffle, index, self) => 
      index === self.findIndex(r => 
        r.raffleContract === raffle.raffleContract && r.raffleId === raffle.raffleId
      )
    );
    
    // Only log final count once
    if (unique.length > 0 && !infiniteQuery.isLoading) {
      console.log(`📊 [INFINITE-CREATED] Total unique created raffles: ${unique.length}`);
    }
    return unique;
  }, [infiniteQuery.data?.pages]);

  return {
    raffles: allCreatedRaffles,
    loading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    refetch: infiniteQuery.refetch,
    // Infinite query specific methods
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    // Debug info
    pageCount: infiniteQuery.data?.pages.length || 0,
  };
}

// EXISTING: Original created raffles hook remains unchanged
export function useCreatedRafflesV4(userAddress?: string, page: number = 0) {
  const chainId = useChainId();
  const dataFetcher = useRaffleDataFetcher();
  
  // Use centralized cache configuration
  const { config: chainConfig } = useChainConfig();
  const staleTime = chainConfig.cache.staleTime;
  const gcTime = chainConfig.cache.gcTime;

  const { data: raffles, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['created-v4', chainId, userAddress, page],
    queryFn: async () => {
      if (!dataFetcher.isReady || !userAddress) {
        throw new Error('Missing required parameters');
      }

      // Fetch fewer raffles for better performance, then filter
      const allRaffles = await dataFetcher.fetchAllRaffles({ 
        limit: 30, // Reduced from 50 to 30 for better performance
        offset: page * 15 // Smaller page size
      });
      
      // Filter by creator and sort by creation time (newest first)
      return allRaffles
        .filter(r => r.creator.toLowerCase() === userAddress.toLowerCase())
        .sort((a, b) => b.endTime - a.endTime);
    },
    enabled: Boolean(dataFetcher.isReady && userAddress && chainId),
    staleTime,
    gcTime,
  });

  return { 
    raffles: raffles || [], 
    loading, 
    error, 
    refetch 
  };
}