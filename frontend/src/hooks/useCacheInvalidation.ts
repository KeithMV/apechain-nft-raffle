import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useRaffleCacheManager } from './useRaffleCacheManager';

/**
 * Centralized cache invalidation hook for all raffle transactions
 * Now uses unified V4 cache management system
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  const { clearAllCaches } = useRaffleCacheManager();

  const invalidateAll = useCallback(() => {
    // Clear V4 unified cache system
    clearAllCaches();
    
    // Clear React Query cache with specific invalidation
    queryClient.invalidateQueries();
    queryClient.refetchQueries();
    
    // Force clear all cached data
    queryClient.clear();
  }, [queryClient, clearAllCaches]);

  return { invalidateAll };
}