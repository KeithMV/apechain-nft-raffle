import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useCacheInvalidation } from './useCacheInvalidation';

const RAFFLE_ABI = parseAbi([
  'function cancelRaffle() external',
]);

export function useCancelRaffle() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { invalidateAll } = useCacheInvalidation();

  useEffect(() => {
    if (isSuccess) {
      invalidateAll();
    }
  }, [isSuccess, invalidateAll]);

  const cancelRaffle = async (raffleAddress: string) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(raffleAddress)) {
      toast.error('Invalid raffle address');
      return;
    }
    
    try {
      await writeContract({
        address: raffleAddress as `0x${string}`,
        abi: RAFFLE_ABI,
        functionName: 'cancelRaffle',
        chainId: 33139,
      });
    } catch (error) {
      console.error('Cancel raffle failed:', error);
      toast.error('Failed to cancel raffle');
    }
  };

  return {
    cancelRaffle,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash
  };
}