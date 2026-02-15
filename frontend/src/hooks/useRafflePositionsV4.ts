/**
 * V4-Aware Raffle Position Hooks
 * Combines raffles from both V3 and V4 contracts
 */

import { usePublicClient, useReadContract, useChainId } from 'wagmi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getRaffleFactoryAddress, isV4Available } from '../config/addresses';
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
  version: 'v3' | 'v4'; // Track which version
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
  version: 'v3' | 'v4';
}

// Optimized cache instances
const raffleCache = new OptimizedCache<CreatedRaffle[]>(2 * 1024 * 1024, 100, 60000);
const positionCache = new OptimizedCache<UserRafflePosition[]>(1024 * 1024, 50, 30000);

// Get raffles from a specific factory version
async function getRafflesFromFactory(
  publicClient: any,
  factoryAddress: string,
  version: 'v3' | 'v4',
  limit: number = 20,
  offset: number = 0
): Promise<CreatedRaffle[]> {
  try {
    const raffleCount = await publicClient.readContract({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'raffleCounter',
    });

    const totalRaffles = Number(raffleCount);
    if (totalRaffles === 0) return [];

    const startIndex = Math.max(0, totalRaffles - offset - limit);
    const endIndex = Math.max(0, totalRaffles - offset);
    
    const indices = Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);
    
    // Get raffle contracts with proper index tracking
    const contractResults = await processBatch(
      indices,
      async (i) => {
        try {
          const contract = await publicClient.readContract({
            address: factoryAddress as `0x${string}`,
            abi: RAFFLE_FACTORY_ABI,
            functionName: 'getRaffleContract',
            args: [BigInt(i)],
          });
          return { index: i, contract };
        } catch (error) {
          return { index: i, contract: null };
        }
      },
      5,
      10
    );
    
    // Filter out failed contracts while maintaining index mapping
    const validContractResults = contractResults.filter(result => result.contract !== null);
    
    // Get raffle info with error handling
    const raffleInfoResults = await processBatch(
      validContractResults,
      async (contractResult: any) => {
        try {
          const raffleInfo = await publicClient.readContract({
            address: contractResult.contract as `0x${string}`,
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
          return { ...contractResult, raffleInfo };
        } catch (error) {
          return { ...contractResult, raffleInfo: null };
        }
      },
      3,
      20
    );
    
    // Process valid results with correct index mapping
    const validRaffles: CreatedRaffle[] = [];
    
    raffleInfoResults.forEach((result: any) => {
      if (!result.raffleInfo) return;
      
      try {
        const now = Date.now() / 1000;
        const endTime = Number(result.raffleInfo.endTime);
        const isSoldOut = Number(result.raffleInfo.ticketsSold) >= Number(result.raffleInfo.maxTickets);
        const isActive = now < endTime && !result.raffleInfo.completed && !isSoldOut;
        
        validRaffles.push({
          raffleId: result.index,
          raffleContract: result.contract as string,
          nftContract: result.raffleInfo.nftContract,
          tokenId: result.raffleInfo.tokenId.toString(),
          creator: result.raffleInfo.creator,
          ticketPrice: (Number(result.raffleInfo.ticketPrice) / 1e18).toString(),
          maxTickets: Number(result.raffleInfo.maxTickets),
          ticketsSold: Number(result.raffleInfo.ticketsSold),
          endTime,
          winner: result.raffleInfo.winner || undefined,
          completed: result.raffleInfo.completed,
          isActive,
          version,
        });
      } catch (error) {
        // Silent fail for individual raffle processing
      }
    });
    
    return validRaffles;
  } catch (error) {
    console.error(`Failed to get raffles from factory ${factoryAddress}:`, error);
    throw new Error(`Failed to load ${version} raffles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get all raffles from both V3 and V4
export function useAllRafflesV4(limit: number = 20, offset: number = 0) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRaffles = useCallback(async () => {
    if (!publicClient || !chainId) return;

    setLoading(true);
    setError(null);

    try {
      const allRaffles: CreatedRaffle[] = [];
      
      // Get V4 raffles first (priority)
      if (isV4Available(chainId)) {
        const v4Address = getRaffleFactoryAddress(chainId, true);
        const v4Raffles = await getRafflesFromFactory(publicClient, v4Address, 'v4', limit, offset);
        allRaffles.push(...v4Raffles);
      }
      
      // Only get V3 raffles if we don't have enough V4 raffles
      if (allRaffles.length < limit) {
        const v3Address = getRaffleFactoryAddress(chainId, false);
        const remainingLimit = limit - allRaffles.length;
        const v3Raffles = await getRafflesFromFactory(publicClient, v3Address, 'v3', remainingLimit, offset);
        allRaffles.push(...v3Raffles);
      }
      
      // Remove duplicates based on unique contract address + raffle ID combination
      const uniqueRaffles = allRaffles.filter((raffle, index, self) => 
        index === self.findIndex(r => 
          r.raffleContract === raffle.raffleContract && 
          r.raffleId === raffle.raffleId
        )
      );
      
      // Sort by creation time (newest first) and limit results
      const sortedRaffles = uniqueRaffles
        .sort((a, b) => b.endTime - a.endTime)
        .slice(0, limit);

      setRaffles(sortedRaffles);
      
      // Cache with timestamp to ensure freshness
      const cacheKey = `all_raffles_v4_${limit}_${offset}_${Date.now()}`;
      raffleCache.set(cacheKey, sortedRaffles);
    } catch (err) {
      console.error('Failed to load raffles:', err);
      setError('Failed to load raffles');
    } finally {
      setLoading(false);
    }
  }, [publicClient, chainId, limit, offset]);

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
  return useCallback(() => {
    raffleCache.clear();
    positionCache.clear();
    // Force reload by clearing localStorage cache if any
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('raffle') || key.includes('cache')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);
}
// Get user's raffle positions (network-aware)
export function useUserRafflePositionsV4(userAddress?: string) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [positions, setPositions] = useState<UserRafflePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    if (!publicClient || !userAddress || !chainId) return;

    setLoading(true);
    setError(null);

    try {
      const allPositions: UserRafflePosition[] = [];
      
      // Get positions from current network's factory
      const factoryAddress = getRaffleFactoryAddress(chainId, true);
      // Simple implementation - just return empty for now
      
      setPositions(allPositions);
    } catch (err) {
      console.error('Failed to load user positions:', err);
      setError('Failed to load user positions');
    } finally {
      setLoading(false);
    }
  }, [publicClient, userAddress, chainId]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  return { positions, loading, error, refetch: loadPositions };
}

// Get user's created raffles (network-aware)
export function useCreatedRafflesV4(userAddress?: string, page: number = 0) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCreatedRaffles = useCallback(async () => {
    if (!publicClient || !userAddress || !chainId) return;

    setLoading(true);
    setError(null);

    try {
      const allRaffles: CreatedRaffle[] = [];
      
      // Get V4 raffles first
      if (isV4Available(chainId)) {
        const v4Address = getRaffleFactoryAddress(chainId, true);
        const v4Raffles = await getRafflesFromFactory(publicClient, v4Address, 'v4', 50, page * 20);
        allRaffles.push(...v4Raffles.filter(r => r.creator.toLowerCase() === userAddress.toLowerCase()));
      }
      
      // Get V3 raffles
      const v3Address = getRaffleFactoryAddress(chainId, false);
      const v3Raffles = await getRafflesFromFactory(publicClient, v3Address, 'v3', 50, page * 20);
      allRaffles.push(...v3Raffles.filter(r => r.creator.toLowerCase() === userAddress.toLowerCase()));
      
      // Remove duplicates based on unique contract address
      const uniqueRaffles = allRaffles.filter((raffle, index, self) => 
        index === self.findIndex(r => r.raffleContract === raffle.raffleContract)
      );
      
      // Sort by creation time (newest first)
      const sortedRaffles = uniqueRaffles.sort((a, b) => b.endTime - a.endTime);
      
      setRaffles(sortedRaffles);
    } catch (err) {
      console.error('Failed to load created raffles:', err);
      setError('Failed to load created raffles');
    } finally {
      setLoading(false);
    }
  }, [publicClient, userAddress, chainId, page]);

  useEffect(() => {
    loadCreatedRaffles();
  }, [loadCreatedRaffles]);

  return { raffles, loading, error, refetch: loadCreatedRaffles };
}