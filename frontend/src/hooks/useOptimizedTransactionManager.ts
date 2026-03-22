/**
 * Clean Web3 Transaction Manager
 * Real transaction handling without fake progress - focuses on actual blockchain states
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';
import { getProgressiveTimeout, optimisticUpdateHelpers, transactionQueryClient } from '../utils/transactionQueryClient';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';

export interface OptimizedTransactionConfig {
  transactionType: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle';
  successMessage?: string;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
  enableToasts?: boolean;
  enableOptimisticUpdates?: boolean;
  optimisticData?: {
    raffleId?: string;
    userAddress?: string;
    expectedTicketCount?: number;
    expectedBalance?: string;
  };
}

export interface OptimizedTransactionState {
  hash: string | undefined;
  error: Error | null;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  executeTransaction: (contractCall: any) => Promise<string>;
  retryTransaction: () => Promise<void>;
}

export function useOptimizedTransactionManager(config: OptimizedTransactionConfig): OptimizedTransactionState {
  const {
    transactionType,
    successMessage,
    onSuccess,
    onError,
    enableToasts = true,
    enableOptimisticUpdates = true,
    optimisticData,
  } = config;

  const { writeContractAsync, data: hash, error, isPending: wagmiPending } = useWriteContract();
  const [attempt, setAttempt] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastContractCall, setLastContractCall] = useState<any>(null);
  
  // Unified cache invalidation
  const { invalidateAfterTransaction, quickInvalidate } = useUnifiedCacheInvalidation();
  
  const timeout = getProgressiveTimeout(transactionType, attempt);
  
  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
    timeout,
  });

  const lastSuccessHash = useRef<string | null>(null);



  // Apply optimistic updates
  const applyOptimisticUpdates = useCallback(() => {
    if (!enableOptimisticUpdates || !optimisticData) return;

    const { raffleId, userAddress, expectedTicketCount, expectedBalance } = optimisticData;

    if (raffleId && expectedTicketCount !== undefined) {
      optimisticUpdateHelpers.updateTicketCount(transactionQueryClient, raffleId, expectedTicketCount);
    }

    if (userAddress && expectedBalance) {
      optimisticUpdateHelpers.updateUserBalance(transactionQueryClient, userAddress, expectedBalance);
    }
  }, [enableOptimisticUpdates, optimisticData]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash.current) {
      lastSuccessHash.current = hash;
      setIsProcessing(false);
      
      // Unified cache invalidation for immediate frontend updates
      invalidateAfterTransaction({
        raffleContract: optimisticData?.raffleId,
        userAddress: optimisticData?.userAddress,
        transactionType,
        immediate: true
      });
      
      if (enableToasts && successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(hash);
      }
      
      setAttempt(0); // Reset attempt counter on success
    }
  }, [isSuccess, hash, successMessage, onSuccess, enableToasts, optimisticData, transactionType, invalidateAfterTransaction]);

  // Handle transaction errors with smart retry logic
  useEffect(() => {
    if (error || receiptError) {
      setIsProcessing(false);
      
      const errorToHandle = error || receiptError;
      const errorMessage = errorToHandle && typeof errorToHandle === 'object' && 'message' in errorToHandle 
        ? (errorToHandle as any).message 
        : String(errorToHandle);
      
      if (enableToasts) {
        if (errorMessage?.includes('User rejected')) {
          toast.error('Transaction cancelled by user.');
        } else if (errorMessage?.includes('insufficient funds')) {
          toast.error('Insufficient funds for transaction.');
        } else if (errorMessage?.includes('429')) {
          toast.error('Network busy. Please try again in a moment.');
        } else {
          toast.error(`Transaction failed: ${errorMessage || 'Unknown error'}`);
        }
      }
      
      if (onError) {
        onError(errorToHandle as Error);
      }
    }
  }, [error, receiptError, onError, enableToasts]);

  // Handle confirmation timeout
  useEffect(() => {
    if (hash && !isConfirming && !isSuccess && !receiptError) {
      const timeoutId = setTimeout(() => {
        setIsProcessing(false);
        
        if (enableToasts) {
          toast.error('Transaction confirmation timed out. It may still complete.');
        }
      }, timeout + 5000); // Add 5s buffer
      
      return () => clearTimeout(timeoutId);
    }
  }, [hash, isConfirming, isSuccess, receiptError, timeout, enableToasts]);

  // Execute transaction with optimistic updates
  const executeTransaction = useCallback(async (contractCall: any): Promise<string> => {
    setIsProcessing(true);
    setLastContractCall(contractCall);
    
    // Apply optimistic updates immediately
    applyOptimisticUpdates();
    
    try {
      const result = await writeContractAsync(contractCall);
      return result;
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  }, [writeContractAsync, applyOptimisticUpdates]);

  // Retry transaction with exponential backoff
  const retryTransaction = useCallback(async (): Promise<void> => {
    if (!lastContractCall) {
      throw new Error('No transaction to retry');
    }
    
    setAttempt(prev => prev + 1);
    
    // Add delay before retry (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await executeTransaction(lastContractCall);
  }, [lastContractCall, attempt, executeTransaction]);



  return {
    hash,
    error: (error || receiptError) ? (error || receiptError) as Error : null,
    isPending: isProcessing,
    isConfirming: isConfirming && isProcessing,
    isSuccess,
    executeTransaction,
    retryTransaction,
  };
}

// Specialized hooks for different transaction types

export function useOptimizedBuyTickets(optimisticData?: OptimizedTransactionConfig['optimisticData']) {
  return useOptimizedTransactionManager({
    transactionType: 'buy-tickets',
    successMessage: 'Tickets purchased successfully!',
    enableOptimisticUpdates: true,
    optimisticData,
  });
}

export function useOptimizedSelectWinner(optimisticData?: OptimizedTransactionConfig['optimisticData']) {
  return useOptimizedTransactionManager({
    transactionType: 'select-winner',
    successMessage: '', // Disable built-in toast
    enableToasts: false, // Disable all built-in toasts
    enableOptimisticUpdates: true,
    optimisticData,
    onSuccess: (hash) => {
      console.log('✅ [WINNER] Transaction confirmed with hash:', hash);
      if (optimisticData?.raffleId) {
        console.log('🔄 [WINNER] Invalidating cache for raffle:', optimisticData.raffleId);
      }
    },
  });
}

export function useOptimizedCreateRaffle(onSuccess?: (hash: string) => void) {
  return useOptimizedTransactionManager({
    transactionType: 'create-raffle',
    successMessage: 'Raffle created successfully!',
    onSuccess,
    enableOptimisticUpdates: false, // Don't use optimistic updates for creation
  });
}

export function useOptimizedCancelRaffle(optimisticData?: OptimizedTransactionConfig['optimisticData']) {
  return useOptimizedTransactionManager({
    transactionType: 'cancel-raffle',
    successMessage: 'Raffle cancelled successfully!',
    enableOptimisticUpdates: true,
    optimisticData,
    onSuccess: (hash) => {
      console.log('✅ [CANCEL] Transaction confirmed with hash:', hash);
      if (optimisticData?.raffleId) {
        console.log('🔄 [CANCEL] Invalidating cache for raffle:', optimisticData.raffleId);
      }
    },
  });
}