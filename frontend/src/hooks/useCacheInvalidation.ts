import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useRaffleCacheManager } from './useRaffleCacheManager';

/**
 * Targeted cache invalidation hook for specific raffle transactions
 * More efficient than clearing all caches
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  const { clearAllCaches } = useRaffleCacheManager();

  // Targeted invalidation for specific transaction types
  const invalidateRaffleData = useCallback((raffleContract?: string) => {
    // Invalidate specific raffle queries
    queryClient.invalidateQueries({ queryKey: ['raffles'] });
    queryClient.invalidateQueries({ queryKey: ['user-positions'] });
    queryClient.invalidateQueries({ queryKey: ['created-raffles'] });
    
    if (raffleContract) {
      queryClient.invalidateQueries({ queryKey: ['raffle', raffleContract] });
    }
    
    // Clear V4 cache for affected data only
    clearAllCaches();
  }, [queryClient, clearAllCaches]);

  // Full invalidation (use sparingly)
  const invalidateAll = useCallback(() => {
    clearAllCaches();
    queryClient.invalidateQueries();
    queryClient.refetchQueries();
  }, [queryClient, clearAllCaches]);

  return { 
    invalidateAll,
    invalidateRaffleData 
  };
}