/**
 * Enhanced Transaction Manager
 * Integrates RPC health monitoring and performance tracking
 * Provides optimal transaction handling with automatic optimization
 */

import { useCallback, useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';
import { useChainConfig } from '../hooks/useChainConfig';
import { useRPCHealthMonitor } from './useRPCHealthMonitor';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';
import { polygonOptimizer, polygonUtils } from '../utils/polygonOptimizations';

export interface EnhancedTransactionConfig {
  transactionType: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle';
  successMessage?: string;
  onSuccess?: (hash: string, metrics: { duration: number; rpcEndpoint: string }) => void;
  onError?: (error: Error, metrics: { duration: number; rpcEndpoint: string }) => void;
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

export interface EnhancedTransactionState {
  hash: string | undefined;
  error: Error | null;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  executeTransaction: (contractCall: any) => Promise<string>;
  retryTransaction: () => Promise<void>;
  performanceMetrics: {
    averageDuration: number;
    successRate: number;
    lastRPCEndpoint: string;
  };
}

export function useEnhancedTransactionManager(config: EnhancedTransactionConfig): EnhancedTransactionState {
  const {
    transactionType,
    successMessage,
    onSuccess,
    onError,
    enableToasts = true,
    enableOptimisticUpdates = true,
    optimisticData,
  } = config;

  // Core hooks
  const { chainId, getOperationTimeout, getOperationRetries, config: chainConfig, isPolygon } = useChainConfig();
  const { getBestEndpoint, reportFailure, reportSuccess } = useRPCHealthMonitor(chainId);
  const { measurePerformance, recordMetric } = usePerformanceMonitor();
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  // Wagmi hooks
  const { writeContractAsync, data: hash, error, isPending: wagmiPending } = useWriteContract();
  
  // State management
  const [attempt, setAttempt] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastContractCall, setLastContractCall] = useState<any>(null);
  const [lastRPCEndpoint, setLastRPCEndpoint] = useState<string>('');
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageDuration: 0,
    successRate: 100,
    lastRPCEndpoint: '',
  });
  
  // Dynamic timeout based on performance and chain configuration with Polygon optimization
  const baseTimeout = getOperationTimeout(transactionType);
  const timeout = isPolygon ? polygonOptimizer.getOptimizedTimeout(transactionType) : baseTimeout;
  const maxRetries = getOperationRetries(transactionType);
  
  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
    timeout,
  });

  // Enhanced transaction execution with performance monitoring and Polygon optimization
  const executeTransaction = useCallback(async (contractCall: any): Promise<string> => {
    const startTime = Date.now();
    const bestEndpoint = getBestEndpoint();
    
    setIsProcessing(true);
    setLastContractCall(contractCall);
    setLastRPCEndpoint(bestEndpoint);
    
    console.log(`🚀 [ENHANCED-TX] Starting ${transactionType} on ${chainConfig.name} via ${bestEndpoint}`);
    
    try {
      // Polygon-specific gas optimization
      let optimizedContractCall = contractCall;
      if (isPolygon) {
        const gasSettings = await polygonOptimizer.getOptimizedGasSettings(transactionType);
        optimizedContractCall = {
          ...contractCall,
          gasLimit: gasSettings.gasLimit,
          maxFeePerGas: gasSettings.maxFeePerGas,
          maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas,
        };
        
        console.log(`🔶 [POLYGON-ENHANCED] Optimized gas for ${transactionType}:`, {
          gasLimit: gasSettings.gasLimit,
          maxFeePerGas: gasSettings.maxFeePerGas,
          maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas,
          congestionLevel: gasSettings.congestionLevel,
          congested: polygonOptimizer.isPolygonCongested(),
          endpoint: bestEndpoint,
        });
      }
      
      const result = await measurePerformance(
        `transaction-${transactionType}`,
        async () => {
          return await writeContractAsync(optimizedContractCall);
        },
        {
          chainId,
          rpcEndpoint: bestEndpoint,
          attempt: attempt + 1,
          contractAddress: contractCall.address,
          isPolygonOptimized: isPolygon,
        }
      );
      
      const duration = Date.now() - startTime;
      
      // Report success to RPC health monitor
      reportSuccess(bestEndpoint, duration);
      
      // Polygon-specific success tracking
      if (isPolygon) {
        polygonOptimizer.recordSuccess(duration);
        const metrics = polygonOptimizer.getPerformanceMetrics();
        console.log(`✅ [POLYGON-ENHANCED] Success metrics:`, {
          duration,
          avgTime: metrics.avgTransactionTime,
          failureRate: metrics.failureRate,
          congested: polygonOptimizer.isPolygonCongested(),
        });
      }
      
      setPerformanceMetrics(prev => ({
        averageDuration: (prev.averageDuration + duration) / 2,
        successRate: Math.min(100, prev.successRate + 1),
        lastRPCEndpoint: bestEndpoint,
      }));
      
      console.log(`✅ [ENHANCED-TX] ${transactionType} submitted successfully in ${duration}ms via ${bestEndpoint}`);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Report failure to RPC health monitor
      reportFailure(bestEndpoint);
      
      // Polygon-specific error handling and tracking
      if (isPolygon) {
        polygonOptimizer.recordFailure();
        const handled = polygonOptimizer.handlePolygonRPCError(error, bestEndpoint);
        
        if (handled) {
          console.log(`🔶 [POLYGON-ENHANCED] Handled Polygon error for ${transactionType}:`, {
            error: error instanceof Error ? error.message : String(error),
            endpoint: bestEndpoint,
            congested: polygonOptimizer.isPolygonCongested(),
          });
        }
      }
      
      recordMetric(`transaction-${transactionType}`, duration, false, {
        chainId,
        rpcEndpoint: bestEndpoint,
        attempt: attempt + 1,
        error: error instanceof Error ? error.message : String(error),
        isPolygonOptimized: isPolygon,
      });
      
      setPerformanceMetrics(prev => ({
        averageDuration: (prev.averageDuration + duration) / 2,
        successRate: Math.max(0, prev.successRate - 5),
        lastRPCEndpoint: bestEndpoint,
      }));
      
      console.error(`❌ [ENHANCED-TX] ${transactionType} failed after ${duration}ms via ${bestEndpoint}:`, error);
      
      setIsProcessing(false);
      throw error;
    }
  }, [writeContractAsync, transactionType, chainId, chainConfig.name, getBestEndpoint, reportSuccess, reportFailure, measurePerformance, recordMetric, attempt, isPolygon]);

  // Enhanced retry with RPC endpoint switching and Polygon optimization
  const retryTransaction = useCallback(async (): Promise<void> => {
    if (!lastContractCall) {
      throw new Error('No transaction to retry');
    }
    
    if (attempt >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
    }
    
    setAttempt(prev => prev + 1);
    
    // Polygon-specific retry strategy with enhanced backoff
    let delay: number;
    if (isPolygon) {
      const retryStrategy = polygonOptimizer.getRetryStrategy(transactionType);
      delay = retryStrategy.retryDelay * Math.pow(retryStrategy.backoffMultiplier, attempt - 1);
      
      console.log(`🔄 [POLYGON-ENHANCED] Retrying ${transactionType} with optimized strategy:`, {
        delay,
        attempt: attempt + 1,
        maxRetries,
        congested: polygonOptimizer.isPolygonCongested(),
        endpoint: getBestEndpoint(),
      });
    } else {
      // Standard exponential backoff for other chains
      delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`🔄 [ENHANCED-TX] Retrying ${transactionType} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    await executeTransaction(lastContractCall);
  }, [lastContractCall, attempt, maxRetries, transactionType, executeTransaction, isPolygon, getBestEndpoint]);

  // Handle transaction success with enhanced metrics
  useEffect(() => {
    if (isSuccess && hash) {
      const duration = Date.now() - (performance.now() - timeout); // Approximate total duration
      setIsProcessing(false);
      
      console.log(`✅ [ENHANCED-TX] ${transactionType} confirmed: ${hash}`);
      
      recordMetric('transaction-confirm', duration, true, {
        chainId,
        transactionType,
        hash,
        rpcEndpoint: lastRPCEndpoint,
      });
      
      // Cache invalidation with performance tracking
      measurePerformance(
        'cache-invalidation',
        async () => {
          await invalidateAfterTransaction({
            raffleContract: optimisticData?.raffleId,
            userAddress: optimisticData?.userAddress,
            transactionType,
            immediate: true,
            chainId,
          });
        },
        { transactionType, chainId }
      ).catch(console.error);
      
      // Success notifications and callbacks
      if (enableToasts && successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(hash, {
          duration,
          rpcEndpoint: lastRPCEndpoint,
        });
      }
      
      setAttempt(0); // Reset attempt counter
    }
  }, [isSuccess, hash, transactionType, chainId, lastRPCEndpoint, recordMetric, measurePerformance, invalidateAfterTransaction, optimisticData, enableToasts, successMessage, onSuccess, timeout]);

  // Handle transaction errors with enhanced reporting
  useEffect(() => {
    if (error || receiptError) {
      const errorToHandle = error || receiptError;
      const duration = Date.now() - (performance.now() - timeout); // Approximate duration
      
      setIsProcessing(false);
      
      recordMetric('transaction-confirm', duration, false, {
        chainId,
        transactionType,
        rpcEndpoint: lastRPCEndpoint,
        error: errorToHandle instanceof Error ? errorToHandle.message : String(errorToHandle),
      });
      
      // Enhanced error handling with RPC context and Polygon optimization
      const errorMessage = errorToHandle && typeof errorToHandle === 'object' && 'message' in errorToHandle 
        ? (errorToHandle as any).message 
        : String(errorToHandle);
      
      console.error(`❌ [ENHANCED-TX] ${transactionType} error via ${lastRPCEndpoint}:`, errorMessage);
      
      if (enableToasts) {
        if (errorMessage?.includes('User rejected')) {
          toast.error('Transaction cancelled by user.');
        } else if (isPolygon && polygonUtils.isRecoverableError(errorToHandle)) {
          // Polygon-specific error handling with enhanced recovery
          const polygonMessage = polygonUtils.getPolygonErrorMessage(errorToHandle);
          const polygonAction = polygonUtils.getPolygonErrorAction(errorToHandle);
          
          toast.error(`${polygonMessage}\n${polygonAction}`);
          
          // Enhanced auto-retry for Polygon with RPC switching
          if (attempt < maxRetries && 
              (errorMessage?.includes('nonce too low') || 
               errorMessage?.includes('transaction underpriced') ||
               errorMessage?.includes('429'))) {
            console.log(`🔄 [POLYGON-ENHANCED] Auto-retrying with RPC switch: ${errorMessage}`);
            setTimeout(() => retryTransaction().catch(console.error), 3000);
          }
        } else if (errorMessage?.includes('insufficient funds')) {
          toast.error(isPolygon ? 'Insufficient POL for transaction fees' : 'Insufficient funds for transaction.');
        } else if (errorMessage?.includes('429') || errorMessage?.includes('rate limit')) {
          toast.error('Network busy. Trying different endpoint...');
          // Automatically retry with different endpoint for rate limits
          if (attempt < maxRetries) {
            setTimeout(() => retryTransaction().catch(console.error), 2000);
          }
        } else {
          toast.error(`Transaction failed: ${errorMessage || 'Unknown error'}`);
        }
      }
      
      if (onError) {
        onError(errorToHandle as Error, {
          duration,
          rpcEndpoint: lastRPCEndpoint,
        });
      }
    }
  }, [error, receiptError, transactionType, chainId, lastRPCEndpoint, recordMetric, enableToasts, onError, attempt, maxRetries, retryTransaction, timeout]);

  return {
    hash,
    error: (error || receiptError) ? (error || receiptError) as Error : null,
    isPending: isProcessing,
    isConfirming: isConfirming && isProcessing,
    isSuccess,
    executeTransaction,
    retryTransaction,
    performanceMetrics,
  };
}

// Specialized enhanced hooks for different transaction types

export function useEnhancedBuyTickets(optimisticData?: EnhancedTransactionConfig['optimisticData']) {
  return useEnhancedTransactionManager({
    transactionType: 'buy-tickets',
    successMessage: '🎫 Tickets purchased successfully!',
    enableOptimisticUpdates: true,
    optimisticData,
  });
}

export function useEnhancedSelectWinner(optimisticData?: EnhancedTransactionConfig['optimisticData']) {
  return useEnhancedTransactionManager({
    transactionType: 'select-winner',
    successMessage: '🏆 Winner selected successfully!',
    enableToasts: true,
    enableOptimisticUpdates: true,
    optimisticData,
  });
}

export function useEnhancedCreateRaffle(onSuccess?: (hash: string, metrics: any) => void) {
  return useEnhancedTransactionManager({
    transactionType: 'create-raffle',
    successMessage: '🎆 Raffle created successfully!',
    onSuccess,
    enableOptimisticUpdates: false,
  });
}

export function useEnhancedCancelRaffle(optimisticData?: EnhancedTransactionConfig['optimisticData']) {
  return useEnhancedTransactionManager({
    transactionType: 'cancel-raffle',
    successMessage: '💫 Raffle cancelled successfully!',
    enableOptimisticUpdates: true,
    optimisticData,
  });
}