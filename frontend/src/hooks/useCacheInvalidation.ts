import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useClearRaffleCache } from './useRafflePositions';
import { useClearRaffleCacheV4 } from './useRafflePositionsV4';

/**
 * Centralized cache invalidation hook for all raffle transactions
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  const clearRaffleCache = useClearRaffleCache();
  const clearRaffleCacheV4 = useClearRaffleCacheV4();

  const invalidateAll = useCallback(() => {
    // Clear both V3 and V4 custom caches
    clearRaffleCache();
    clearRaffleCacheV4();
    // Clear React Query cache with specific invalidation
    queryClient.invalidateQueries();
    queryClient.refetchQueries();
    // Force clear all cached data
    queryClient.clear();
  }, [queryClient, clearRaffleCache, clearRaffleCacheV4]);

  return { invalidateAll };
}