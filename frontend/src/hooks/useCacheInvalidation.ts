import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useClearRaffleCache } from './useRafflePositions';

/**
 * Centralized cache invalidation hook for all raffle transactions
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  const clearRaffleCache = useClearRaffleCache();

  const invalidateAll = useCallback(() => {
    // Clear custom cache
    clearRaffleCache();
    // Clear React Query cache
    queryClient.clear();
  }, [queryClient, clearRaffleCache]);

  return { invalidateAll };
}