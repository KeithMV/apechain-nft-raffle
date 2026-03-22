import { useCallback } from 'react';
import { parseAbi } from 'viem';
import { useOptimizedTransactionManager } from './useOptimizedTransactionManager';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';

const RAFFLE_ABI = parseAbi([
  'function cancelRaffle() external',
]);

export function useOptimizedCancelRaffle() {
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  const handleSuccess = useCallback((hash: string, raffleAddress: string) => {
    // Use unified cache invalidation for immediate frontend updates
    invalidateAfterTransaction({
      raffleContract: raffleAddress,
      transactionType: 'cancel-raffle',
      immediate: true
    });
  }, [invalidateAfterTransaction]);
  
  const transactionManager = useOptimizedTransactionManager({
    transactionType: 'cancel-raffle',
    successMessage: '', // Disable built-in toast - we'll handle it in dashboard
    enableToasts: false, // Disable all built-in toasts
    enableOptimisticUpdates: false,
    onSuccess: (hash) => {
      // We'll handle success in the component that calls cancelRaffle
      console.log('✅ [CANCEL] Transaction confirmed with hash:', hash);
    },
  });

  const cancelRaffle = useCallback(async (raffleAddress: string) => {
    // Validate raffle address
    if (!/^0x[a-fA-F0-9]{40}$/.test(raffleAddress)) {
      throw new Error('Invalid raffle address');
    }
    
    const result = await transactionManager.executeTransaction({
      address: raffleAddress as `0x${string}`,
      abi: RAFFLE_ABI,
      functionName: 'cancelRaffle',
    });
    
    // Handle success with unified cache invalidation
    if (result) {
      handleSuccess(result, raffleAddress);
    }
    
    return result;
  }, [transactionManager, handleSuccess]);

  return {
    cancelRaffle,
    hash: transactionManager.hash,
    error: transactionManager.error,
    isPending: transactionManager.isPending,
    isConfirming: transactionManager.isConfirming,
    isSuccess: transactionManager.isSuccess,
    retryTransaction: transactionManager.retryTransaction,
  };
}