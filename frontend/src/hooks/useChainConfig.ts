/**
 * Chain Configuration Hook
 * Simple hook for accessing unified chain configurations
 */

import { useChainId } from 'wagmi';
import { 
  getChainConfig, 
  getOperationConfig, 
  isApeChain, 
  isPolygonChain,
  getQueryConfig 
} from '../config/unified';

/**
 * Unified hook for chain configuration
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
    factoryAddress: config.contracts.factory,
    templateAddress: config.contracts.template,
    rpcUrl: config.rpcUrl,
    explorerUrl: config.explorerUrl,
    
    // Settings
    pollingInterval: config.settings.pollingInterval,
    timeout: config.settings.timeout,
    retries: config.settings.retries,
    rateLimit: config.settings.rateLimit,
    invalidationDelay: 1000, // 1s invalidation delay for both chains
    
    // Query configuration
    queryConfig: getQueryConfig(chainId),
    
    // Operation-specific helpers
    getOperationTimeout: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => {
      return getOperationConfig(chainId, operation).timeout;
    },
    
    getOperationRetries: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => {
      return getOperationConfig(chainId, operation).retries;
    },
  };
}
