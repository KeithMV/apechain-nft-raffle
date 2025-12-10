/**
 * Winner Selection Hook
 * Handles commit-reveal and emergency winner selection for expired raffles
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { RAFFLE_CONTRACT_ABI } from '../config/contracts';
import { WinnerSelectionService } from '../services/winnerSelectionService';
import toast from 'react-hot-toast';

/**
 * Hook for emergency winner selection (when commit-reveal fails or times out)
 */
export function useEmergencySelectWinner() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const selectWinner = async (raffleContract: string) => {
    return await writeContractAsync({
      address: raffleContract as `0x${string}`,
      abi: RAFFLE_CONTRACT_ABI,
      functionName: 'emergencySelectWinner',
      chainId: 33139,
    });
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

/**
 * Hook for commit randomness (first step of commit-reveal)
 */
export function useCommitRandomness() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const commitRandomness = async (raffleContract: string) => {
    try {
      const { nonce, commitHash } = WinnerSelectionService.generateCommitReveal();
      
      // Store nonce for later reveal
      WinnerSelectionService.storeCommitData(raffleContract, nonce);
      
      writeContract({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'commitRandomness',
        args: [commitHash as `0x${string}`],
        chainId: 33139,
      });
    } catch (error: any) {
      console.error('Commit randomness failed:', error);
      toast.error('Failed to commit randomness: ' + error.message);
    }
  };

  return {
    commitRandomness,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

/**
 * Hook for reveal and select winner (second step of commit-reveal)
 */
export function useRevealAndSelectWinner() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const revealAndSelectWinner = async (raffleContract: string) => {
    try {
      const storedNonce = WinnerSelectionService.getStoredNonce(raffleContract);
      
      if (!storedNonce) {
        throw new Error('No stored nonce found. Please commit randomness first.');
      }
      
      writeContract({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'revealAndSelectWinner',
        args: [storedNonce],
        chainId: 33139,
      });
      
      // Clear stored data after successful reveal
      WinnerSelectionService.clearCommitData(raffleContract);
    } catch (error: any) {
      console.error('Reveal and select winner failed:', error);
      toast.error('Failed to reveal and select winner: ' + error.message);
    }
  };

  return {
    revealAndSelectWinner,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}