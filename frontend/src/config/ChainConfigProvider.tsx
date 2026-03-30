/**
 * Chain Configuration Provider
 * React context for accessing chain-specific configurations throughout the app
 * Replaces scattered chainId === 137 checks with centralized configuration access
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useChainId } from 'wagmi';
import { 
  ChainConfiguration, 
  getChainConfig, 
  getChainName, 
  isApeChain, 
  isPolygonChain,
  isSupportedChain,
  getOperationConfig
} from './chainConfigurations';

/**
 * Chain configuration context interface
 */
interface ChainConfigContextValue {
  // Current chain information
  chainId: number | undefined;
  config: ChainConfiguration;
  chainName: string;
  isApeChain: boolean;
  isPolygon: boolean;
  isSupported: boolean;
  
  // Configuration access helpers
  getPollingInterval: (type?: 'fast' | 'slow') => number;
  getBatchConfig: () => ChainConfiguration['batch'];
  getTransactionConfig: () => ChainConfiguration['transaction'];
  getCacheConfig: () => ChainConfiguration['cache'];
  getNFTConfig: () => ChainConfiguration['nft'];
  getRPCConfig: () => ChainConfiguration['rpc'];
  
  // Operation-specific configurations
  getOperationTimeout: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => number;
  getOperationRetries: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => number;
  getOperationStaleTime: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => number;
  
  // Utility functions
  shouldUseOptimisticUpdates: () => boolean;
  shouldUseFastPolling: () => boolean;
  getRecommendedBatchSize: (operationType: 'contract' | 'raffle') => number;
}

/**
 * Create the context with undefined default (will throw if used outside provider)
 */
const ChainConfigContext = createContext<ChainConfigContextValue | undefined>(undefined);

/**
 * Chain Configuration Provider Props
 */
interface ChainConfigProviderProps {
  children: ReactNode;
  // Optional override for testing
  overrideChainId?: number;
}

/**
 * Chain Configuration Provider Component
 * Provides centralized access to chain-specific configurations
 */
export const ChainConfigProvider: React.FC<ChainConfigProviderProps> = ({ 
  children, 
  overrideChainId 
}) => {
  const wagmiChainId = useChainId();
  const chainId = overrideChainId ?? wagmiChainId;
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo((): ChainConfigContextValue => {
    const config = getChainConfig(chainId);
    const chainName = getChainName(chainId);
    const isApe = isApeChain(chainId);
    const isPolygon = isPolygonChain(chainId);
    const isSupported = isSupportedChain(chainId);
    
    return {
      // Current chain information
      chainId,
      config,
      chainName,
      isApeChain: isApe,
      isPolygon,
      isSupported,
      
      // Configuration access helpers
      getPollingInterval: (type?: 'fast' | 'slow') => {
        switch (type) {
          case 'fast': return config.polling.fastInterval;
          case 'slow': return config.polling.slowInterval;
          default: return config.polling.interval;
        }
      },
      
      getBatchConfig: () => config.batch,
      getTransactionConfig: () => config.transaction,
      getCacheConfig: () => config.cache,
      getNFTConfig: () => config.nft,
      getRPCConfig: () => config.rpc,
      
      // Operation-specific configurations
      getOperationTimeout: (operation) => {
        const opConfig = getOperationConfig(chainId, operation);
        return opConfig.timeout;
      },
      
      getOperationRetries: (operation) => {
        const opConfig = getOperationConfig(chainId, operation);
        return opConfig.retries;
      },
      
      getOperationStaleTime: (operation) => {
        const opConfig = getOperationConfig(chainId, operation);
        return opConfig.staleTime;
      },
      
      // Utility functions
      shouldUseOptimisticUpdates: () => {
        // ApeChain can use more aggressive optimistic updates due to faster finality
        return isApe || config.cache.invalidationDelay === 0;
      },
      
      shouldUseFastPolling: () => {
        // Use fast polling for ApeChain, normal for Polygon to avoid rate limits
        return isApe;
      },
      
      getRecommendedBatchSize: (operationType) => {
        return operationType === 'contract' ? config.batch.contractSize : config.batch.raffleSize;
      },
    };
  }, [chainId]);
  
  // Log chain configuration changes for debugging
  React.useEffect(() => {
    if (chainId) {
      console.log(`🔧 [CHAIN-CONFIG] Active configuration for ${contextValue.chainName} (${chainId}):`, {
        polling: contextValue.config.polling.interval,
        batchSize: contextValue.config.batch.contractSize,
        timeoutMultiplier: contextValue.config.transaction.timeoutMultiplier,
        cacheStaleTime: contextValue.config.cache.staleTime,
        invalidationDelay: contextValue.config.cache.invalidationDelay,
      });
    }
  }, [chainId, contextValue]);
  
  return (
    <ChainConfigContext.Provider value={contextValue}>
      {children}
    </ChainConfigContext.Provider>
  );
};

