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

// Get all raffles from both V3 and V4
export function useAllRafflesV4(limit: number = 20, offset: number = 0) {
  const chainId = useChainId();
  const dataFetcher = useRaffleDataFetcher();

  const { data: raffles, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['raffles-v4', chainId, limit, offset],
    queryFn: () => dataFetcher.fetchAllRaffles({ limit, offset }),
    enabled: dataFetcher.isReady,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
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
    staleTime: 15000, // 15 seconds - positions change frequently
    gcTime: 30000, // 30 seconds
  });

  return { 
    positions: positions || [], 
    loading, 
    error, 
    refetch 
  };
}


// Get user's created raffles (network-aware)
export function useCreatedRafflesV4(userAddress?: string, page: number = 0) {
  const chainId = useChainId();
  const dataFetcher = useRaffleDataFetcher();

  const { data: raffles, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['created-v4', chainId, userAddress, page],
    queryFn: async () => {
      if (!dataFetcher.isReady || !userAddress) {
        throw new Error('Missing required parameters');
      }

      // Fetch more raffles to filter by creator
      const allRaffles = await dataFetcher.fetchAllRaffles({ 
        limit: 50, 
        offset: page * 20 
      });
      
      // Filter by creator and sort by creation time (newest first)
      return allRaffles
        .filter(r => r.creator.toLowerCase() === userAddress.toLowerCase())
        .sort((a, b) => b.endTime - a.endTime);
    },
    enabled: Boolean(dataFetcher.isReady && userAddress && chainId),
    staleTime: 45000, // 45 seconds - created raffles change less frequently
    gcTime: 90000, // 1.5 minutes
  });

  return { 
    raffles: raffles || [], 
    loading, 
    error, 
    refetch 
  };
}