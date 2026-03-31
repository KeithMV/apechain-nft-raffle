/**
 * UNIFIED CONFIGURATION SYSTEM
 * Single source of truth for all multichain configuration
 * Eliminates configuration conflicts and duplication
 */

import { defineChain } from 'viem';

// =============================================================================
// CORE TYPES
// =============================================================================

export interface ChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl: string;
  contracts: {
    factory: string;
    template: string;
  };
  settings: {
    rateLimit: number; // seconds between raffle creations
    platformFee: number; // basis points (500 = 5%)
    pollingInterval: number; // ms
    timeout: number; // ms
    retries: number;
  };
}

// =============================================================================
// CHAIN CONFIGURATIONS
// =============================================================================

const APECHAIN_CONFIG: ChainConfig = {
  chainId: 33139,
  name: 'ApeChain',
  nativeCurrency: {
    name: 'ApeCoin',
    symbol: 'APE',
    decimals: 18,
  },
  rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
  explorerUrl: 'https://apescan.io',
  contracts: {
    factory: '0x1627E7e63b63878E61f91D336385a59B1747934a', // V4
    template: '0x242f56507BFd5034b369418A7C9FB1b4643710a4',
  },
  settings: {
    rateLimit: 10,
    platformFee: 500, // 5%
    pollingInterval: 12000, // 12s - stable network
    timeout: 20000, // 20s
    retries: 2,
  },
};

const POLYGON_CONFIG: ChainConfig = {
  chainId: 137,
  name: 'Polygon',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrl: process.env.REACT_APP_ALCHEMY_API_KEY 
    ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`
    : 'https://polygon-rpc.com',
  explorerUrl: 'https://polygonscan.com',
  contracts: {
    factory: '0x5854AF7c836275c55469350a114F62a1609c4A42', // V4
    template: '0xC7b41b9749724260B4264B90555c9417d66D655A',
  },
  settings: {
    rateLimit: 10,
    platformFee: 500, // 5%
    pollingInterval: 8000, // 8s - faster for better UX
    timeout: 30000, // 30s - more time for congested network
    retries: 3,
  },
};

// =============================================================================
// UNIFIED CONFIGURATION MAP
// =============================================================================

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [APECHAIN_CONFIG.chainId]: APECHAIN_CONFIG,
  [POLYGON_CONFIG.chainId]: POLYGON_CONFIG,
};

export const DEFAULT_CHAIN_ID = 33139; // ApeChain
export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_CONFIGS).map(Number);

// =============================================================================
// CONFIGURATION GETTERS
// =============================================================================

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId?: number): ChainConfig {
  const id = chainId || DEFAULT_CHAIN_ID;
  const config = CHAIN_CONFIGS[id];
  
  if (!config) {
    console.warn(`Unsupported chain ${id}, falling back to ApeChain`);
    return CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
  }
  
  return config;
}

/**
 * Get factory address for chain
 */
export function getFactoryAddress(chainId?: number): string {
  return getChainConfig(chainId).contracts.factory;
}

/**
 * Get template address for chain
 */
export function getTemplateAddress(chainId?: number): string {
  return getChainConfig(chainId).contracts.template;
}

/**
 * Get RPC URL for chain
 */
export function getRpcUrl(chainId?: number): string {
  return getChainConfig(chainId).rpcUrl;
}

/**
 * Get explorer URL for chain
 */
export function getExplorerUrl(chainId?: number): string {
  return getChainConfig(chainId).explorerUrl;
}

// =============================================================================
// CHAIN UTILITIES
// =============================================================================

export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS;
}

export function isApeChain(chainId?: number): boolean {
  return chainId === 33139;
}

export function isPolygonChain(chainId?: number): boolean {
  return chainId === 137;
}

export function getChainName(chainId?: number): string {
  return getChainConfig(chainId).name;
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

// For backward compatibility with existing code
export const RAFFLE_FACTORY_ADDRESS = getFactoryAddress();
export const RAFFLE_TEMPLATE_ADDRESS = getTemplateAddress();

export function getContracts(chainId?: number) {
  const config = getChainConfig(chainId);
  return {
    RAFFLE_FACTORY: config.contracts.factory,
    RAFFLE_FACTORY_V4: config.contracts.factory,
    RAFFLE_TEMPLATE: config.contracts.template,
  };
}

// =============================================================================
// WAGMI CHAIN DEFINITIONS
// =============================================================================

export const apeChain = defineChain({
  id: APECHAIN_CONFIG.chainId,
  name: APECHAIN_CONFIG.name,
  nativeCurrency: APECHAIN_CONFIG.nativeCurrency,
  rpcUrls: {
    default: { http: [APECHAIN_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { 
      name: 'ApeChain Explorer', 
      url: APECHAIN_CONFIG.explorerUrl 
    },
  },
  testnet: false,
});

export const polygonChain = defineChain({
  id: POLYGON_CONFIG.chainId,
  name: POLYGON_CONFIG.name,
  nativeCurrency: POLYGON_CONFIG.nativeCurrency,
  rpcUrls: {
    default: { http: [POLYGON_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { 
      name: 'PolygonScan', 
      url: POLYGON_CONFIG.explorerUrl 
    },
  },
  testnet: false,
});

// =============================================================================
// REACT QUERY CONFIGURATIONS
// =============================================================================

export function getQueryConfig(chainId?: number) {
  const config = getChainConfig(chainId);
  
  return {
    staleTime: config.settings.pollingInterval,
    gcTime: config.settings.pollingInterval * 5,
    retry: config.settings.retries,
    retryDelay: 2000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  };
}

// =============================================================================
// OPERATION CONFIGURATIONS
// =============================================================================

export function getOperationConfig(chainId?: number, operation?: string) {
  const config = getChainConfig(chainId);
  
  return {
    timeout: config.settings.timeout,
    retries: config.settings.retries,
    retryDelay: 2000,
    staleTime: config.settings.pollingInterval,
  };
}