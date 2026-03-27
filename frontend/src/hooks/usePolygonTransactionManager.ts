/**
 * Polygon-Specialized Transaction Manager
 * Maximum optimization for Polygon network with congestion handling,
 * adaptive gas pricing, and intelligent retry strategies
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';
import { useChainConfig } from './useChainConfig';
import { useUnifiedCacheInvalidation } from './useUnifiedCacheInvalidation';
import { polygonOptimizer, polygonUtils } from '../utils/polygonOptimizations';
import { useRPCHealthMonitor } from './useRPCHealthMonitor';

export interface PolygonTransactionConfig {
  transactionType: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle';
  successMessage?: string;
  onSuccess?: (hash: string, metrics: PolygonTransactionMetrics) => void;
  onError?: (error: Error, metrics: PolygonTransactionMetrics) => void;
  enableToasts?: boolean;
  enableOptimisticUpdates?: boolean;
  optimisticData?: {
    raffleId?: string;
    userAddress?: string;
    expectedTicketCount?: number;
    expectedBalance?: string;
  };
}

export interface PolygonTransactionMetrics {
  duration: number;
  gasUsed?: bigint;
  gasPrice?: string;
  rpcEndpoint: string;
  congestionLevel: 'low' | 'medium' | 'high';
  retryCount: number;
  finalGasMultiplier: number;
}

export interface PolygonTransactionState {
  hash: string | undefined;
  error: Error | null;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  executeTransaction: (contractCall: any) => Promise<string>;
  retryTransaction: () => Promise<void>;
  polygonMetrics: PolygonTransactionMetrics | null;
  congestionStatus: {
    level: 'low' | 'medium' | 'high';
    recommendedAction: string;
  };
}

export function usePolygonTransactionManager(config: PolygonTransactionConfig): PolygonTransactionState {
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
  const { chainId, isPolygon } = useChainConfig();
  const { getBestEndpoint, reportFailure, reportSuccess } = useRPCHealthMonitor(chainId);
  const { invalidateAfterTransaction } = useUnifiedCacheInvalidation();
  
  // Wagmi hooks
  const { writeContractAsync, data: hash, error, isPending: wagmiPending } = useWriteContract();
  
  // State management
  const [attempt, setAttempt] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastContractCall, setLastContractCall] = useState<any>(null);
  const [polygonMetrics, setPolygonMetrics] = useState<PolygonTransactionMetrics | null>(null);
  const [lastRPCEndpoint, setLastRPCEndpoint] = useState<string>('');
  const [adaptiveGasMultiplier, setAdaptiveGasMultiplier] = useState(1.0);
  
  // Performance tracking
  const startTimeRef = useRef<number>(0);
  const lastSuccessHash = useRef<string | null>(null);

  // Get optimized timeout for Polygon
  const timeout = polygonOptimizer.getOptimizedTimeout(transactionType);
  
  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({
    hash,
    timeout,
  });

  // Determine congestion status
  const congestionStatus = {
    level: polygonOptimizer.isPolygonCongested() ? 'high' : 
           polygonOptimizer.getPerformanceMetrics().failureRate > 0.15 ? 'medium' : 'low',
    recommendedAction: polygonOptimizer.isPolygonCongested() 
      ? 'Network congested - using maximum gas optimization'
      : 'Network stable - using standard optimization'
  } as const;

  // Adaptive gas pricing based on network conditions
  const getAdaptiveGasSettings = useCallback(async () => {
    const baseSettings = await polygonOptimizer.getOptimizedGasSettings(transactionType);
    const congestionMultiplier = congestionStatus.level === 'high' ? 1.3 : 
                                congestionStatus.level === 'medium' ? 1.15 : 1.0;
    
    // Parse current gas settings
    const currentMaxFee = parseInt(baseSettings.maxFeePerGas);
    const currentPriorityFee = parseInt(baseSettings.maxPriorityFeePerGas);
    
    // Increase gas based on previous failures
    const failureMultiplier = 1 + (attempt * 0.2);
    const finalMultiplier = congestionMultiplier * failureMultiplier;
    
    setAdaptiveGasMultiplier(finalMultiplier);
    
    return {
      ...baseSettings,
      maxFeePerGas: Math.floor(currentMaxFee * finalMultiplier).toString(),
      maxPriorityFeePerGas: Math.floor(currentPriorityFee * finalMultiplier).toString(),
      finalMultiplier,
    };
  }, [transactionType, congestionStatus.level, attempt]);

  // Execute transaction with maximum Polygon optimization
  const executeTransaction = useCallback(async (contractCall: any): Promise<string> => {
    if (!isPolygon) {
      throw new Error('PolygonTransactionManager can only be used on Polygon network');
    }

    startTimeRef.current = Date.now();
    const bestEndpoint = getBestEndpoint();
    
    setIsProcessing(true);
    setLastContractCall(contractCall);
    setLastRPCEndpoint(bestEndpoint);
    
    console.log(`🔶 [POLYGON-SPECIALIZED] Starting ${transactionType} with adaptive optimization:`, {
      congestionLevel: congestionStatus.level,
      endpoint: bestEndpoint,
      attempt: attempt + 1,
    });
    
    try {
      // Get adaptive gas settings
      const gasSettings = await getAdaptiveGasSettings();
      
      // Apply maximum Polygon optimization
      const optimizedContractCall = {
        ...contractCall,
        gasLimit: gasSettings.gasLimit,
        maxFeePerGas: gasSettings.maxFeePerGas,
        maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas,
        // Add type 2 transaction fields for better Polygon compatibility
        type: 2,
      };
      
      console.log(`🔶 [POLYGON-SPECIALIZED] Adaptive gas optimization:`, {
        gasLimit: gasSettings.gasLimit,
        maxFeePerGas: gasSettings.maxFeePerGas,
        maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas,
        finalMultiplier: gasSettings.finalMultiplier,
        congestionLevel: congestionStatus.level,
      });
      
      const result = await writeContractAsync(optimizedContractCall);
      
      const duration = Date.now() - startTimeRef.current;
      
      // Record success with detailed metrics
      polygonOptimizer.recordSuccess(duration);
      reportSuccess(bestEndpoint, duration);
      
      // Update metrics
      setPolygonMetrics({
        duration,
        rpcEndpoint: bestEndpoint,
        congestionLevel: congestionStatus.level,
        retryCount: attempt,
        finalGasMultiplier: gasSettings.finalMultiplier,
      });
      
      console.log(`✅ [POLYGON-SPECIALIZED] ${transactionType} submitted successfully:`, {
        duration,
        finalMultiplier: gasSettings.finalMultiplier,
        congestionLevel: congestionStatus.level,
        endpoint: bestEndpoint,
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTimeRef.current;
      
      // Record failure with detailed tracking
      polygonOptimizer.recordFailure();
      reportFailure(bestEndpoint);
      
      // Handle Polygon-specific errors with enhanced recovery
      const handled = polygonOptimizer.handlePolygonRPCError(error, bestEndpoint);
      
      // Update metrics even on failure
      setPolygonMetrics({
        duration,
        rpcEndpoint: bestEndpoint,
        congestionLevel: congestionStatus.level,
        retryCount: attempt,
        finalGasMultiplier: adaptiveGasMultiplier,
      });
      
      console.error(`❌ [POLYGON-SPECIALIZED] ${transactionType} failed:`, {
        duration,
        error: error instanceof Error ? error.message : String(error),
        handled,
        congestionLevel: congestionStatus.level,
        endpoint: bestEndpoint,
      });
      
      setIsProcessing(false);
      throw error;
    }
  }, [writeContractAsync, transactionType, isPolygon, getBestEndpoint, reportSuccess, reportFailure, getAdaptiveGasSettings, congestionStatus.level, attempt, adaptiveGasMultiplier]);

  // Intelligent retry with Polygon-specific strategy
  const retryTransaction = useCallback(async (): Promise<void> => {
    if (!lastContractCall) {
      throw new Error('No transaction to retry');
    }
    
    const retryStrategy = polygonOptimizer.getRetryStrategy(transactionType);
    
    if (attempt >= retryStrategy.maxRetries) {
      throw new Error(`Maximum Polygon retry attempts (${retryStrategy.maxRetries}) exceeded`);
    }
    
    setAttempt(prev => prev + 1);
    
    // Adaptive delay based on congestion and error type
    const baseDelay = retryStrategy.retryDelay;
    const congestionMultiplier = congestionStatus.level === 'high' ? 2.0 : 
                                congestionStatus.level === 'medium' ? 1.5 : 1.0;
    const backoffDelay = baseDelay * Math.pow(retryStrategy.backoffMultiplier, attempt);
    const finalDelay = Math.floor(backoffDelay * congestionMultiplier);
    
    console.log(`🔄 [POLYGON-SPECIALIZED] Intelligent retry strategy:`, {
      attempt: attempt + 1,
      maxRetries: retryStrategy.maxRetries,
      delay: finalDelay,
      congestionLevel: congestionStatus.level,
      newEndpoint: getBestEndpoint(),
    });
    
    await new Promise(resolve => setTimeout(resolve, finalDelay));
    await executeTransaction(lastContractCall);
  }, [lastContractCall, attempt, executeTransaction, transactionType, congestionStatus.level, getBestEndpoint]);

  // Handle transaction success with enhanced Polygon metrics
  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash.current) {
      lastSuccessHash.current = hash;
      setIsProcessing(false);
      
      const finalDuration = Date.now() - startTimeRef.current;
      
      console.log(`✅ [POLYGON-SPECIALIZED] ${transactionType} confirmed:`, {
        hash,
        totalDuration: finalDuration,
        congestionLevel: congestionStatus.level,
        retryCount: attempt,
      });
      
      // Enhanced cache invalidation with Polygon-specific delay
      setTimeout(() => {
        invalidateAfterTransaction({
          raffleContract: optimisticData?.raffleId,
          userAddress: optimisticData?.userAddress,
          transactionType,
          immediate: true,
          chainId,
        });
      }, 5000); // 5 second delay for Polygon block finality
      
      if (enableToasts && successMessage) {
        toast.success(`${successMessage} (${congestionStatus.level} congestion)`);
      }
      
      if (onSuccess && polygonMetrics) {
        onSuccess(hash, {
          ...polygonMetrics,
          duration: finalDuration,
        });
      }
      
      setAttempt(0); // Reset attempt counter
    }
  }, [isSuccess, hash, transactionType, congestionStatus.level, attempt, invalidateAfterTransaction, optimisticData, chainId, enableToasts, successMessage, onSuccess, polygonMetrics]);

  // Handle transaction errors with enhanced Polygon error handling
  useEffect(() => {
    if (error || receiptError) {
      const errorToHandle = error || receiptError;
      setIsProcessing(false);
      
      const finalDuration = Date.now() - startTimeRef.current;
      
      if (polygonUtils.isRecoverableError(errorToHandle)) {
        const polygonMessage = polygonUtils.getPolygonErrorMessage(errorToHandle);
        const polygonAction = polygonUtils.getPolygonErrorAction(errorToHandle);
        
        if (enableToasts) {
          toast.error(`${polygonMessage}\n${polygonAction}\n(${congestionStatus.level} congestion)`);
        }
        
        // Enhanced auto-retry for recoverable errors
        const errorMessage = errorToHandle instanceof Error ? errorToHandle.message : String(errorToHandle);
        if (attempt < polygonOptimizer.getRetryStrategy(transactionType).maxRetries && 
            (errorMessage.includes('nonce too low') || 
             errorMessage.includes('transaction underpriced') ||
             errorMessage.includes('429'))) {
          console.log(`🔄 [POLYGON-SPECIALIZED] Auto-retrying recoverable error: ${errorMessage}`);
          setTimeout(() => retryTransaction().catch(console.error), 4000);
        }
      } else if (enableToasts) {
        toast.error(`Transaction failed on Polygon (${congestionStatus.level} congestion)`);
      }
      
      if (onError && polygonMetrics) {
        onError(errorToHandle as Error, {
          ...polygonMetrics,
          duration: finalDuration,
        });
      }
    }
  }, [error, receiptError, enableToasts, onError, polygonMetrics, congestionStatus.level, attempt, transactionType, retryTransaction]);

  return {
    hash,
    error: (error || receiptError) ? (error || receiptError) as Error : null,
    isPending: isProcessing,
    isConfirming: isConfirming && isProcessing,
    isSuccess,
    executeTransaction,
    retryTransaction,
    polygonMetrics,
    congestionStatus,
  };
}

// Specialized Polygon hooks for different transaction types

export function usePolygonBuyTickets(optimisticData?: PolygonTransactionConfig['optimisticData']) {
  return usePolygonTransactionManager({
    transactionType: 'buy-tickets',
    successMessage: '🎫 Tickets purchased on Polygon!',
    enableOptimisticUpdates: true,
    optimisticData,
  });
}

export function usePolygonSelectWinner(optimisticData?: PolygonTransactionConfig['optimisticData']) {
  return usePolygonTransactionManager({
    transactionType: 'select-winner',
    successMessage: '🏆 Winner selected on Polygon!',
    enableOptimisticUpdates: true,
    optimisticData,
  });
}

export function usePolygonCreateRaffle(onSuccess?: (hash: string, metrics: PolygonTransactionMetrics) => void) {
  return usePolygonTransactionManager({
    transactionType: 'create-raffle',
    successMessage: '🎆 Raffle created on Polygon!',
    onSuccess,
    enableOptimisticUpdates: false,
  });
}

export function usePolygonCancelRaffle(optimisticData?: PolygonTransactionConfig['optimisticData']) {
  return usePolygonTransactionManager({
    transactionType: 'cancel-raffle',
    successMessage: '💫 Raffle cancelled on Polygon!',
    enableOptimisticUpdates: true,
    optimisticData,
  });
}