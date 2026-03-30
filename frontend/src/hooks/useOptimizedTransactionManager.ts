/**
 * Clean Web3 Transaction Manager
 * Real transaction handling without fake progress - focuses on actual blockchain states
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';
import { getProgressiveTimeout, optimisticUpdateHelpers, transactionQueryClient } from '../utils/transactionQueryClient';
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
  const { chainId, getOperationTimeout, getOperationRetries, invalidationDelay, isPolygon } = useChainConfig();
  
  const { writeContractAsync, data: hash, error, isPending: wagmiPending } = useWriteContract();
  const [attempt, setAttempt] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastContractCall, setLastContractCall] = useState<any>(null);
  
  // Unified cache invalidation
  const { invalidateAfterTransaction, quickInvalidate } = useUnifiedCacheInvalidation();
  
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
      
      setTimeout(() => {
        invalidateAfterTransaction({
          raffleContract: optimisticData?.raffleId,
          userAddress: optimisticData?.userAddress,
          transactionType,
          immediate: true,
          chainId
        });
      }, invalidationDelay);
      
      if (enableToasts && successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(hash);
      }
      
      setAttempt(0); // Reset attempt counter on success
    }
  }, [isSuccess, hash, successMessage, onSuccess, enableToasts, optimisticData, transactionType, invalidateAfterTransaction, chainId, invalidationDelay]);

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
          toast.error(isPolygon ? 'Insufficient POL for transaction fees' : 'Insufficient funds for transaction.');
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

  // Execute transaction with optimistic updates and Polygon optimization
  const executeTransaction = useCallback(async (contractCall: any): Promise<string> => {
    setIsProcessing(true);
    setLastContractCall(contractCall);
    
    // Apply optimistic updates immediately
    applyOptimisticUpdates();
    
    try {
      // HIGH GAS CEILING APPROACH: Set generous limits, let users decide
      let optimizedContractCall = contractCall;
      if (isPolygon) {
        // OPTIMIZED GAS SETTINGS - Balanced approach for Polygon reliability
        const gasSettings = {
          'buy-tickets': {
            gasLimit: BigInt(250000),              // Optimized limit
            maxFeePerGas: BigInt('120000000000'),  // 120 gwei ceiling (~$0.05)
            maxPriorityFeePerGas: BigInt('30000000000'), // 30 gwei priority
          },
          'create-raffle': {
            gasLimit: BigInt(400000),              // Optimized for complex creation
            maxFeePerGas: BigInt('150000000000'),  // 150 gwei ceiling (~$0.12)
            maxPriorityFeePerGas: BigInt('40000000000'), // 40 gwei priority
          },
          'select-winner': {
            gasLimit: BigInt(350000),              // Optimized for winner selection
            maxFeePerGas: BigInt('180000000000'),  // 180 gwei ceiling (~$0.18)
            maxPriorityFeePerGas: BigInt('50000000000'), // 50 gwei priority
          },
          'cancel-raffle': {
            gasLimit: BigInt(180000),              // Optimized for cancellation
            maxFeePerGas: BigInt('100000000000'),  // 100 gwei ceiling (~$0.04)
            maxPriorityFeePerGas: BigInt('25000000000'), // 25 gwei priority
          }
        };
        
        const settings = gasSettings[transactionType] || gasSettings['buy-tickets'];
        
        optimizedContractCall = {
          ...contractCall,
          gas: settings.gasLimit,  // Use 'gas' instead of 'gasLimit' for wagmi
          maxFeePerGas: settings.maxFeePerGas,
          maxPriorityFeePerGas: settings.maxPriorityFeePerGas,
        };
        
        console.log(`🔶 [POLYGON-TX] Optimized gas for ${transactionType}:`, {
          gasLimit: settings.gasLimit.toString(),
          maxFeePerGas: `${Number(settings.maxFeePerGas) / 1e9} gwei`,
          maxPriorityFeePerGas: `${Number(settings.maxPriorityFeePerGas) / 1e9} gwei`,
          estimatedCost: `~$${(Number(settings.gasLimit) * Number(settings.maxFeePerGas) / 1e18 * 0.5).toFixed(3)} USD`
        });
      }
      
      const startTime = Date.now();
      const result = await writeContractAsync(optimizedContractCall);
      
      // Record success for Polygon performance tracking
      if (isPolygon) {
        const duration = Date.now() - startTime;
        console.log(`✅ [POLYGON-TX] ${transactionType} submitted successfully in ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      setIsProcessing(false);
      
      // Polygon-specific error handling
      if (isPolygon) {
        console.log(`🔶 [POLYGON-TX] Error for ${transactionType}:`, error);
      }
      
      throw error;
    }
  }, [writeContractAsync, applyOptimisticUpdates, isPolygon, transactionType]);

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