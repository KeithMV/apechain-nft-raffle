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
    if (hash) {
      console.log('🔄 Transaction hash received:', hash);
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirming) {
      console.log('⏳ Transaction confirming...');
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isSuccess) {
      console.log('✅ Winner selection confirmed, clearing all caches');
      queryClient.clear();
      queryClient.removeQueries();
    }
  }, [isSuccess, queryClient]);

  useEffect(() => {
    if (error) {
      console.error('❌ Transaction error:', error);
    }
  }, [error]);

  const selectWinner = async (raffleContract: string) => {
    console.log('🎯 Starting winner selection transaction...');
    console.log('Raffle contract:', raffleContract);
    console.log('Chain ID:', 33139);
    
    try {
      const txHash = await writeContractAsync({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'emergencySelectWinner',
        chainId: 33139,
      });
      
      console.log('✅ Transaction submitted:', txHash);
      return txHash;
    } catch (error: any) {
      console.error('❌ Winner selection transaction failed:');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      
      // More specific error messages
      if (error?.message?.includes('user rejected')) {
        toast.error('Transaction rejected by user');
      } else if (error?.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for gas');
      } else if (error?.message?.includes('execution reverted')) {
        toast.error('Transaction reverted - check raffle conditions');
      } else {
        toast.error(`Winner selection failed: ${error?.message || 'Unknown error'}`);
      }
      
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