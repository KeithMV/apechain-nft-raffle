/**
 * V4-Aware Raffle Position Hooks
 * Combines raffles from both V3 and V4 contracts
 */

import { useChainId } from 'wagmi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRaffleDataFetcher, RaffleInfo } from './useRaffleDataFetcher';
import { useRaffleCacheManager, UserRafflePosition } from './useRaffleCacheManager';
import { useRafflePositionProcessor } from './useRafflePositionProcessor';
import { getRaffleFactoryAddress, isV4Available } from '../config/addresses';
import { debounce } from '../utils/performance';

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
  const chainId = useChainId();
  const { positionCache } = useRaffleCacheManager();
  const { getCombinedUserPositions } = useRafflePositionProcessor();
  const [positions, setPositions] = useState<UserRafflePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    if (!userAddress || !chainId) return;

    // Check cache first
    const cached = positionCache.get({ userAddress, chainId });
    if (cached) {
      setPositions(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build factory list based on available versions
      const factories: Array<{ address: string; version: 'v3' | 'v4' }> = [];
      
      if (isV4Available(chainId)) {
        const v4Address = getRaffleFactoryAddress(chainId, true);
        factories.push({ address: v4Address, version: 'v4' as const });
      }
      
      const v3Address = getRaffleFactoryAddress(chainId, false);
      factories.push({ address: v3Address, version: 'v3' as const });
      
      // Get combined positions from all factories
      const allPositions = await getCombinedUserPositions(factories, userAddress);
      
      setPositions(allPositions);
      positionCache.set({ userAddress, chainId }, allPositions);
    } catch (err) {
      console.error('Failed to load user positions:', err);
      setError('Failed to load user positions');
    } finally {
      setLoading(false);
    }
  }, [userAddress, chainId, positionCache, getCombinedUserPositions]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  return { positions, loading, error, refetch: loadPositions };
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