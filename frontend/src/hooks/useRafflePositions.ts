/**
 * Raffle Position Hooks
 * Professional wagmi hooks for raffle position management
 */

import { usePublicClient, useReadContract } from 'wagmi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI } from '../config/contracts';
import { processBatch, OptimizedCache, debounce } from '../utils/performance';

interface CreatedRaffle {
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
}

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
}

// Optimized cache instances
const raffleCache = new OptimizedCache<CreatedRaffle[]>(2 * 1024 * 1024, 100, 60000); // 2MB, 100 items, 1min TTL
const positionCache = new OptimizedCache<UserRafflePosition[]>(1024 * 1024, 50, 30000); // 1MB, 50 items, 30s TTL

// Get all raffles with performance optimizations
export function useAllRaffles(limit: number = 20, offset: number = 0) {
  const publicClient = usePublicClient();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: raffleCount } = useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });

  const loadRaffles = useCallback(async () => {
    if (!publicClient || !raffleCount) return;

    const cacheKey = `all_raffles_${limit}_${offset}_${raffleCount}`;
    const cached = raffleCache.get(cacheKey);
    if (cached) {
      setRaffles(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const totalRaffles = Number(raffleCount);
      const startIndex = Math.max(0, totalRaffles - offset - limit);
      const endIndex = Math.max(0, totalRaffles - offset);
      
      // Batch process raffle contracts (5 at a time)
      const indices = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);
      const raffleContracts = await processBatch(
        indices,
        (i) => publicClient.readContract({
          address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
          abi: RAFFLE_FACTORY_ABI,
          functionName: 'getRaffleContract',
          args: [BigInt(i)],
        }),
        5,
        10 // 10ms delay between batches
      );
      
      // Batch process raffle info (3 at a time for better performance)
      const raffleInfos = await processBatch(
        raffleContracts,
        (contract: any) => publicClient.readContract({
          address: contract as `0x${string}`,
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
        3,
        20 // 20ms delay between batches
      );
      
      const processedRaffles: CreatedRaffle[] = raffleInfos.map((result: any, index) => {
        const now = Date.now() / 1000;
        const endTime = Number(result.endTime);
        const isActive = now < endTime;
        
        return {
          raffleId: startIndex + index,
          raffleContract: raffleContracts[index] as string,
          nftContract: result.nftContract,
          tokenId: result.tokenId.toString(),
          creator: result.creator,
          ticketPrice: (Number(result.ticketPrice) / 1e18).toString(),
          maxTickets: Number(result.maxTickets),
          ticketsSold: Number(result.ticketsSold),
          endTime,
          winner: result.winner,
          completed: result.completed,
          isActive,
        };
      }).reverse(); // Show newest first

      setRaffles(processedRaffles);
      raffleCache.set(cacheKey, processedRaffles);
    } catch (err) {
      console.error('Failed to load raffles:', err);
      setError('Failed to load raffles');
    } finally {
      setLoading(false);
    }
  }, [publicClient, raffleCount, limit, offset]);

  // Debounced version to prevent excessive calls
  const debouncedLoadRaffles = useMemo(
    () => debounce(loadRaffles, 300),
    [loadRaffles]
  );

  useEffect(() => {
    debouncedLoadRaffles();
  }, [debouncedLoadRaffles]);

  return { raffles, loading, error, refetch: loadRaffles };
}

// Get user's raffle positions
export function useUserRafflePositions(userAddress?: string) {
  const publicClient = usePublicClient();
  const [positions, setPositions] = useState<UserRafflePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: raffleCount } = useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });

  const loadPositions = useCallback(async () => {
    if (!publicClient || !userAddress || !raffleCount) return;

    // Check optimized cache first
    const cacheKey = `user_positions_${userAddress}_${raffleCount}`;
    const cached = positionCache.get(cacheKey);
    if (cached) {
      setPositions(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const totalRaffles = Number(raffleCount);
      const userPositions: UserRafflePosition[] = [];

      // Reduced to last 25 raffles for faster loading
      const startIndex = Math.max(0, totalRaffles - 25);
      const indices = Array.from({ length: totalRaffles - startIndex }, (_, i) => startIndex + i);
      
      // Optimized batch processing with smaller batches
      const batchResults = await processBatch(
        indices,
        async (i) => {
          try {
            const raffleContract = await publicClient.readContract({
              address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
              abi: RAFFLE_FACTORY_ABI,
              functionName: 'getRaffleContract',
              args: [BigInt(i)],
            });
            
            // Parallel calls for raffle info and user tickets
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
                abi: [
                  {
                    inputs: [{ name: 'user', type: 'address' }],
                    name: 'ticketsPurchased',
                    outputs: [{ name: '', type: 'uint256' }],
                    stateMutability: 'view',
                    type: 'function',
                  },
                ],
                functionName: 'ticketsPurchased',
                args: [userAddress as `0x${string}`],
              })
            ]);
            
            return { i, raffleContract, raffle, userTickets };
          } catch (err) {
            return null;
          }
        },
        3, // Smaller batch size for better performance
        25 // 25ms delay between batches
      );
      
      // Process results efficiently
      for (const result of batchResults) {
        if (!result) continue;
        const { i, raffleContract, raffle, userTickets } = result;

        if (Number(userTickets) > 0) {
          const now = Date.now() / 1000;
          const endTime = Number(raffle.endTime);
          const isActive = now < endTime;
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
          });
        }
      }

      const sortedPositions = userPositions.reverse(); // Show newest first
      setPositions(sortedPositions);
      positionCache.set(cacheKey, sortedPositions);
    } catch (err) {
      console.error('Failed to load user positions:', err);
      setError('Failed to load user positions');
    } finally {
      setLoading(false);
    }
  }, [publicClient, userAddress, raffleCount]);

  // Debounced version to prevent excessive calls
  const debouncedLoadPositions = useMemo(
    () => debounce(loadPositions, 300),
    [loadPositions]
  );

  useEffect(() => {
    debouncedLoadPositions();
  }, [debouncedLoadPositions]);

  return { positions, loading, error, refetch: loadPositions };
}

