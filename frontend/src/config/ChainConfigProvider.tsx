/**
 * Chain Configuration Provider
 * React context for accessing chain-specific configurations throughout the app
 * Updated to use unified configuration system
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useChainId } from 'wagmi';
import { 
  ChainConfig, 
  getChainConfig, 
  getChainName, 
  isApeChain, 
  isPolygonChain,
  isSupportedChain,
  getOperationConfig
} from './unified';

/**
 * Chain configuration context interface
 */
interface ChainConfigContextValue {
  // Current chain information
  chainId: number | undefined;
  config: ChainConfig;
  chainName: string;
  isApeChain: boolean;
  isPolygon: boolean;
  isSupported: boolean;
  
  // Configuration access helpers
  getPollingInterval: () => number;
  getFactoryAddress: () => string;
  getTemplateAddress: () => string;
  getRpcUrl: () => string;
  getExplorerUrl: () => string;
  
  // Operation-specific configurations
  getOperationTimeout: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => number;
  getOperationRetries: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => number;
  
  // Utility functions
  shouldUseOptimisticUpdates: () => boolean;
  shouldUseFastPolling: () => boolean;
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
      getPollingInterval: () => config.settings.pollingInterval,
      getFactoryAddress: () => config.contracts.factory,
      getTemplateAddress: () => config.contracts.template,
      getRpcUrl: () => config.rpcUrl,
      getExplorerUrl: () => config.explorerUrl,
      
      // Operation-specific configurations
      getOperationTimeout: (operation) => {
        const opConfig = getOperationConfig(chainId, operation);
        return opConfig.timeout;
      },
      
      getOperationRetries: (operation) => {
        const opConfig = getOperationConfig(chainId, operation);
        return opConfig.retries;
      },
      
      // Utility functions
      shouldUseOptimisticUpdates: () => {
        // ApeChain can use more aggressive optimistic updates due to faster finality
        return isApe;
      },
      
      shouldUseFastPolling: () => {
        // Use fast polling for ApeChain, normal for Polygon to avoid rate limits
        return isApe;
      },
    };
  }, [chainId]);
  
  // Log chain configuration changes for debugging
  React.useEffect(() => {
    if (chainId) {
      console.log(`🔧 [CHAIN-CONFIG] Active configuration for ${contextValue.chainName} (${chainId}):`, {
        polling: contextValue.config.settings.pollingInterval,
        timeout: contextValue.config.settings.timeout,
        retries: contextValue.config.settings.retries,
        factory: contextValue.config.contracts.factory,
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
      baseTimeout: config.settings.timeout,
    };
  }, [chainId, operation, config]);
};