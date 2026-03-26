/**
 * Polygon Network Configuration Constants
 * Centralized configuration for all Polygon-specific optimizations
 */

export const POLYGON_CHAIN_ID = 137;

/**
 * React Query Cache Configuration for Polygon
 * Longer times due to higher network congestion and slower finality
 */
export const POLYGON_CACHE_CONFIG = {
  // Standard cache times for most operations
  staleTime: 45000,        // 45 seconds
  gcTime: 90000,           // 90 seconds (garbage collection)
  
  // User-specific operations (more frequent updates needed)
  userStaleTime: 25000,    // 25 seconds
  userGcTime: 45000,       // 45 seconds
  
  // Cache invalidation delay (due to slower block finality)
  invalidationDelay: 3000, // 3 seconds
} as const;

/**
 * Batch Processing Configuration for Polygon
 * Optimized for higher network congestion
 */
export const POLYGON_BATCH_CONFIG = {
  // Contract batch processing
  contractBatchSize: 5,    // Larger batches to reduce RPC calls
  contractDelay: 20,       // 20ms delay between batches
  
  // Raffle info batch processing (more intensive)
  raffleBatchSize: 2,      // Smaller batches for complex operations
  raffleDelay: 25,         // 25ms delay (20ms + 5ms extra)
} as const;

/**
 * Transaction Configuration for Polygon
 * Adjusted for network characteristics
 */
export const POLYGON_TRANSACTION_CONFIG = {
  // Timeout multiplier for all transaction types
  timeoutMultiplier: 1.2,  // 20% longer timeouts
  
  // NFT scanning configuration
  nftScanTimeout: 25000,   // 25 seconds
  nftChunkSize: 25000n,    // 25k blocks per chunk
  nftMaxChunks: 8,         // Maximum chunks to scan
  nftTargetCount: 15,      // Stop scanning after finding 15 NFTs
} as const;

/**
 * Utility function to check if current chain is Polygon
 */
export const isPolygonChain = (chainId: number | undefined): boolean => {
  return chainId === POLYGON_CHAIN_ID;
};

/**
 * Get chain-specific cache configuration
 */
export const getChainCacheConfig = (chainId: number | undefined) => {
  if (isPolygonChain(chainId)) {
    return POLYGON_CACHE_CONFIG;
  }
  
  // ApeChain/default configuration
  return {
    staleTime: 30000,
    gcTime: 60000,
    userStaleTime: 15000,
    userGcTime: 30000,
    invalidationDelay: 0,
  } as const;
};

/**
 * Get chain-specific batch configuration
 */
export const getChainBatchConfig = (chainId: number | undefined) => {
  if (isPolygonChain(chainId)) {
    return POLYGON_BATCH_CONFIG;
  }
  
  // ApeChain/default configuration
  return {
    contractBatchSize: 3,
    contractDelay: 10,
    raffleBatchSize: 3,
    raffleDelay: 15,
  } as const;
};

/**
 * Get chain-specific transaction configuration
 */
export const getChainTransactionConfig = (chainId: number | undefined) => {
  if (isPolygonChain(chainId)) {
    return POLYGON_TRANSACTION_CONFIG;
  }
  
  // ApeChain/default configuration
  return {
    timeoutMultiplier: 1.0,
    nftScanTimeout: 15000,
    nftChunkSize: 100000n,
    nftMaxChunks: 10,
    nftTargetCount: 20,
  } as const;
};