/**
 * Gas Status Hook
 * Provides real-time gas information and user notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useChainId } from 'wagmi';
import { alchemyGasOracle, gasUtils, type OperationType, type CongestionLevel } from '../utils/alchemyGasOracle';
import { polygonOptimizer } from '../utils/polygonOptimizations';

export interface GasStatus {
  baseFeeGwei: number;
  congestionLevel: CongestionLevel;
  recommendedAction: string;
  shouldWarn: boolean;
  isLoading: boolean;
  error?: string;
}

export interface GasEstimateResult {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedCostUSD?: number;
  congestionLevel: string;
  formattedGasPrice: string;
  formattedCost: string;
  congestionColor: string;
  congestionEmoji: string;
}

/**
 * Hook for monitoring Polygon gas status
 */
export function useGasStatus() {
  const chainId = useChainId();
  const [gasStatus, setGasStatus] = useState<GasStatus>({
    baseFeeGwei: 0,
    congestionLevel: 'medium' as CongestionLevel,
    recommendedAction: 'Loading gas status...',
    shouldWarn: false,
    isLoading: true
  });

  const fetchGasStatus = useCallback(async () => {
    // Only fetch for Polygon
    if (chainId !== 137) {
      setGasStatus({
        baseFeeGwei: 0,
        congestionLevel: 'low',
        recommendedAction: 'Gas monitoring available on Polygon only',
        shouldWarn: false,
        isLoading: false
      });
      return;
    }

    try {
      setGasStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      const status = await polygonOptimizer.getNetworkStatus();
      
      setGasStatus({
        baseFeeGwei: status.baseFeeGwei,
        congestionLevel: status.congestionLevel as CongestionLevel,
        recommendedAction: status.recommendedAction,
        shouldWarn: status.shouldWarn,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch gas status:', error);
      setGasStatus({
        baseFeeGwei: 0,
        congestionLevel: 'high',
        recommendedAction: 'Unable to check gas status',
        shouldWarn: true,
        isLoading: false,
        error: 'Failed to fetch gas status'
      });
    }
  }, [chainId]);

  useEffect(() => {
    fetchGasStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchGasStatus, 30000);
    
    return () => clearInterval(interval);
  }, [fetchGasStatus]);

  return {
    gasStatus,
    refreshGasStatus: fetchGasStatus
  };
}

/**
 * Hook for getting gas estimates for specific operations
 */
export function useGasEstimate() {
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const getGasEstimate = useCallback(async (
    operation: OperationType,
    contractCall?: any
  ): Promise<GasEstimateResult | null> => {
    // Only estimate for Polygon
    if (chainId !== 137) {
      return null;
    }

    try {
      setIsLoading(true);
      setError(undefined);
      
      const gasSettings = await polygonOptimizer.getOptimizedGasSettings(operation, contractCall);
      
      const result: GasEstimateResult = {
        ...gasSettings,
        formattedGasPrice: gasUtils.formatGasPrice(BigInt(gasSettings.maxFeePerGas)),
        formattedCost: gasSettings.estimatedCostUSD ? gasUtils.formatCost(gasSettings.estimatedCostUSD) : 'Unknown',
        congestionColor: gasUtils.getCongestionColor(gasSettings.congestionLevel as CongestionLevel),
        congestionEmoji: gasUtils.getCongestionEmoji(gasSettings.congestionLevel as CongestionLevel)
      };
      
      return result;
    } catch (error) {
      console.error('Failed to get gas estimate:', error);
      setError('Failed to estimate gas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  return {
    getGasEstimate,
    isLoading,
    error
  };
}

/**
 * Hook for gas-aware transaction execution
 */
export function useGasAwareTransaction() {
  const chainId = useChainId();
  const { getGasEstimate } = useGasEstimate();

  const executeWithOptimalGas = useCallback(async (
    operation: OperationType,
    transactionFunction: (gasSettings: any) => Promise<any>,
    contractCall?: any
  ) => {
    // For non-Polygon chains, execute without gas optimization
    if (chainId !== 137) {
      return await transactionFunction({});
    }

    try {
      // Get optimal gas settings
      const gasEstimate = await getGasEstimate(operation, contractCall);
      
      if (!gasEstimate) {
        throw new Error('Failed to get gas estimate');
      }

      // Log gas information for debugging
      console.log(`⚡ [GAS AWARE TX] ${operation}:`, {
        gasPrice: gasEstimate.formattedGasPrice,
        cost: gasEstimate.formattedCost,
        congestion: gasEstimate.congestionLevel
      });

      // Execute transaction with optimal gas settings - CRITICAL FIX: Convert to BigInt
      return await transactionFunction({
        gasLimit: BigInt(gasEstimate.gasLimit),
        maxFeePerGas: BigInt(gasEstimate.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(gasEstimate.maxPriorityFeePerGas)
      });
    } catch (error) {
      console.error(`🚨 [GAS AWARE TX] Failed to execute ${operation}:`, error);
      throw error;
    }
  }, [chainId, getGasEstimate]);

  return {
    executeWithOptimalGas
  };
}

/**
 * Utility hook for gas-related UI helpers
 */
export function useGasHelpers() {
  const formatGasPrice = useCallback((gasPrice: string | bigint): string => {
    const gasPriceBigInt = typeof gasPrice === 'string' ? BigInt(gasPrice) : gasPrice;
    return gasUtils.formatGasPrice(gasPriceBigInt);
  }, []);

  const formatCost = useCallback((costUSD: number): string => {
    return gasUtils.formatCost(costUSD);
  }, []);

  const getCongestionIndicator = useCallback((level: CongestionLevel) => {
    return {
      color: gasUtils.getCongestionColor(level),
      emoji: gasUtils.getCongestionEmoji(level),
      level
    };
  }, []);

  const shouldShowGasWarning = useCallback((level: CongestionLevel, costUSD?: number): boolean => {
    return level === 'extreme' || (level === 'high' && (costUSD || 0) > 2);
  }, []);

  return {
    formatGasPrice,
    formatCost,
    getCongestionIndicator,
    shouldShowGasWarning
  };
}