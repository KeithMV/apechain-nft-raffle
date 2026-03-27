/**
 * Centralized Chain Configuration System
 * Single source of truth for all chain-specific settings
 * Replaces scattered chainId === 137 checks throughout the codebase
 */

import { CHAIN_IDS, type ChainId } from '../constants/chains';

export { CHAIN_IDS, type ChainId } from '../constants/chains';

/**
 * Comprehensive chain configuration interface
 * Covers all aspects that differ between chains
 */
export interface ChainConfiguration {
  // Network identification
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  
  // Polling and refresh intervals
  polling: {
    interval: number;           // Base polling interval in ms
    fastInterval: number;       // Fast polling for active operations
    slowInterval: number;       // Slow polling for background updates
  };
  
  // Batch processing optimization
  batch: {
    contractSize: number;       // Number of contracts to batch together
    raffleSize: number;         // Number of raffle info calls to batch
    contractDelay: number;      // Delay between contract batches (ms)
    raffleDelay: number;        // Delay between raffle batches (ms)
    maxConcurrent: number;      // Maximum concurrent batch operations
  };
  
  // Transaction handling
  transaction: {
    timeoutMultiplier: number;  // Multiplier for base timeouts
    retryAttempts: number;      // Number of retry attempts
    retryDelay: number;         // Base retry delay (ms)
    gasMultiplier: number;      // Gas estimation multiplier
  };
  
  // React Query cache optimization
  cache: {
    staleTime: number;          // How long data stays fresh (ms)
    gcTime: number;             // Garbage collection time (ms)
    userStaleTime: number;      // User-specific data stale time
    userGcTime: number;         // User-specific data GC time
    invalidationDelay: number;  // Delay before cache invalidation (ms)
    maxPages: number;           // Maximum pages to keep in infinite queries
  };
  
  // NFT scanning and metadata
  nft: {
    scanTimeout: number;        // Timeout for NFT scanning operations
    chunkSize: bigint;          // Block chunk size for scanning
    maxChunks: number;          // Maximum chunks to scan
    targetCount: number;        // Target NFT count before stopping scan
    metadataTimeout: number;    // Timeout for metadata fetching
  };
  
  // RPC and network settings
  rpc: {
    healthCheckInterval: number; // How often to check RPC health
    failureThreshold: number;    // Failures before marking RPC as unhealthy
    recoveryTime: number;        // Time to wait before retrying failed RPC
  };
}

/**
 * ApeChain Configuration
 * Optimized for low traffic, fast finality network
 */
const APECHAIN_CONFIG: ChainConfiguration = {
  name: 'ApeChain',
  shortName: 'APE',
  nativeCurrency: {
    name: 'ApeCoin',
    symbol: 'APE',
    decimals: 18,
  },
  
  polling: {
    interval: 6000,      // 6 seconds - balanced for low traffic
    fastInterval: 3000,  // 3 seconds for active operations
    slowInterval: 10000, // 10 seconds for background
  },
  
  batch: {
    contractSize: 3,     // Smaller batches for faster response
    raffleSize: 3,       // Smaller batches for faster response
    contractDelay: 10,   // Short delay - network is fast
    raffleDelay: 15,     // Short delay - network is fast
    maxConcurrent: 5,    // Can handle more concurrent operations
  },
  
  transaction: {
    timeoutMultiplier: 1.0,  // Base timeouts work well
    retryAttempts: 2,        // Fewer retries needed
    retryDelay: 1000,        // 1 second retry delay
    gasMultiplier: 1.1,      // 10% gas buffer
  },
  
  cache: {
    staleTime: 30000,        // 30 seconds - can be more aggressive
    gcTime: 60000,           // 1 minute GC
    userStaleTime: 15000,    // 15 seconds for user data
    userGcTime: 30000,       // 30 seconds user GC
    invalidationDelay: 0,    // Immediate invalidation
    maxPages: 10,            // Keep more pages (network is fast)
  },
  
  nft: {
    scanTimeout: 15000,      // 15 seconds timeout
    chunkSize: 100000n,      // Large chunks - network can handle it
    maxChunks: 10,           // More chunks allowed
    targetCount: 20,         // Higher target count
    metadataTimeout: 10000,  // 10 seconds for metadata
  },
  
  rpc: {
    healthCheckInterval: 30000,  // Check every 30 seconds
    failureThreshold: 3,         // 3 failures before marking unhealthy
    recoveryTime: 60000,         // 1 minute recovery time
  },
};

/**
 * Polygon Configuration
 * PERFORMANCE-FIRST OPTIMIZATION - Prioritizing speed over extreme reliability
 * Based on user feedback that pages load too slowly
 */
