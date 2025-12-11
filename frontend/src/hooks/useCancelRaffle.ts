import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseAbi } from 'viem';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apeChain } from '../config/wagmi';
import { RAFFLE_FACTORY_ADDRESS } from '../config/contracts';

const RAFFLE_ABI = parseAbi([
  'function cancelRaffle() external',
  'function owner() external view returns (address)',
  'function isActive() external view returns (bool)'
]);

export function useCancelRaffle() {
  const queryClient = useQueryClient();
  const { 
    writeContract, 
    data: hash, 
    isPending: isWritePending, 
    error: writeError 
  } = useWriteContract();

  const { switchChain } = useSwitchChain();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelRaffle = async (raffleAddress: string) => {
    if (!raffleAddress || !raffleAddress.startsWith('0x') || raffleAddress.length !== 42) {
      toast.error('Invalid raffle address format');
      return;
    }

    try {
      console.log('Canceling raffle:', raffleAddress.slice(0, 10) + '...');
      
      // Switch to ApeChain first with error handling
      try {
        await switchChain({ chainId: apeChain.id });
      } catch (chainError) {
        console.error('Chain switch failed:', chainError);
        toast.error('Failed to switch to ApeChain');
        return;
      }
      
      await writeContract({
        address: raffleAddress as `0x${string}`,
        abi: RAFFLE_ABI,
        functionName: 'cancelRaffle',
        chainId: apeChain.id,
      });
    } catch (error) {
      console.error('Cancel raffle failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Cancel failed';
      toast.error(`Cancel failed: ${errorMessage}`);
    }
  };

  // Handle transaction confirmation with useEffect to prevent duplicate toasts
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Raffle canceled successfully!');
      // Invalidate all raffle-related queries to refresh data
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === 'readContract' || 
        query.queryKey.some(key => typeof key === 'string' && key.includes('raffle'))
      });
      // Force refetch of raffle counter to trigger useAllRaffles refresh
      queryClient.invalidateQueries({ 
        queryKey: ['readContract', { address: RAFFLE_FACTORY_ADDRESS, functionName: 'raffleCounter' }] 
      });
    }
  }, [isConfirmed, queryClient]);

  useEffect(() => {
    if (writeError || receiptError) {
      const error = writeError || receiptError;
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast.error(`Transaction failed: ${errorMessage}`);
    }
  }, [writeError, receiptError]);

  return {
    cancelRaffle,
    isPending: isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || receiptError,
    hash
  };
}