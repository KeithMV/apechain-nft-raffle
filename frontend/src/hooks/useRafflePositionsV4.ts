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
import { useQuery } from '@tanstack/react-query';

// Type aliases for backward compatibility
export interface CreatedRaffle extends RaffleInfo {}

// Get all raffles from both V3 and V4 - optimized for performance with proper pagination
export function useAllRafflesV4(limit: number = 15, currentPage: number = 0) {
  const chainId = useChainId();
  const dataFetcher = useRaffleDataFetcher();
  
  // Chain-specific query optimization
  const isPolygon = chainId === 137;
  const staleTime = isPolygon ? 45000 : 30000; // Longer stale time for Polygon
  const gcTime = isPolygon ? 90000 : 60000; // Longer garbage collection for Polygon

  // Fetch all pages up to current page
  const { data: allPagesData, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['raffles-v4', chainId], // Single query key for all pages
    queryFn: async () => {
      const allRaffles: RaffleInfo[] = [];
      
      // Fetch all pages from 0 to currentPage
      for (let page = 0; page <= currentPage; page++) {
        const offset = page * limit;
        const pageRaffles = await dataFetcher.fetchAllRaffles({ limit, offset });
        allRaffles.push(...pageRaffles);
        
        // If we got fewer than limit, we've reached the end
        if (pageRaffles.length < limit) {
          break;
        }
      }
      
      return allRaffles;
    },
    enabled: dataFetcher.isReady,
    staleTime,
    gcTime,
  });

  const debouncedRefetch = useMemo(
    () => debounce(refetch, 300),
    [refetch]
  );

  return { 
    raffles: allPagesData || [], 
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
  
  // Chain-specific query optimization
  const isPolygon = chainId === 137;
  const staleTime = isPolygon ? 25000 : 15000; // Longer stale time for Polygon
  const gcTime = isPolygon ? 45000 : 30000; // Longer garbage collection for Polygon

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
    staleTime,
    gcTime,
  });

  return { 
    positions: positions || [], 
    loading, 
    error, 
    refetch 
  };
}


// Get user's created raffles (network-aware) with proper pagination
export function useCreatedRafflesV4(userAddress?: string, currentPage: number = 0) {
  const chainId = useChainId();
  const dataFetcher = useRaffleDataFetcher();
  
  // Chain-specific query optimization
  const isPolygon = chainId === 137;
  const staleTime = isPolygon ? 45000 : 30000; // Longer stale time for Polygon
  const gcTime = isPolygon ? 90000 : 60000; // Longer garbage collection for Polygon

  const { data: raffles, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['created-v4', chainId, userAddress], // Single query key for all pages
    queryFn: async () => {
      if (!dataFetcher.isReady || !userAddress) {
        throw new Error('Missing required parameters');
      }

      const allCreatedRaffles: RaffleInfo[] = [];
      const pageSize = 15;
      
      // Fetch all pages up to current page
      for (let page = 0; page <= currentPage; page++) {
        const allRaffles = await dataFetcher.fetchAllRaffles({ 
          limit: 30, // Fetch more to filter from
          offset: page * 30
        });
        
        // Filter by creator
        const createdRaffles = allRaffles
          .filter(r => r.creator.toLowerCase() === userAddress.toLowerCase());
          
        allCreatedRaffles.push(...createdRaffles);
        
        // If we got fewer than expected, we've reached the end
        if (allRaffles.length < 30) {
          break;
        }
      }
      
      // Sort by creation time (newest first) and remove duplicates
      const uniqueRaffles = allCreatedRaffles
        .filter((raffle, index, self) => 
          index === self.findIndex(r => r.raffleContract === raffle.raffleContract && r.raffleId === raffle.raffleId)
        )
        .sort((a, b) => b.endTime - a.endTime);
      
      return uniqueRaffles;
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