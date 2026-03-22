import { useCallback } from 'react';
import { parseAbi } from 'viem';
import { useOptimizedTransactionManager } from './useOptimizedTransactionManager';
import { useCacheInvalidation } from './useCacheInvalidation';

const RAFFLE_ABI = parseAbi([
  'function cancelRaffle() external',
]);

export function useOptimizedCancelRaffle() {
  const { invalidateRaffleData } = useCacheInvalidation();
  
  const handleSuccess = useCallback(() => {
    invalidateRaffleData();
  }, [invalidateRaffleData]);
  
  const transactionManager = useOptimizedTransactionManager({
    transactionType: 'cancel-raffle', // Use correct transaction type
    successMessage: '', // Disable built-in toast - we'll handle it in dashboard
    onSuccess: handleSuccess,
    enableToasts: false, // Disable all built-in toasts
    enableOptimisticUpdates: false,
  });

  const cancelRaffle = useCallback(async (raffleAddress: string) => {
    // Validate raffle address
    if (!/^0x[a-fA-F0-9]{40}$/.test(raffleAddress)) {
      throw new Error('Invalid raffle address');
    }
    
    return await transactionManager.executeTransaction({
      address: raffleAddress as `0x${string}`,
      abi: RAFFLE_ABI,
      functionName: 'cancelRaffle',
    });
  }, [transactionManager]);

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