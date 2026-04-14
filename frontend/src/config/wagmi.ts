/**
 * SIMPLIFIED WAGMI CONFIGURATION
 * Direct, reliable Web3 setup without complex abstractions
 * 
 * Expert Collaboration:
 * - Code Reviewer: Clean, maintainable structure
 * - Debug Expert: Clear error paths and logging
 * - Web3 Expert: Mobile-optimized, production-ready
 */

import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

// =============================================================================
// CHAIN DEFINITIONS (Web3 Expert: Mobile-optimized with multiple RPC URLs)
// =============================================================================

export const apeChain = defineChain({
  id: 33139,
  name: 'ApeChain',
  nativeCurrency: {
    name: 'ApeCoin',
    symbol: 'APE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        // Primary: Environment-specific RPC
        process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
        // Fallbacks: Multiple reliable endpoints
        'https://rpc.apechain.com',
        'https://apechain.calderachain.xyz/http',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'ApeChain Explorer',
      url: 'https://apescan.io',
    },
  },
  testnet: false,
});

export const polygon = defineChain({
  id: 137,
  name: 'Polygon',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        // Primary: Alchemy with multi-chain API key
        process.env.REACT_APP_ALCHEMY_API_KEY
          ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`
          : 'https://polygon-rpc.com',
        // Fallbacks: Multiple reliable endpoints
        'https://rpc.ankr.com/polygon',
        'https://polygon.meowrpc.com',
        'https://polygon-mainnet.public.blastapi.io',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://polygonscan.com',
    },
  },
  testnet: false,
});

// =============================================================================
// CONTRACT ADDRESSES (Code Reviewer: Single source of truth)
// =============================================================================

export const CONTRACT_ADDRESSES = {
  [apeChain.id]: {
    factory: '0x1627E7e63b63878E61f91D336385a59B1747934a',
    template: '0x242f56507BFd5034b369418A7C9FB1b4643710a4',
  },
  [polygon.id]: {
    factory: '0xC9Bd344f5E31481F202E400C33210Bd1AB542b42',
    template: '0x7487bb0DdAd2d7ff7C59869536cbDcEBAd29D55e',
  },
} as const;

// =============================================================================
// WAGMI CONFIGURATION (Debug Expert: Clear error handling)
// =============================================================================

export const config = createConfig({
  chains: [apeChain, polygon],
  transports: {
    [apeChain.id]: http(apeChain.rpcUrls.default.http[0], {
      // Debug Expert: Timeout and retry configuration
      timeout: 25000,
      retryCount: 2,
      retryDelay: 2000,
    }),
    [polygon.id]: http(polygon.rpcUrls.default.http[0], {
      // Debug Expert: Polygon-specific timeout (more congested network)
      timeout: 30000,
      retryCount: 3,
      retryDelay: 2000,
    }),
  },
  // Web3 Expert: Mobile wallet compatibility
  ssr: false,
  syncConnectedChain: true,
});

// =============================================================================
// UTILITY FUNCTIONS (Code Reviewer: Simple, focused functions)
// =============================================================================

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[apeChain.id];
}

/**
 * Check if chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId === apeChain.id || chainId === polygon.id;
}

/**
 * Get chain name for display
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case apeChain.id:
      return 'ApeChain';
    case polygon.id:
      return 'Polygon';
    default:
      return 'Unknown Chain';
  }
}

/**
 * Debug Expert: Simple logging for troubleshooting
 */
export function logChainInfo(chainId: number) {
  if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
    console.log(`🔗 Chain: ${getChainName(chainId)} (${chainId})`);
    console.log(`📄 Contracts:`, getContractAddresses(chainId));
  }
}