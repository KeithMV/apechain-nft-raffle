import { useState, useCallback } from 'react';
import { WinnerSelectionService } from '../services/winnerSelectionService';
import { useCommitRandomness, useRevealWinner, useEmergencyWinner } from './useRaffleContract';
import toast from 'react-hot-toast';

export function useWinnerSelection() {
  const [commitData, setCommitData] = useState<{ nonce: bigint; commitHash: string } | null>(null);
  
  const { commitRandomness, isPending: commitPending, isSuccess: commitSuccess } = useCommitRandomness();
  const { revealAndSelectWinner, isPending: revealPending, isSuccess: revealSuccess } = useRevealWinner();
  const { emergencySelectWinner, isPending: emergencyPending } = useEmergencyWinner();

  const startWinnerSelection = useCallback(async (raffleContract: string) => {
    try {
      // Generate secure commit-reveal data
      const { nonce, commitHash } = WinnerSelectionService.generateCommitReveal();
      
      // Store locally and in state
      WinnerSelectionService.storeCommitData(raffleContract, nonce);
      setCommitData({ nonce, commitHash });
      
      // Commit to blockchain
      await commitRandomness(raffleContract, commitHash);
      
      // Toast is handled by useCommitRandomness hook
      return { nonce, commitHash };
    } catch (error) {
      toast.error('Failed to start winner selection');
      throw error;
    }
  }, [commitRandomness]);

  const revealWinner = useCallback(async (raffleContract: string) => {
    try {
      const storedNonce = WinnerSelectionService.getStoredNonce(raffleContract);
      if (!storedNonce) {
        throw new Error('No stored nonce found');
      }

      await revealAndSelectWinner(raffleContract, storedNonce);
      
      // Clean up stored data
      WinnerSelectionService.clearCommitData(raffleContract);
      setCommitData(null);
      
      // Toast is handled by useRevealWinner hook
      return storedNonce;
    } catch (error) {
      toast.error('Failed to reveal winner');
      throw error;
    }
  }, [revealAndSelectWinner]);

  const emergencyReveal = useCallback(async (raffleContract: string) => {
    try {
      await emergencySelectWinner(raffleContract);
      
      // Clean up stored data
      WinnerSelectionService.clearCommitData(raffleContract);
      setCommitData(null);
      // Success toast is handled by useEmergencyWinner hook
    } catch (error) {
      toast.error('Failed to select winner');
      throw error;
    }
  }, [emergencySelectWinner]);

  return {
    startWinnerSelection,
    revealWinner,
    emergencyReveal,
    commitData,
    isPending: commitPending || revealPending || emergencyPending,
    commitSuccess,
    revealSuccess,
  };
}