// Get user's created raffles with performance optimizations
export function useCreatedRaffles(userAddress?: string, page: number = 0) {
  const publicClient = usePublicClient();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: raffleCount } = useReadContract({
    address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });

  const loadCreatedRaffles = useCallback(async () => {
    if (!publicClient || !userAddress || !raffleCount) return;

    // Check optimized cache first
    const cacheKey = `created_raffles_${userAddress}_${raffleCount}`;
    const cached = raffleCache.get(cacheKey);
    if (cached) {
      setRaffles(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const totalRaffles = Number(raffleCount);
      const createdRaffles: CreatedRaffle[] = [];
      
      // Reduced to last 30 raffles for faster loading
      const startIndex = Math.max(0, totalRaffles - 30);
      const indices = Array.from({ length: totalRaffles - startIndex }, (_, i) => startIndex + i);
      
      // Optimized batch processing
      const batchResults = await processBatch(
        indices,
        async (i) => {
          try {
            const raffleContract = await publicClient.readContract({
              address: RAFFLE_FACTORY_ADDRESS as `0x${string}`,
              abi: RAFFLE_FACTORY_ABI,
              functionName: 'getRaffleContract',
              args: [BigInt(i)],
            });
            
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

            return { i, raffleContract, raffle };
          } catch {
            return null;
          }
        },
        4, // Smaller batch size
        20 // 20ms delay between batches
      );
      
      // Process results efficiently
      for (const result of batchResults) {
        if (!result) continue;
        const { i, raffleContract, raffle } = result;

        if (raffle.creator.toLowerCase() === userAddress.toLowerCase()) {
          const now = Date.now() / 1000;
          const endTime = Number(raffle.endTime);
          const isActive = now < endTime;

          createdRaffles.push({
            raffleId: i,
            raffleContract: raffleContract as string,
            nftContract: raffle.nftContract,
            tokenId: raffle.tokenId.toString(),
            creator: raffle.creator,
            ticketPrice: (Number(raffle.ticketPrice) / 1e18).toString(),
            maxTickets: Number(raffle.maxTickets),
            ticketsSold: Number(raffle.ticketsSold),
            endTime,
            winner: raffle.winner,
            completed: raffle.completed,
            isActive,
          });
        }
      }

      const sortedRaffles = createdRaffles.reverse(); // Show newest first
      setRaffles(sortedRaffles);
      raffleCache.set(cacheKey, sortedRaffles);
      
    } catch (err) {
      console.error('Failed to load created raffles:', err);
      setError('Failed to load created raffles');
    } finally {
      setLoading(false);
    }
  }, [publicClient, userAddress, raffleCount]);

  // Debounced version to prevent excessive calls
  const debouncedLoadCreatedRaffles = useMemo(
    () => debounce(loadCreatedRaffles, 300),
    [loadCreatedRaffles]
  );

  useEffect(() => {
    debouncedLoadCreatedRaffles();
  }, [debouncedLoadCreatedRaffles]);

  return { raffles, loading, error, refetch: loadCreatedRaffles };
}

// Clear cache utility
export function useClearRaffleCache() {
  return useCallback(() => {
    raffleCache.clear();
    positionCache.clear();
    console.log('Raffle caches cleared');
  }, []);
}