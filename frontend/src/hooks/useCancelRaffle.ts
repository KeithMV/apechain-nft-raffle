import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';
import toast from 'react-hot-toast';

const RAFFLE_ABI = parseAbi([
  'function cancelRaffle() external',
  'function owner() external view returns (address)',
  'function isActive() external view returns (bool)'
]);

export function useCancelRaffle(raffleAddress: string) {
  const { 
    writeContract, 
    data: hash, 
    isPending: isWritePending, 
    error: writeError 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelRaffle = async () => {
    if (!raffleAddress) {
      toast.error('Invalid raffle address');
      return;
    }

    try {
      console.log('Canceling raffle:', raffleAddress);
      
      await writeContract({
        address: raffleAddress as `0x${string}`,
        abi: RAFFLE_ABI,
        functionName: 'cancelRaffle',
      });

      toast.success('Cancel transaction submitted!');
    } catch (error) {
      console.error('Cancel raffle failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Cancel failed';
      toast.error(`Cancel failed: ${errorMessage}`);
    }
  };

  // Handle transaction confirmation
  if (isConfirmed) {
    toast.success('Raffle canceled successfully!');
  }

  if (writeError || receiptError) {
    const error = writeError || receiptError;
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
    toast.error(`Transaction failed: ${errorMessage}`);
  }

  return {
    cancelRaffle,
    isPending: isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || receiptError,
    hash
  };
}