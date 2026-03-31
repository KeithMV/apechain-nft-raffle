/**
 * Unified Raffle Data Hook
 * Replaces multiple scattered hooks with single, optimized implementation
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useChainId, useAccount, usePublicClient } from 'wagmi';
import { useMemo, useCallback } from 'react';
import { getChainConfig } from '../config/addresses';
import { RAFFLE_FACTORY_ABI } from '../config/contracts';

export interface RaffleData {
  raffleId: number;
  raffleContract: string;
  nftContract: string;
  tokenId: string;
  creator: string;
  ticketPrice: string;
  maxTickets: number;
  ticketsSold: number;
  endTime: number;
  winner?: string;
  completed: boolean;
  isActive: boolean;
  userTickets?: number;
  isWinner?: boolean; // For participated raffles
}

export interface UseRaffleDataOptions {
  type: 'all' | 'created' | 'participated';
  infinite?: boolean;
  limit?: number;
  userAddress?: string;
}

export function useRaffleData(options: UseRaffleDataOptions) {
  const { type, infinite = false, limit = 20, userAddress } = options;
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  // Get chain configuration
  const chainConfig = getChainConfig(chainId);
  
  // Resolve user address
  const resolvedAddress = useMemo(() => {
    if (type === 'all') return undefined;
    return userAddress || address;
  }, [type, userAddress, address]);
  
  // Optimize limits based on chain - Using free Polygon RPC with higher limits
  const optimizedLimit = useMemo(() => {
    return chainId === 137 ? Math.min(limit, 10) : Math.min(limit, 20); // Increased limits
  }, [chainId, limit]);
  
  // Cache configuration - Balanced for free Polygon RPC
  const cacheConfig = useMemo(() => ({
    staleTime: chainId === 137 ? 60000 : 2 * 60 * 1000, // 1-2 minutes
    gcTime: chainId === 137 ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5-10 minutes
    retry: 1, // Allow 1 retry
    retryDelay: 5000, // 5s delay
    refetchOnWindowFocus: false, // Keep disabled to be safe
    refetchOnMount: false,
  }), [chainId]);
  
  // Fetch function
  const fetchRaffles = useCallback(async (pageParam = 0): Promise<RaffleData[]> => {
    if (!publicClient || !chainId) {
      throw new Error('Client not ready');
    }
    
    try {
      // Get total raffle count
      const raffleCount = await publicClient.readContract({
        address: chainConfig.factory as `0x${string}`,
        abi: RAFFLE_FACTORY_ABI,
        functionName: 'raffleCounter',
      });

      const totalRaffles = Number(raffleCount);
      if (totalRaffles === 0) return [];

      // Calculate range
      const offset = pageParam * optimizedLimit;
      const startIndex = Math.max(0, totalRaffles - offset - optimizedLimit);
      const endIndex = Math.max(0, totalRaffles - offset);
      
      const indices = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);
      
      // Batch process with reasonable settings for free Polygon RPC
      const batchSize = chainId === 137 ? 2 : 3; // Moderate batching
      const delay = chainId === 137 ? 500 : 200; // Reasonable delays
      
      const results: RaffleData[] = [];
      
      for (let i = 0; i < indices.length; i += batchSize) {
        const batch = indices.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (index) => {
          try {
            // Get raffle contract
            const raffleContract = await publicClient.readContract({
              address: chainConfig.factory as `0x${string}`,
              abi: RAFFLE_FACTORY_ABI,
              functionName: 'getRaffleContract',
              args: [BigInt(index)],
            });
            
            // Get raffle info
            const raffleInfo = await publicClient.readContract({
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
            
            // Filter based on type
            if (type === 'created' && resolvedAddress) {
              if (raffleInfo.creator.toLowerCase() !== resolvedAddress.toLowerCase()) {
                return null;
              }
            }
            
            // Get user tickets if needed
            let userTickets = 0;
            if ((type === 'participated' || type === 'all') && resolvedAddress) {
              try {
                const tickets = await publicClient.readContract({
                  address: raffleContract as `0x${string}`,
                  abi: [{
                    inputs: [{ name: 'user', type: 'address' }],
                    name: 'ticketsPurchased',
                    outputs: [{ name: '', type: 'uint256' }],
                    stateMutability: 'view',
                    type: 'function',
                  }],
                  functionName: 'ticketsPurchased',
                  args: [resolvedAddress as `0x${string}`],
                });
                userTickets = Number(tickets);
              } catch {
                userTickets = 0;
              }
            }
            
            // Filter participated raffles
            if (type === 'participated' && userTickets === 0) {
              return null;
            }
            
            // Build raffle data
            const now = Date.now() / 1000;
            const endTime = Number(raffleInfo.endTime);
            const ticketsSold = Number(raffleInfo.ticketsSold);
            const maxTickets = Number(raffleInfo.maxTickets);
            const isSoldOut = ticketsSold >= maxTickets;
            const isActive = now < endTime && !raffleInfo.completed && !isSoldOut;
            
            // Check if user is winner (for participated raffles)
            const isWinner = type === 'participated' && resolvedAddress && 
              raffleInfo.winner && raffleInfo.winner.toLowerCase() === resolvedAddress.toLowerCase();
            
            return {
              raffleId: index,
              raffleContract: raffleContract as string,
              nftContract: raffleInfo.nftContract,
              tokenId: raffleInfo.tokenId.toString(),
              creator: raffleInfo.creator,
              ticketPrice: (Number(raffleInfo.ticketPrice) / 1e18).toString(),
              maxTickets,
              ticketsSold,
              endTime,
              winner: raffleInfo.winner || undefined,
              completed: raffleInfo.completed,
              isActive,
              userTickets: userTickets > 0 ? userTickets : undefined,
              isWinner: isWinner || undefined,
            };
          } catch (error) {
            console.warn(`Failed to process raffle ${index}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(result => result !== null) as RaffleData[];
        results.push(...validResults);
        
        // Delay between batches
        if (i + batchSize < indices.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Sort by end time (newest first)
      return results.sort((a, b) => b.endTime - a.endTime);
      
    } catch (error) {
      console.error('Failed to fetch raffles:', error);
      throw error;
    }
  }, [publicClient, chainId, chainConfig, optimizedLimit, type, resolvedAddress]);
  
  // Query key
  const queryKey = useMemo(() => [
    'raffles-unified',
    chainId,
    type,
    resolvedAddress?.toLowerCase() || 'anonymous',
    optimizedLimit
  ], [chainId, type, resolvedAddress, optimizedLimit]);
  
  // Infinite query
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...queryKey, 'infinite'],
    queryFn: ({ pageParam }) => fetchRaffles(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < optimizedLimit) return undefined;
      return allPages.length;
    },
    enabled: Boolean(publicClient && chainId && (type === 'all' || (resolvedAddress && isConnected))),
    ...cacheConfig,
    maxPages: chainId === 137 ? 3 : 5, // Reasonable limits
  });
  
  // Regular query
  const regularQuery = useQuery({
    queryKey,
    queryFn: () => fetchRaffles(0),
    enabled: Boolean(publicClient && chainId && (type === 'all' || (resolvedAddress && isConnected))),
    ...cacheConfig,
  });
  
  // Return appropriate query
  const allRaffles = useMemo(() => {
    if (infinite && infiniteQuery.data?.pages) {
      return infiniteQuery.data.pages.flat();
    }
    return [];
  }, [infinite, infiniteQuery.data?.pages]);
  
  if (infinite) {
    return {
      raffles: allRaffles,
      loading: infiniteQuery.isLoading,
      error: infiniteQuery.error,
      refetch: infiniteQuery.refetch,
      fetchNextPage: infiniteQuery.fetchNextPage,
      hasNextPage: infiniteQuery.hasNextPage,
      isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    };
  }
  
  return {
    raffles: regularQuery.data || [],
    loading: regularQuery.isLoading,
    error: regularQuery.error,
    refetch: regularQuery.refetch,
  };
}

// Convenience hooks
export const useAllRaffles = (options?: Omit<UseRaffleDataOptions, 'type'>) => 
  useRaffleData({ ...options, type: 'all' });

export const useCreatedRaffles = (userAddress?: string, options?: Omit<UseRaffleDataOptions, 'type' | 'userAddress'>) => 
  useRaffleData({ ...options, type: 'created', userAddress });

export const useParticipatedRaffles = (userAddress?: string, options?: Omit<UseRaffleDataOptions, 'type' | 'userAddress'>) => 
  useRaffleData({ ...options, type: 'participated', userAddress });