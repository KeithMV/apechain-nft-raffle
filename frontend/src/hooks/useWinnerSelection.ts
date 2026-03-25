import { useState, useCallback } from 'react';
import { WinnerSelectionService } from '../services/winnerSelectionService';
import { useOptimizedSelectWinner } from './useOptimizedTransactionManager';
import { RAFFLE_CONTRACT_ABI } from '../config/contracts';
import toast from 'react-hot-toast';

export function useWinnerSelection() {
  const [commitData, setCommitData] = useState<{ nonce: bigint; commitHash: string } | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'committing' | 'revealing' | 'emergency'>('idle');
  
  const transactionManager = useOptimizedSelectWinner();

  const startWinnerSelection = useCallback(async (raffleContract: string) => {
    // SECURITY: Validate and sanitize input
    if (!raffleContract || typeof raffleContract !== 'string') {
      throw new Error('Invalid raffle contract address');
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(raffleContract)) {
      throw new Error('Invalid Ethereum address format');
    }
    
    try {
      setCurrentPhase('committing');
      
      // Generate secure commit-reveal data
      const { nonce, commitHash } = WinnerSelectionService.generateCommitReveal();
      
      // Store locally and in state
      WinnerSelectionService.storeCommitData(raffleContract, nonce);
      setCommitData({ nonce, commitHash });
      
      // Commit to blockchain using optimized transaction manager with chain info
      await transactionManager.executeTransaction({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'commitRandomness',
        args: [commitHash as `0x${string}`],
      });
      
      setCurrentPhase('idle');
      return { nonce, commitHash };
    } catch (error) {
      setCurrentPhase('idle');
      toast.error('Failed to start winner selection');
      throw error;
    }
  }, [transactionManager]);

  const revealWinner = useCallback(async (raffleContract: string) => {
    // SECURITY: Validate and sanitize input
    if (!raffleContract || typeof raffleContract !== 'string') {
      throw new Error('Invalid raffle contract address');
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(raffleContract)) {
      throw new Error('Invalid Ethereum address format');
    }
    
    try {
      setCurrentPhase('revealing');
      
      const storedNonce = WinnerSelectionService.getStoredNonce(raffleContract);
      if (!storedNonce) {
        throw new Error('No stored nonce found');
      }

      // Execute reveal with chain-aware transaction manager
      await transactionManager.executeTransaction({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'revealAndSelectWinner',
        args: [storedNonce],
      });
      
      // Clean up stored data
      WinnerSelectionService.clearCommitData(raffleContract);
      setCommitData(null);
      setCurrentPhase('idle');
      
      return storedNonce;
    } catch (error) {
      setCurrentPhase('idle');
      toast.error('Failed to reveal winner');
      throw error;
    }
  }, [transactionManager]);

  const emergencyReveal = useCallback(async (raffleContract: string) => {
    // SECURITY: Validate and sanitize input
    if (!raffleContract || typeof raffleContract !== 'string') {
      throw new Error('Invalid raffle contract address');
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(raffleContract)) {
      throw new Error('Invalid Ethereum address format');
    }
    
    try {
      setCurrentPhase('emergency');
      console.log('🏆 [WINNER] Starting emergency winner selection for:', raffleContract);
      
      // Execute emergency reveal with chain-aware transaction manager
      await transactionManager.executeTransaction({
        address: raffleContract as `0x${string}`,
        abi: RAFFLE_CONTRACT_ABI,
        functionName: 'emergencySelectWinner',
      });
      
      console.log('✅ [WINNER] Emergency winner selection completed successfully');
      
      // Clean up stored data
      WinnerSelectionService.clearCommitData(raffleContract);
      setCommitData(null);
      setCurrentPhase('idle');
    } catch (error) {
      console.error('❌ [WINNER] Emergency winner selection failed:', error);
      setCurrentPhase('idle');
      toast.error('Failed to select winner');
      throw error;
    }
  }, [transactionManager]);

  return {
    startWinnerSelection,
    revealWinner,
    emergencyReveal,
    commitData,
    isPending: transactionManager.isPending,
    isConfirming: transactionManager.isConfirming,
    isSuccess: transactionManager.isSuccess,
    hash: transactionManager.hash,
    error: transactionManager.error,
    retryTransaction: transactionManager.retryTransaction,
    // Legacy compatibility
    commitSuccess: transactionManager.isSuccess && currentPhase === 'committing',
    revealSuccess: transactionManager.isSuccess && currentPhase === 'revealing',
    currentPhase,
  };
}