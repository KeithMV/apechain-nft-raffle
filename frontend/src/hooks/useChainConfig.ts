/**
 * Chain Configuration Hook - Simplified Version
 * Direct hook for accessing simplified chain configurations
 */

import { useChainId } from 'wagmi';
import { getContractAddresses, isSupportedChain, getChainName, apeChain, polygon } from '../config/wagmi';
import { getChainConfig } from '../config/addresses';

/**
 * Simplified hook for chain configuration
 */
export function useChainConfig() {
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const isPolygon = chainId === polygon.id;
  const isApeChain = chainId === apeChain.id;
  
  return {
    chainId,
    config: getChainConfig(chainId), // Add config property for backward compatibility
    isApeChain,
    isPolygon,
    
    // Quick access to common configurations
    factoryAddress: contracts.factory,
    templateAddress: contracts.template,
    
    // Simplified settings - no complex unified config needed
    pollingInterval: 8000, // 8s for all chains
    timeout: isPolygon ? 30000 : 25000, // 30s for Polygon, 25s for ApeChain
    retries: isPolygon ? 3 : 2,
    rateLimit: 10, // 10 seconds for all chains
    invalidationDelay: 1000, // 1s invalidation delay
    
    // Operation-specific helpers - simplified
    getOperationTimeout: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => {
      const baseTimeout = isPolygon ? 30000 : 25000;
      return baseTimeout;
    },
    
    getOperationRetries: (operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') => {
      return isPolygon ? 3 : 2;
    },
  };
}