/**
 * Hook to access chain configuration
 * Throws error if used outside of ChainConfigProvider
 */
export const useChainConfig = (): ChainConfigContextValue => {
  const context = useContext(ChainConfigContext);
  
  if (context === undefined) {
    throw new Error('useChainConfig must be used within a ChainConfigProvider');
  }
  
  return context;
};

/**
 * Hook to get configuration for a specific chain (useful for cross-chain operations)
 */
export const useSpecificChainConfig = (targetChainId: number | undefined) => {
  return useMemo(() => {
    if (!targetChainId) return null;
    
    const config = getChainConfig(targetChainId);
    const chainName = getChainName(targetChainId);
    const isApe = isApeChain(targetChainId);
    const isPolygon = isPolygonChain(targetChainId);
    
    return {
      chainId: targetChainId,
      config,
      chainName,
      isApeChain: isApe,
      isPolygon,
      isSupported: isSupportedChain(targetChainId),
    };
  }, [targetChainId]);
};

/**
 * Hook for operation-specific configuration
 * Useful for transaction managers and other operation-specific components
 */
export const useOperationConfig = (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => {
  const { chainId, config } = useChainConfig();
  
  return useMemo(() => {
    const opConfig = getOperationConfig(chainId, operation);
    
    return {
      timeout: opConfig.timeout,
      retries: opConfig.retries,
      retryDelay: opConfig.retryDelay,
      staleTime: opConfig.staleTime,
      // Additional derived values
      isLongRunning: operation === 'select-winner' || operation === 'create-raffle',
      requiresOptimisticUpdates: operation === 'buy-tickets' || operation === 'cancel-raffle',
      baseTimeout: 20000 * config.transaction.timeoutMultiplier,
    };
  }, [chainId, operation, config]);
};

/**
 * Hook for batch processing configuration
 * Useful for data fetching hooks that need to batch operations
 */
export const useBatchConfig = () => {
  const { config, chainName } = useChainConfig();
  
  return useMemo(() => ({
    contractBatch: {
      size: config.batch.contractSize,
      delay: config.batch.contractDelay,
      maxConcurrent: config.batch.maxConcurrent,
    },
    raffleBatch: {
      size: config.batch.raffleSize,
      delay: config.batch.raffleDelay,
      maxConcurrent: config.batch.maxConcurrent,
    },
    // Debugging helper
    debugInfo: {
      chainName,
      optimizedFor: config.batch.contractSize > 3 ? 'high-throughput' : 'low-latency',
    },
  }), [config, chainName]);
};

/**
 * Hook for cache configuration
 * Useful for React Query configurations
 */
export const useCacheConfig = () => {
  const { config, isApeChain: isApe } = useChainConfig();
  
  return useMemo(() => ({
    // Standard cache times
    staleTime: config.cache.staleTime,
    gcTime: config.cache.gcTime,
    
    // User-specific cache times (more frequent updates)
    userStaleTime: config.cache.userStaleTime,
    userGcTime: config.cache.userGcTime,
    
    // Cache invalidation settings
    invalidationDelay: config.cache.invalidationDelay,
    maxPages: config.cache.maxPages,
    
    // Derived settings
    shouldUseAggressiveCaching: isApe, // ApeChain can cache more aggressively
    refetchOnWindowFocus: !isApe, // Only refetch on focus for Polygon (slower network)
    refetchOnReconnect: true, // Always refetch on reconnect
  }), [config, isApe]);
};