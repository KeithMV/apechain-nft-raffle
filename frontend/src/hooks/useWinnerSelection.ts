import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { RAFFLE_CONTRACT_ABI } from '../config/contracts';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useCacheInvalidation } from './useCacheInvalidation';

export function useEmergencySelectWinner() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { invalidateAll } = useCacheInvalidation();

  useEffect(() => {
    if (isSuccess) {
      invalidateAll();
    }
  }, [isSuccess, invalidateAll]);

  const selectWinner = async (raffleContract: string) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(raffleContract)) {
      toast.error('Invalid raffle address');
      throw new Error('Invalid raffle address');
    }
    
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