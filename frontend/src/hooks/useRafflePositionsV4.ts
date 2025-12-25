/**
 * V4-Aware Raffle Position Hooks
 * Combines raffles from both V3 and V4 contracts
 */

import { usePublicClient, useReadContract } from 'wagmi';
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
  
  // Get raffle contracts
  const raffleContracts = await processBatch(
    indices,
    (i) => publicClient.readContract({
      address: factoryAddress as `0x${string}`,
      abi: RAFFLE_FACTORY_ABI,
      functionName: 'getRaffleContract',
      args: [BigInt(i)],
    }),
    5,
    10
  );
  
  // Get raffle info
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
    20
  );
  
  return raffleInfos.map((result: any, index) => {
    const now = Date.now() / 1000;
    const endTime = Number(result.endTime);
    const isSoldOut = Number(result.ticketsSold) >= Number(result.maxTickets);
    const isActive = now < endTime && !result.completed && !isSoldOut;
    
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
      version,
    };
  });
}

// Get all raffles from both V3 and V4
export function useAllRafflesV4(limit: number = 20, offset: number = 0) {
  const publicClient = usePublicClient();
  const [raffles, setRaffles] = useState<CreatedRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRaffles = useCallback(async () => {
    if (!publicClient) return;

    setLoading(true);
    setError(null);

    try {
      const allRaffles: CreatedRaffle[] = [];
      
      // Get V3 raffles
      const v3Address = getRaffleFactoryAddress(undefined, false);
      const v3Raffles = await getRafflesFromFactory(publicClient, v3Address, 'v3', limit, offset);
      allRaffles.push(...v3Raffles);
      
      // Get V4 raffles if available
      if (isV4Available()) {
        const v4Address = getRaffleFactoryAddress(undefined, true);
        const v4Raffles = await getRafflesFromFactory(publicClient, v4Address, 'v4', limit, 0);
        allRaffles.push(...v4Raffles);
      }
      
      // Sort by creation time (newest first) and limit results
      const sortedRaffles = allRaffles
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
  }, [publicClient, limit, offset]);

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
    console.log('V4 Raffle caches cleared aggressively');
  }, []);
}