const POLYGON_CONFIG: ChainConfiguration = {
  name: 'Polygon',
  shortName: 'POL',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  
  polling: {
    interval: 4000,      // AGGRESSIVE: 4 seconds - much faster UI updates
    fastInterval: 2000,  // AGGRESSIVE: 2 seconds for active operations
    slowInterval: 6000,  // AGGRESSIVE: 6 seconds for background (much faster)
  },
  
  batch: {
    contractSize: 5,     // INCREASED: Larger batches for efficiency
    raffleSize: 5,       // INCREASED: Larger batches for efficiency
    contractDelay: 5,    // AGGRESSIVE: Minimal delay (5ms)
    raffleDelay: 10,     // AGGRESSIVE: Minimal delay (10ms)
    maxConcurrent: 4,    // INCREASED: More concurrent operations
  },
  
  transaction: {
    timeoutMultiplier: 1.5,  // REDUCED: From 2.0x to 1.5x (faster timeouts)
    retryAttempts: 2,        // Keep at 2 retries
    retryDelay: 2000,        // AGGRESSIVE: From 3000ms to 2000ms
    gasMultiplier: 1.2,      // REDUCED: From 1.3x to 1.2x (lower gas, faster)
  },
  
  cache: {
    staleTime: 15000,        // AGGRESSIVE: From 45s to 15s (much fresher data)
    gcTime: 30000,           // AGGRESSIVE: From 90s to 30s
    userStaleTime: 10000,    // AGGRESSIVE: From 30s to 10s
    userGcTime: 20000,       // AGGRESSIVE: From 60s to 20s
    invalidationDelay: 500,  // AGGRESSIVE: From 3000ms to 500ms (almost immediate)
    maxPages: 8,             // INCREASED: From 5 to 8 (keep more in memory)
  },
  
  nft: {
    scanTimeout: 15000,      // AGGRESSIVE: From 25s to 15s
    chunkSize: 30000n,       // INCREASED: From 20000n to 30000n (larger chunks)
    maxChunks: 10,           // INCREASED: From 8 to 10
    targetCount: 20,         // INCREASED: From 15 to 20
    metadataTimeout: 8000,   // AGGRESSIVE: From 15s to 8s
  },
  
  rpc: {
    healthCheckInterval: 30000,  // REDUCED: From 20s to 30s (less frequent, less overhead)
    failureThreshold: 3,         // INCREASED: From 2 to 3 (more tolerant)
    recoveryTime: 60000,         // AGGRESSIVE: From 120s to 60s (1 minute recovery)
  },
};

/**
 * Chain configuration registry
 * Maps chain IDs to their configurations
 */
export const CHAIN_CONFIGS: Partial<Record<ChainId, ChainConfiguration>> = {
  [CHAIN_IDS.APECHAIN_MAINNET]: APECHAIN_CONFIG,
  [CHAIN_IDS.POLYGON_MAINNET]: POLYGON_CONFIG,
};

/**
 * Utility functions for chain configuration access
 */

/**
 * Get configuration for a specific chain
 */
export function getChainConfig(chainId: number | undefined): ChainConfiguration {
  if (!chainId || !CHAIN_CONFIGS[chainId as ChainId]) {
    console.warn(`Unknown chain ID: ${chainId}, falling back to ApeChain config`);
    return CHAIN_CONFIGS[CHAIN_IDS.APECHAIN_MAINNET]!;
  }
  
  return CHAIN_CONFIGS[chainId as ChainId]!;
}

/**
 * Check if a chain is supported
 */
export function isSupportedChain(chainId: number | undefined): chainId is ChainId {
  return chainId !== undefined && chainId in CHAIN_CONFIGS;
}

/**
 * Get chain name from ID
 */
export function getChainName(chainId: number | undefined): string {
  const config = getChainConfig(chainId);
  return config.name;
}

/**
 * Check if chain is ApeChain
 */
export function isApeChain(chainId: number | undefined): boolean {
  return chainId === CHAIN_IDS.APECHAIN_MAINNET;
}

/**
 * Check if chain is Polygon
 */
export function isPolygonChain(chainId: number | undefined): boolean {
  return chainId === CHAIN_IDS.POLYGON_MAINNET;
}

/**
 * Get optimized settings for specific operation types
 */
export function getOperationConfig(chainId: number | undefined, operation: 'buy-tickets' | 'select-winner' | 'create-raffle' | 'cancel-raffle') {
  const config = getChainConfig(chainId);
  
  const operationMultipliers = {
    'buy-tickets': 1.0,
    'select-winner': 2.0,    // Winner selection takes longer
    'create-raffle': 1.5,    // Raffle creation is moderately complex
    'cancel-raffle': 1.2,    // Cancellation is relatively quick
  };
  
  const multiplier = operationMultipliers[operation];
  
  return {
    timeout: 20000 * config.transaction.timeoutMultiplier * multiplier,
    retries: config.transaction.retryAttempts,
    retryDelay: config.transaction.retryDelay,
    staleTime: config.cache.staleTime / multiplier, // More frequent updates for complex operations
  };
}