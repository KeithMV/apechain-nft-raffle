/**
 * Chain Configuration Hook
 * Simple hook for accessing chain-specific configurations
 * Replaces scattered chainId === 137 checks throughout the codebase
 */

import { useChainId } from 'wagmi';
import { getChainConfig, getOperationConfig, isApeChain, isPolygonChain } from '../config/chainConfigurations';

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

/**
 * Legacy compatibility - gradually replace these with useChainConfig
 */
export const getChainCacheConfig = (chainId: number | undefined) => {
  const config = getChainConfig(chainId);
  return {
    staleTime: config.cache.staleTime,
    gcTime: config.cache.gcTime,
    userStaleTime: config.cache.userStaleTime,
    userGcTime: config.cache.userGcTime,
    invalidationDelay: config.cache.invalidationDelay,
  };
};

export const getChainBatchConfig = (chainId: number | undefined) => {
  const config = getChainConfig(chainId);
  return {
    contractBatchSize: config.batch.contractSize,
    contractDelay: config.batch.contractDelay,
    raffleBatchSize: config.batch.raffleSize,
    raffleDelay: config.batch.raffleDelay,
  };
};

export const getChainTransactionConfig = (chainId: number | undefined) => {
  const config = getChainConfig(chainId);
  return {
    timeoutMultiplier: config.transaction.timeoutMultiplier,
    nftScanTimeout: config.nft.scanTimeout,
    nftChunkSize: config.nft.chunkSize,
    nftMaxChunks: config.nft.maxChunks,
    nftTargetCount: config.nft.targetCount,
  };
};