/**
 * Clean Web3 Transaction Manager
 * Real transaction handling without fake progress - focuses on actual blockchain states
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toastManager } from '../utils/toastManager';
import { optimisticUpdateHelpers, transactionQueryClient } from '../utils/transactionQueryClient';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';
import { useChainConfig } from '../hooks/useChainConfig';

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
    chainId?: number;
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

  // Use centralized chain configuration
  const { chainId, getOperationTimeout, invalidationDelay, isPolygon } = useChainConfig();
  
  const { writeContractAsync, data: hash, error } = useWriteContract();
  const [attempt, setAttempt] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastContractCall, setLastContractCall] = useState<any>(null);
  
  // Unified cache invalidation
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  // Use centralized timeout configuration
  const baseTimeout = getOperationTimeout(transactionType);
  const timeout = isPolygon ? baseTimeout * 1.5 : baseTimeout; // 50% longer for Polygon
  
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

  // Handle transaction success with chain-aware cache invalidation
  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash.current) {
      lastSuccessHash.current = hash;
      setIsProcessing(false);
      
      // Use centralized invalidation delay configuration
      console.log(`🔄 [CACHE] Chain-aware invalidation: ${invalidationDelay > 0 ? `${invalidationDelay}ms delay` : 'immediate'} for tx:`, hash);
      
      // POLYGON OPTIMIZATION: Immediate + delayed invalidation for faster UX
      if (isPolygon) {
        // Immediate invalidation for instant feedback
        invalidateAfterTransaction({
          raffleContract: optimisticData?.raffleId,
          userAddress: optimisticData?.userAddress,
          transactionType,
          immediate: true,
          chainId
        });
        
        // Follow-up invalidation to catch any missed updates
        setTimeout(() => {
          invalidateAfterTransaction({
            raffleContract: optimisticData?.raffleId,
            userAddress: optimisticData?.userAddress,
            transactionType,
            immediate: true,
            chainId
          });
        }, 3000); // 3s follow-up
      } else {
        // Standard invalidation for other chains
        setTimeout(() => {
          invalidateAfterTransaction({
            raffleContract: optimisticData?.raffleId,
            userAddress: optimisticData?.userAddress,
            transactionType,
            immediate: true,
            chainId
          });
        }, invalidationDelay);
      }
      
      if (enableToasts && successMessage) {
        toastManager.transaction.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(hash);
      }
      
      setAttempt(0); // Reset attempt counter on success
    }
  }, [isSuccess, hash, successMessage, onSuccess, enableToasts, optimisticData, transactionType, invalidateAfterTransaction, chainId, invalidationDelay, isPolygon]);

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
          toastManager.wallet.userRejected();
        } else if (errorMessage?.includes('insufficient funds')) {
          toastManager.wallet.insufficientFunds(isPolygon);
        } else if (errorMessage?.includes('429')) {
          toastManager.wallet.networkBusy();
        } else {
          toastManager.error(`Transaction failed: ${errorMessage || 'Unknown error'}`);
        }
      }
      
      if (onError) {
        onError(errorToHandle as Error);
      }
    }
  }, [error, receiptError, onError, enableToasts, isPolygon]);

  // CRITICAL FIX: Add safety mechanism to clear stuck processing states
  useEffect(() => {
    if (isProcessing && !hash && !error && !receiptError) {
      // If we've been processing for more than 2 minutes without a hash, something is wrong
      const safetyTimeout = setTimeout(() => {
        console.log('🚨 [SAFETY] Clearing stuck processing state after 2 minutes');
        setIsProcessing(false);
        if (enableToasts) {
          toastManager.error('Transaction appears to be stuck. Please try again.');
        }
      }, 120000); // 2 minutes
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [isProcessing, hash, error, receiptError, enableToasts]);

  // Handle confirmation timeout
  useEffect(() => {
    if (hash && !isConfirming && !isSuccess && !receiptError) {
      const timeoutId = setTimeout(() => {
        setIsProcessing(false);
        
        if (enableToasts) {
          toastManager.error('Transaction confirmation timed out. It may still complete.');
        }
      }, timeout + 5000); // Add 5s buffer
      
      return () => clearTimeout(timeoutId);
    }
  }, [hash, isConfirming, isSuccess, receiptError, timeout, enableToasts]);

  // Execute transaction with AGGRESSIVE timeout protection
  const executeTransaction = useCallback(async (contractCall: any): Promise<string> => {
    console.log('🚀 [TX] Starting transaction:', transactionType);
    setIsProcessing(true);
    setLastContractCall(contractCall);
    
    // AGGRESSIVE FIX: Multiple timeout layers
    const timeouts = [
      setTimeout(() => {
        console.log('⚠️ [TX] 30s timeout - clearing processing state');
        setIsProcessing(false);
        toastManager.error('Transaction taking too long. Cleared processing state.');
      }, 30000), // 30 seconds
      
      setTimeout(() => {
        console.log('🚨 [TX] 60s timeout - force clearing everything');
        setIsProcessing(false);
        // @ts-ignore - queryClient is added globally for debugging
        if ((window as any).queryClient) (window as any).queryClient.clear();
        toastManager.error('Transaction timed out. Please refresh and try again.');
      }, 60000) // 60 seconds
    ];
    
    const clearAllTimeouts = () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
    
    try {
      console.log('📝 [TX] Preparing contract call...');
      
      // Use dynamic gas pricing based on current network conditions
      let optimizedContractCall = contractCall;
      if (isPolygon) {
        // Don't set gas parameters - let wagmi/viem handle it automatically
        // This will use current network gas prices
        optimizedContractCall = {
          ...contractCall,
          gas: BigInt(600000), // Just set gas limit, let network determine price
        };
        console.log('🔶 [TX] Using Polygon dynamic gas pricing (network-determined)');
      }
      
      console.log('📤 [TX] Submitting transaction...');
      const result = await writeContractAsync(optimizedContractCall);
      
      console.log('✅ [TX] Transaction submitted:', result);
      clearAllTimeouts();
      
      return result;
    } catch (error) {
      console.log('❌ [TX] Transaction failed:', error);
      clearAllTimeouts();
      setIsProcessing(false);
      throw error;
    }
  }, [writeContractAsync, isPolygon, transactionType]);

  // Retry transaction with Polygon-optimized backoff strategy
  const retryTransaction = useCallback(async (): Promise<void> => {
    if (!lastContractCall) {
      throw new Error('No transaction to retry');
    }
    
    setAttempt(prev => prev + 1);
    
    // Optimized retry strategy for Polygon
    let delay: number;
    if (isPolygon) {
      // Polygon-optimized retry with linear backoff (better for fast finality)
      delay = Math.min(2000 + (attempt * 1000), 8000); // 2s, 3s, 4s, 5s, max 8s
      
      console.log(`🔄 [POLYGON-TX] Retrying ${transactionType} with optimized delay: ${delay}ms (attempt ${attempt})`);
    } else {
      // Standard exponential backoff for other chains
      delay = Math.min(1000 * Math.pow(2, attempt), 5000);
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    await executeTransaction(lastContractCall);
  }, [lastContractCall, attempt, executeTransaction, isPolygon, transactionType]);



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
    successMessage: undefined, // Disable built-in success toast - let dashboard handle it
    enableToasts: false, // Disable all built-in toasts for winner selection
    enableOptimisticUpdates: true,
    optimisticData,
    onSuccess: (hash) => {
      console.log('✅ [WINNER] Transaction confirmed with hash:', hash);
      if (optimisticData?.raffleId) {
        console.log('🔄 [WINNER] Starting progressive cache invalidation for raffle:', optimisticData.raffleId);
      }
    },
    onError: (error) => {
      console.error('❌ [WINNER] Transaction failed:', error);
      // Error toasts will be handled by the dashboard
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
    successMessage: undefined, // Disable built-in success toast - let dashboard handle it
    enableToasts: false, // Disable all built-in toasts for cancel raffle
    enableOptimisticUpdates: true,
    optimisticData,
    onSuccess: (hash) => {
      console.log('✅ [CANCEL] Transaction confirmed with hash:', hash);
      if (optimisticData?.raffleId) {
        console.log('🔄 [CANCEL] Invalidating cache for raffle:', optimisticData.raffleId);
      }
    },
    onError: (error) => {
      console.error('❌ [CANCEL] Transaction failed:', error);
      // Error toasts will be handled by the dashboard
    },
  });
}