/**
 * Network-Aware Raffle Position Hooks
 * Uses chainId to get correct contracts per network
 */

import { usePublicClient, useReadContract, useChainId } from 'wagmi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getRaffleFactoryAddress } from '../config/addresses';
import { RAFFLE_FACTORY_ABI } from '../config/contracts';
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

// Network-aware cache instances
const raffleCache = new OptimizedCache<CreatedRaffle[]>(2 * 1024 * 1024, 100, 60000);
const positionCache = new OptimizedCache<UserRafflePosition[]>(1024 * 1024, 50, 30000);

// Get user's raffle positions (network-aware)
export function useUserRafflePositions(userAddress?: string) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [positions, setPositions] = useState<UserRafflePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const factoryAddress = getRaffleFactoryAddress(chainId, true);

  const { data: raffleCount } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });

  const loadPositions = useCallback(async () => {
    if (!publicClient || !userAddress || !raffleCount) return;

    const cacheKey = `user_positions_${chainId}_${userAddress}_${raffleCount}`;
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
      const startIndex = Math.max(0, totalRaffles - 25);
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
          });
        }
      }

      const sortedPositions = userPositions.reverse();
      setPositions(sortedPositions);
      positionCache.set(cacheKey, sortedPositions);
    } catch (err) {
      console.error('Failed to load user positions:', err);
      setError('Failed to load user positions');
    } finally {
      setLoading(false);
    }
  }, [publicClient, userAddress, raffleCount, chainId, factoryAddress]);

  const debouncedLoadPositions = useMemo(
    () => debounce(loadPositions, 300),
    [loadPositions]
  );

  useEffect(() => {
    debouncedLoadPositions();
  }, [debouncedLoadPositions]);

  return { positions, loading, error, refetch: loadPositions };
}

// Get user's created raffles (network-aware)
export function useCreatedRaffles(userAddress?: string, page: number = 0) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const factoryAddress = getRaffleFactoryAddress(chainId, true);

  const { data: raffleCount } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: RAFFLE_FACTORY_ABI,
    functionName: 'raffleCounter',
  });

  const loadCreatedRaffles = useCallback(async () => {
    if (!publicClient || !userAddress || !raffleCount) return;

    const cacheKey = `created_raffles_${chainId}_${userAddress}_${raffleCount}`;
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
      const startIndex = Math.max(0, totalRaffles - 30);
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
        4,
        20
      );
      
      for (const result of batchResults) {
        if (!result) continue;
        const { i, raffleContract, raffle } = result;

        if (raffle.creator.toLowerCase() === userAddress.toLowerCase()) {
          const now = Date.now() / 1000;
          const endTime = Number(raffle.endTime);
          const isSoldOut = Number(raffle.ticketsSold) >= Number(raffle.maxTickets);
          const isActive = now < endTime && !raffle.completed && !isSoldOut;

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

      const sortedRaffles = createdRaffles.reverse();
      setRaffles(sortedRaffles);
      raffleCache.set(cacheKey, sortedRaffles);
      
    } catch (err) {
      console.error('Failed to load created raffles:', err);
      setError('Failed to load created raffles');
    } finally {
      setLoading(false);
    }
  }, [publicClient, userAddress, raffleCount, chainId, factoryAddress]);

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
    console.log('Network-aware raffle caches cleared');
  }, []);
}