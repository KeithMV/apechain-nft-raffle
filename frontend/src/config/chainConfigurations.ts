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
 * BALANCED OPTIMIZATION - Optimized for Polygon's specific characteristics
 * Based on Polygon's 2-second block time and high throughput capabilities
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
    interval: 6000,      // OPTIMIZED: 6 seconds - aligned with 3 block confirmations
    fastInterval: 3000,  // OPTIMIZED: 3 seconds - balanced for active operations
    slowInterval: 12000, // OPTIMIZED: 12 seconds - efficient background updates
  },
  
  batch: {
    contractSize: 3,     // OPTIMIZED: Smaller batches prevent RPC timeouts
    raffleSize: 3,       // OPTIMIZED: Smaller batches prevent RPC timeouts
    contractDelay: 50,   // OPTIMIZED: 50ms prevents rate limiting
    raffleDelay: 100,    // OPTIMIZED: 100ms prevents rate limiting
    maxConcurrent: 3,    // OPTIMIZED: Conservative to prevent RPC overload
  },
  
  transaction: {
    timeoutMultiplier: 1.8,  // OPTIMIZED: Balanced timeout for Polygon's variability
    retryAttempts: 3,        // INCREASED: More retries for Polygon's occasional issues
    retryDelay: 1500,        // OPTIMIZED: 1.5s retry delay
    gasMultiplier: 1.15,     // OPTIMIZED: 15% gas buffer for reliability
  },
  
  cache: {
    staleTime: 25000,        // OPTIMIZED: 25 seconds - balanced freshness
    gcTime: 60000,           // OPTIMIZED: 1 minute GC
    userStaleTime: 15000,    // OPTIMIZED: 15 seconds for user data
    userGcTime: 30000,       // OPTIMIZED: 30 seconds user GC
    invalidationDelay: 200,  // OPTIMIZED: 200ms delay prevents race conditions
    maxPages: 6,             // OPTIMIZED: Reduced to prevent memory pressure
  },
  
  nft: {
    scanTimeout: 20000,      // OPTIMIZED: 20 seconds - more realistic for Polygon
    chunkSize: 25000n,       // OPTIMIZED: 25k blocks - balanced chunk size
    maxChunks: 8,            // OPTIMIZED: 8 chunks max
    targetCount: 15,         // OPTIMIZED: 15 NFTs target
    metadataTimeout: 12000,  // OPTIMIZED: 12 seconds for metadata
  },
  
  rpc: {
    healthCheckInterval: 45000,  // OPTIMIZED: 45 seconds - less frequent checks
    failureThreshold: 4,         // INCREASED: More tolerant of temporary failures
    recoveryTime: 90000,         // OPTIMIZED: 90 seconds recovery time
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
    console.log(`⚠️ Unknown chain ID: ${chainId}, falling back to ApeChain config`);
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