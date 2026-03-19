/**
 * V4-Aware Raffle Position Hooks
 * Combines raffles from both V3 and V4 contracts
 */

import { usePublicClient, useChainId } from 'wagmi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRaffleDataFetcher, RaffleInfo } from './useRaffleDataFetcher';
import { useRaffleCacheManager, UserRafflePosition } from './useRaffleCacheManager';
import { getRaffleFactoryAddress, isV4Available } from '../config/addresses';
import { RAFFLE_FACTORY_ABI } from '../config/contracts';
import { processBatch, debounce } from '../utils/performance';

// Type aliases for backward compatibility
export interface CreatedRaffle extends RaffleInfo {}

// Get all raffles from both V3 and V4
export function useAllRafflesV4(limit: number = 20, offset: number = 0) {
  const dataFetcher = useRaffleDataFetcher();
  const { raffleCache } = useRaffleCacheManager();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRaffles = useCallback(async () => {
    if (!dataFetcher.isReady) return;

    // Check cache first
    const cached = raffleCache.get({ limit, offset });
    if (cached) {
      setRaffles(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedRaffles = await dataFetcher.fetchAllRaffles({ limit, offset });
      setRaffles(fetchedRaffles);
      raffleCache.set({ limit, offset }, fetchedRaffles);
    } catch (err) {
      console.error('Failed to load raffles:', err);
      setError('Failed to load raffles');
    } finally {
      setLoading(false);
    }
  }, [dataFetcher, raffleCache, limit, offset]);

  const debouncedLoadRaffles = useMemo(
    () => debounce(loadRaffles, 300),
    [loadRaffles]
  );

  useEffect(() => {
    debouncedLoadRaffles();
  }, [debouncedLoadRaffles]);

  return { raffles, loading, error, refetch: loadRaffles };
}

// Clear cache utility - more aggressive clearing
export function useClearRaffleCacheV4() {
  const { clearAllCaches } = useRaffleCacheManager();
  return clearAllCaches;
}
// Get user's raffle positions (network-aware)
export function useUserRafflePositionsV4(userAddress?: string) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { positionCache } = useRaffleCacheManager();
  const [positions, setPositions] = useState<UserRafflePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    if (!publicClient || !userAddress || !chainId) return;

    // Check cache first
    const cached = positionCache.get({ userAddress, chainId });
    if (cached) {
      setPositions(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allPositions: UserRafflePosition[] = [];
      
      // Get positions from V4 factory if available
      if (isV4Available(chainId)) {
        const v4Address = getRaffleFactoryAddress(chainId, true);
        const v4Positions = await getUserPositionsFromFactory(publicClient, v4Address, userAddress, 'v4');
        allPositions.push(...v4Positions);
      }
      
      // Get positions from V3 factory
      const v3Address = getRaffleFactoryAddress(chainId, false);
      const v3Positions = await getUserPositionsFromFactory(publicClient, v3Address, userAddress, 'v3');
      allPositions.push(...v3Positions);
      
      // Remove duplicates and sort by end time (newest first)
      const uniquePositions = allPositions.filter((position, index, self) => 
        index === self.findIndex(p => p.raffleContract === position.raffleContract)
      );
      
      const sortedPositions = uniquePositions.sort((a, b) => b.endTime - a.endTime);
      
      setPositions(sortedPositions);
      positionCache.set({ userAddress, chainId }, sortedPositions);
    } catch (err) {
      console.error('Failed to load user positions:', err);
      setError('Failed to load user positions');
    } finally {
      setLoading(false);
    }
  }, [publicClient, userAddress, chainId, positionCache]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  return { positions, loading, error, refetch: loadPositions };
}

// Helper function to get user positions from a specific factory
async function getUserPositionsFromFactory(
  publicClient: any,
  factoryAddress: string,
  userAddress: string,
  version: 'v3' | 'v4'
): Promise<UserRafflePosition[]> {
  try {
    const raffleCount = await publicClient.readContract({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'raffleCounter',
    });

    const totalRaffles = Number(raffleCount);
    if (totalRaffles === 0) return [];

    const userPositions: UserRafflePosition[] = [];
    const startIndex = Math.max(0, totalRaffles - 50); // Check last 50 raffles
    const indices = Array.from({ length: totalRaffles - startIndex }, (_, i) => startIndex + i);
    
    const batchResults = await processBatch(
      indices,
      async (i) => {
        try {
          const raffleContract = await publicClient.readContract({
            address: factoryAddress as `0x${string}`,
            abi: RAFFLE_FACTORY_ABI,
            functionName: 'getRaffleContract',
            args: [BigInt(i)],
          });
          
          const [raffle, userTickets] = await Promise.all([
            publicClient.readContract({
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
            }),
            publicClient.readContract({
              address: raffleContract as `0x${string}`,
              abi: [{
                inputs: [{ name: 'user', type: 'address' }],
                name: 'ticketsPurchased',
                outputs: [{ name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
              }],
              functionName: 'ticketsPurchased',
              args: [userAddress as `0x${string}`],
            })
          ]);
          
          return { i, raffleContract, raffle, userTickets };
        } catch (err) {
          return null;
        }
      },
      3,
      25
    );
    
    for (const result of batchResults) {
      if (!result) continue;
      const { i, raffleContract, raffle, userTickets } = result;

      if (Number(userTickets) > 0) {
        const now = Date.now() / 1000;
        const endTime = Number(raffle.endTime);
        const isSoldOut = Number(raffle.ticketsSold) >= Number(raffle.maxTickets);
        const isActive = now < endTime && !raffle.completed && !isSoldOut;
        const isWinner = raffle.winner?.toLowerCase() === userAddress.toLowerCase();
        const winProbability = (Number(userTickets) / Number(raffle.maxTickets)) * 100;

        userPositions.push({
          raffleId: i,
          raffleContract: raffleContract as string,
          nftContract: raffle.nftContract,
          tokenId: raffle.tokenId.toString(),
          userTickets: Number(userTickets),
          ticketsSold: Number(raffle.ticketsSold),
          maxTickets: Number(raffle.maxTickets),
          endTime,
          completed: raffle.completed,
          isActive,
          isWinner,
          winProbability,
          version,
        });
      }
    }

    return userPositions;
  } catch (error) {
    console.error(`Failed to get user positions from factory ${factoryAddress}:`, error);
    return [];
  }
}

// Get user's created raffles (network-aware)
export function useCreatedRafflesV4(userAddress?: string, page: number = 0) {
  const dataFetcher = useRaffleDataFetcher();
  const { createdCache } = useRaffleCacheManager();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCreatedRaffles = useCallback(async () => {
    if (!dataFetcher.isReady || !userAddress) return;

    // Check cache first
    const cached = createdCache.get({ userAddress, page });
    if (cached) {
      setRaffles(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch more raffles to filter by creator
      const allRaffles = await dataFetcher.fetchAllRaffles({ 
        limit: 50, 
        offset: page * 20 
      });
      
      // Filter by creator and sort by creation time (newest first)
      const createdRaffles = allRaffles
        .filter(r => r.creator.toLowerCase() === userAddress.toLowerCase())
        .sort((a, b) => b.endTime - a.endTime);
      
      setRaffles(createdRaffles);
      createdCache.set({ userAddress, page }, createdRaffles);
    } catch (err) {
      console.error('Failed to load created raffles:', err);
      setError('Failed to load created raffles');
    } finally {
      setLoading(false);
    }
  }, [dataFetcher, createdCache, userAddress, page]);

  useEffect(() => {
    loadCreatedRaffles();
  }, [loadCreatedRaffles]);

  return { raffles, loading, error, refetch: loadCreatedRaffles };
}