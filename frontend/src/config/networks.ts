/**
 * Network Configurations
 * Blockchain network definitions and utilities
 */

import type { NetworkConfig } from '../contracts/types';

export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  31337: { // Hardhat localhost
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    name: 'Hardhat',
    explorerUrl: 'http://localhost:8545',
    nativeCurrency: 'ETH'
  },
  33111: { // ApeChain Curtis Testnet
    chainId: 33111,
    rpcUrl: 'https://curtis.rpc.caldera.xyz/http',
    name: 'ApeChain Curtis',
    explorerUrl: 'https://curtis.explorer.caldera.xyz',
    nativeCurrency: 'APE'
  },
  33139: { // ApeChain
    chainId: 33139,
    rpcUrl: 'https://apechain.calderachain.xyz/http',
    name: 'ApeChain',
    explorerUrl: 'https://apescan.io',
    nativeCurrency: 'APE'
  },
  137: { // Polygon Mainnet
    chainId: 137,
    rpcUrl: process.env.REACT_APP_ALCHEMY_API_KEY 
      ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`
      : 'https://polygon-rpc.com', // CORS-friendly fallback
    name: 'Polygon',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: 'POL'
  }
} as const;

// Supported chain IDs
export const SUPPORTED_CHAINS = Object.keys(NETWORK_CONFIGS).map(Number);

// Default network (ApeChain)
export const DEFAULT_CHAIN_ID = 33139;
export const DEFAULT_NETWORK = NETWORK_CONFIGS[DEFAULT_CHAIN_ID];

/**
 * Get network configuration for a chain ID
 */
export function getNetworkConfig(chainId?: number): NetworkConfig {
  try {
    const currentChainId = chainId || getCurrentChainId();
    const config = NETWORK_CONFIGS[currentChainId];
    
    if (!config) {
      // Fallback to ApeChain for unsupported networks
      return NETWORK_CONFIGS[DEFAULT_CHAIN_ID];
    }
    
    return config;
  } catch (error) {
    // Safe fallback to ApeChain on error
    return NETWORK_CONFIGS[DEFAULT_CHAIN_ID];
  }
}

/**
 * Get current chain ID from wallet or default
 */
export function getCurrentChainId(): number {
  // Always prioritize wallet's actual chain ID
  if (typeof window !== 'undefined' && window.ethereum) {
    const chainId = window.ethereum.chainId;
    if (chainId) {
      // Handle both string (hex) and number types
      if (typeof chainId === 'string') {
        return parseInt(chainId, 16);
      } else if (typeof chainId === 'number') {
        return chainId;
      }
    }
  }
  
  // Default to ApeChain only as last resort
  return DEFAULT_CHAIN_ID;
}

/**
 * Check if a chain ID is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in NETWORK_CONFIGS;
}

/**
 * Get explorer URL for a transaction or address
 */
export function getExplorerUrl(chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string {
  const config = getNetworkConfig(chainId);
  const path = type === 'tx' ? 'tx' : 'address';
  return `${config.explorerUrl}/${path}/${hash}`;
}