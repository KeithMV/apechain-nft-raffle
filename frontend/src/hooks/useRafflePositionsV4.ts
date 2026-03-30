/**
 * V4-Aware Raffle Position Hooks
 * Combines raffles from both V3 and V4 contracts
 */

import { useChainId, useAccount, usePublicClient } from 'wagmi';
import { useMemo } from 'react';
import { useRaffleDataFetcher, RaffleInfo } from './useRaffleDataFetcher';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';
import { useRafflePositionProcessor } from './useRafflePositionProcessor';
import { getRaffleFactoryAddress, isV4Available } from '../config/addresses';
import { RAFFLE_FACTORY_ABI } from '../config/contracts';
import { debounce, processBatch } from '../utils/performance';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useChainConfig } from '../hooks/useChainConfig';

// Type aliases for backward compatibility
export interface CreatedRaffle extends RaffleInfo {}

// PHASE 1: New Infinite Query Hook for Browse Raffles - POLYGON OPTIMIZED
export function useInfiniteAllRafflesV4(limit: number = 10) {
  const chainId = useChainId();
  const dataFetcher = useRaffleDataFetcher();
  
  // Use centralized cache configuration
  const { config: chainConfig } = useChainConfig();
  const cacheConfig = {
    staleTime: chainConfig.cache.staleTime,
    gcTime: chainConfig.cache.gcTime,
  };

  // POLYGON OPTIMIZATION: Reduce limit for faster loading
  const optimizedLimit = chainId === 137 ? Math.min(limit, 8) : limit;

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['raffles-infinite-v4', chainId],
    queryFn: ({ pageParam = 0 }) => {
      // Reduced logging frequency
      if (pageParam === 0 && process.env.NODE_ENV === 'development') console.log(`🔄 [INFINITE] Fetching initial page with limit ${optimizedLimit}`);
      return dataFetcher.fetchAllRaffles({ 
        limit: optimizedLimit, // Use optimized limit
        offset: pageParam * optimizedLimit 
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than limit, we've reached the end
      if (lastPage.length < optimizedLimit) {
        if (allPages.length <= 2) console.log(`📄 [INFINITE] Reached end at page ${allPages.length - 1}`);
        return undefined;
      }
      if (allPages.length <= 2) console.log(`📄 [INFINITE] Next page available: ${allPages.length}`);
      return allPages.length;
    },
    enabled: dataFetcher.isReady,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    // POLYGON: Keep fewer pages in memory
    maxPages: chainId === 137 ? 6 : 10,
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
// Get user's raffle positions (network-aware) - WEB3 BEST PRACTICE IMPLEMENTATION
export function useUserRafflePositionsV4(userAddress?: string) {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { getCombinedUserPositions } = useRafflePositionProcessor();
  
  // WEB3 BEST PRACTICE: Stable address resolution
  const resolvedAddress = useMemo(() => {
    if (!isConnected || isConnecting) return undefined;
    return userAddress || address;
  }, [userAddress, address, isConnected, isConnecting]);
  
  // PHASE 1: Use IDENTICAL cache configuration for both hooks
  const { config: chainConfig } = useChainConfig();
  const cacheConfig = {
    staleTime: chainConfig.cache.staleTime,
    gcTime: chainConfig.cache.gcTime,
  };

  const { data: positions, isLoading: loading, error, refetch } = useQuery({
    // PHASE 1: Use CONSISTENT query key that matches cache invalidation
    queryKey: ['positions-v4', chainId, resolvedAddress?.toLowerCase() || 'disconnected'],
    queryFn: async () => {
      if (!resolvedAddress || !chainId) throw new Error('Missing required parameters');

      // Build factory list based on available versions
      const factories: Array<{ address: string; version: 'v3' | 'v4' }> = [];
      
      if (isV4Available(chainId)) {
        const v4Address = getRaffleFactoryAddress(chainId, true);
        factories.push({ address: v4Address, version: 'v4' as const });
      }
      
      const v3Address = getRaffleFactoryAddress(chainId, false);
      factories.push({ address: v3Address, version: 'v3' as const });
      
      return await getCombinedUserPositions(factories, resolvedAddress, {
        // 🚨 CRITICAL: Use CONSERVATIVE scanning parameters
        maxRafflesToCheck: chainId === 137 ? 15 : 25, // REDUCED: Much fewer raffles
        batchSize: chainId === 137 ? 2 : 3,           // REDUCED: Tiny batches  
        concurrency: 1,                               // SEQUENTIAL: No parallel processing
      }).then(positions => {
        console.log('🔍 [POSITIONS-DEBUG]', {
          resolvedAddress,
          chainId,
          factoryCount: factories.length,
          positionsFound: positions.length,
          positionDetails: positions.map(p => ({
            raffleId: p.raffleId,
            raffleContract: p.raffleContract,
            version: p.version,
            userTickets: p.userTickets
          }))
        });
        return positions;
      });
    },
    // WEB3 BEST PRACTICE: Multi-condition enabled check
    enabled: Boolean(
      resolvedAddress && 
      chainId && 
      isConnected && 
      !isConnecting
    ),
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    // PHASE 3: Enhanced error handling and retry logic (matching created raffles)
    retry: (failureCount, error) => {
      // Don't retry on wallet disconnection
      if (error?.message?.includes('Missing required parameters')) {
        return false;
      }
      // Polygon gets more retries due to network instability
      const maxRetries = chainId === 137 ? 3 : 2;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => {
      // Progressive backoff, longer delays for Polygon
      const baseDelay = chainId === 137 ? 2000 : 1000;
      return Math.min(baseDelay * Math.pow(2, attemptIndex), 10000);
    },
    // PHASE 3: Prevent background refetches during user interaction
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  return { 
    positions: positions || [], 
    loading: loading || isConnecting, // Include wallet connection loading
    error, 
    refetch 
  };
}


// PHASE 1: New Infinite Query Hook for Dashboard Created Raffles - CONSISTENT APPROACH
export function useInfiniteCreatedRafflesV4(userAddress?: string, limit: number = 15) {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  
  // WEB3 BEST PRACTICE: Stable address resolution
  const resolvedAddress = useMemo(() => {
    if (!isConnected || isConnecting) return undefined;
    return userAddress || address;
  }, [userAddress, address, isConnected, isConnecting]);
  
  // PHASE 1: Use IDENTICAL cache configuration as participated raffles
  const { config: chainConfig } = useChainConfig();
  const cacheConfig = {
    staleTime: chainConfig.cache.staleTime,
    gcTime: chainConfig.cache.gcTime,
  };

  const { data: createdRaffles, isLoading: loading, error, refetch } = useQuery({
    // PHASE 1: Use CONSISTENT query key that matches cache invalidation
    queryKey: ['created-v4', chainId, resolvedAddress?.toLowerCase() || 'disconnected'],
    queryFn: async () => {
      if (!resolvedAddress || !chainId || !publicClient) {
        throw new Error('Missing required parameters');
      }

      console.log(`🔄 [CREATED-RAFFLES] Scanning for created raffles by user ${resolvedAddress}`);
      
      // Build factory list based on available versions
      const factories: Array<{ address: string; version: 'v3' | 'v4' }> = [];
      
      if (isV4Available(chainId)) {
        const v4Address = getRaffleFactoryAddress(chainId, true);
        factories.push({ address: v4Address, version: 'v4' as const });
      }
      
      const v3Address = getRaffleFactoryAddress(chainId, false);
      factories.push({ address: v3Address, version: 'v3' as const });
      
      // PHASE 2: DETERMINISTIC PARALLEL PROCESSING - No more race conditions!
      const factoryPromises = factories.map(async (factory) => {
        try {
          // Get total raffle count
          const raffleCount = await publicClient.readContract({
            address: factory.address as `0x${string}`,
            abi: RAFFLE_FACTORY_ABI,
            functionName: 'raffleCounter',
          });

          const totalRaffles = Number(raffleCount);
          if (totalRaffles === 0) return [];

          // CONSERVATIVE: Fixed scan range for consistency
          const scanRange = chainId === 137 ? 15 : 25; // REDUCED: Much smaller scan range
          const startIndex = Math.max(0, totalRaffles - scanRange);
          const indices = Array.from(
            { length: totalRaffles - startIndex }, 
            (_, i) => startIndex + i
          );
          
          // CONSERVATIVE: Very small batch processing
          const batchConfig = chainId === 137 
            ? { batchSize: 2, maxConcurrent: 1, delay: 200 } // Very slow for Polygon
            : { batchSize: 3, maxConcurrent: 1, delay: 100 }; // Slow for ApeChain
          
          // Process raffles in deterministic batches
          const batchResults = await processBatch(
            indices,
            async (i) => {
              try {
                // Get raffle contract address
                const raffleContract = await publicClient.readContract({
                  address: factory.address as `0x${string}`,
                  abi: RAFFLE_FACTORY_ABI,
                  functionName: 'getRaffleContract',
                  args: [BigInt(i)],
                });
                
                // Get raffle info
                const raffle = await publicClient.readContract({
                  address: raffleContract as `0x${string}`,
                  abi: [{
                    inputs: [],
                    name: 'getRaffleInfo',
                    outputs: [{
                      components: [
                        { name: 'nftContract', type: 'address' },
                        { name: 'tokenId', type: 'uint256' },
                        { name: 'creator', type: 'address' },
                        { name: 'ticketPrice', type: 'uint256' },
                        { name: 'maxTickets', type: 'uint256' },
                        { name: 'ticketsSold', type: 'uint256' },
                        { name: 'endTime', type: 'uint256' },
                        { name: 'winner', type: 'address' },
                        { name: 'completed', type: 'bool' },
                        { name: 'platformFee', type: 'uint256' }
                      ],
                      type: 'tuple'
                    }],
                    stateMutability: 'view',
                    type: 'function'
                  }],
                  functionName: 'getRaffleInfo',
                });
                
                // Check if user is the creator
                if (raffle.creator.toLowerCase() === resolvedAddress.toLowerCase()) {
                  const now = Date.now() / 1000;
                  const endTime = Number(raffle.endTime);
                  const ticketsSold = Number(raffle.ticketsSold);
                  const maxTickets = Number(raffle.maxTickets);
                  const isSoldOut = ticketsSold >= maxTickets;
                  const isActive = now < endTime && !raffle.completed && !isSoldOut;
                  
                  return {
                    raffleId: i,
                    raffleContract: raffleContract as string,
                    nftContract: raffle.nftContract,
                    tokenId: raffle.tokenId.toString(),
                    creator: raffle.creator,
                    ticketPrice: (Number(raffle.ticketPrice) / 1e18).toString(),
                    maxTickets,
                    ticketsSold,
                    endTime,
                    winner: raffle.winner || undefined,
                    completed: raffle.completed,
                    isActive,
                    version: factory.version,
                    // PHASE 2: Add stable sort key
                    sortKey: `${factory.version}-${i}`,
                  };
                }
                
                return null;
              } catch (err) {
                console.warn(`Failed to process raffle ${i}:`, err);
                return null;
              }
            },
            batchConfig
          );
          
          // Filter valid results
          return batchResults.filter(result => result !== null);
          
        } catch (error) {
          console.error(`Failed to scan factory ${factory.address}:`, error);
          return [];
        }
      });
      
      // PHASE 2: Wait for ALL factories to complete in parallel (deterministic)
      const factoryResults = await Promise.all(factoryPromises);
      
      // Combine all results
      const allCreatedRaffles = factoryResults.flat();
      
      // DEDUPLICATION: Remove any duplicate raffles based on contract address + raffle ID
      const deduplicationMap = new Map<string, any>();
      const duplicatesFound: string[] = [];
      
      for (const raffle of allCreatedRaffles) {
        const key = `${raffle.raffleContract}-${raffle.raffleId}`;
        if (deduplicationMap.has(key)) {
          duplicatesFound.push(key);
        } else {
          deduplicationMap.set(key, raffle);
        }
      }
      
      if (duplicatesFound.length > 0) {
        console.warn(`⚠️ [CREATED-RAFFLES] Removed ${duplicatesFound.length} duplicate raffles:`, duplicatesFound.slice(0, 5));
      }
      
      const uniqueCreatedRaffles = Array.from(deduplicationMap.values());
      
      // PHASE 2: STABLE DETERMINISTIC SORTING
      const sortedRaffles = uniqueCreatedRaffles.sort((a, b) => {
        // Primary sort: endTime (newest first)
        if (a.endTime !== b.endTime) {
          return b.endTime - a.endTime;
        }
        // Secondary sort: version (v4 first)
        if (a.version !== b.version) {
          return a.version === 'v4' ? -1 : 1;
        }
        // Tertiary sort: raffleId (highest first)
        return b.raffleId - a.raffleId;
      });
      
      console.log(`📊 [CREATED-RAFFLES] Found ${uniqueCreatedRaffles.length} unique created raffles (${allCreatedRaffles.length} total before deduplication)`);
      console.log('🔍 [CREATED-RAFFLES-DEBUG]', {
        resolvedAddress,
        chainId,
        factoryCount: factories.length,
        totalResults: allCreatedRaffles.length,
        uniqueResults: uniqueCreatedRaffles.length,
        sortedResults: sortedRaffles.length,
        duplicatesRemoved: duplicatesFound.length,
        raffleDetails: sortedRaffles.map(r => ({
          raffleId: r.raffleId,
          creator: r.creator,
          version: r.version,
          endTime: r.endTime
        }))
      });
      return sortedRaffles;
    },
    // WEB3 BEST PRACTICE: Multi-condition enabled check
    enabled: Boolean(
      resolvedAddress && 
      chainId && 
      isConnected && 
      !isConnecting &&
      publicClient
    ),
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    // PHASE 3: Enhanced error handling and retry logic
    retry: (failureCount, error) => {
      // Don't retry on wallet disconnection
      if (error?.message?.includes('Missing required parameters')) {
        return false;
      }
      // Polygon gets more retries due to network instability
      const maxRetries = chainId === 137 ? 3 : 2;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => {
      // Progressive backoff, longer delays for Polygon
      const baseDelay = chainId === 137 ? 2000 : 1000;
      return Math.min(baseDelay * Math.pow(2, attemptIndex), 10000);
    },
    // PHASE 3: Prevent background refetches during user interaction
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  return {
    raffles: createdRaffles || [],
    loading: loading || isConnecting,
    error,
    refetch,
    // Infinite query compatibility (simplified)
    fetchNextPage: () => Promise.resolve(),
    hasNextPage: false,
    isFetchingNextPage: false,
    pageCount: 1,
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