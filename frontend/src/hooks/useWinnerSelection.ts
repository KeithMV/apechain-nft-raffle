import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { RAFFLE_CONTRACT_ABI } from '../config/contracts';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useEmergencySelectWinner() {
  const queryClient = useQueryClient();
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
    }
  }, [isSuccess, queryClient]);

  const selectWinner = async (raffleContract: string) => {
    try {
      return await writeContractAsync({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'emergencySelectWinner',
        chainId: 33139,
      });
    } catch (error) {
      console.error('Winner selection failed:', error);
      toast.error('Winner selection failed');
      throw error;
    }
  };

  return {
    selectWinner,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}