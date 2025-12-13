import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const RAFFLE_ABI = parseAbi([
  'function cancelRaffle() external',
]);

export function useCancelRaffle() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  const cancelRaffle = async (raffleAddress: string) => {
    try {
      await writeContract({
        address: raffleAddress as `0x${string}`,
        abi: RAFFLE_ABI,
        functionName: 'cancelRaffle',
        chainId: 33139,
      });
    } catch (error) {
      console.error('Cancel raffle failed:', error);
      toast.error('Cancel failed');
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