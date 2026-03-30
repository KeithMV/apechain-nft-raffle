/**
 * Chain Configuration Hook
 * Simple hook for accessing chain-specific configurations
 * Replaces scattered chainId === 137 checks throughout the codebase
 */

import { useChainId } from 'wagmi';
import { getChainConfig, getOperationConfig, isApeChain, isPolygonChain } from '../config/wagmiUnified';

/**
 * Simple hook to get chain configuration
 * Can be used independently of the React context for simpler use cases
 */
export function useChainConfig() {
  const chainId = useChainId();
  const config = getChainConfig(chainId);
  
  return {
    chainId,
    config,
    isApeChain: isApeChain(chainId),
    isPolygon: isPolygonChain(chainId),
    
    // Quick access to common configurations
    pollingInterval: config.polling.interval,
    batchSize: config.batch.contractSize,
    timeoutMultiplier: config.transaction.timeoutMultiplier,
    staleTime: config.cache.staleTime,
    invalidationDelay: config.cache.invalidationDelay,
    
    // Operation-specific helpers
    getOperationTimeout: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => {
      return getOperationConfig(chainId, operation).timeout;
    },
    
    getOperationRetries: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => {
      return getOperationConfig(chainId, operation).retries;
    },
  };
}
