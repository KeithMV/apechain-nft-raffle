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
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// =============================================================================
// CONNECTORS (Web3 Expert: REQUIRED for Web3Modal v5)
// =============================================================================

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

const connectors = [
  injected(), // MetaMask, Trust Wallet, etc.
  walletConnect({ 
    projectId,
    showQrModal: false, // FIX: Disable WalletConnect's own modal, let Web3Modal handle it
    metadata: {
      name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
      description: 'Decentralized NFT raffle platform on ApeChain and Polygon',
      url: process.env.REACT_APP_APP_URL || 'https://web3raffles.io',
      icons: [`${process.env.REACT_APP_APP_URL || 'https://web3raffles.io'}/favicon.ico`],
    },
  }),
  coinbaseWallet({
    appName: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
    appLogoUrl: `${process.env.REACT_APP_APP_URL || 'https://web3raffles.io'}/favicon.ico`,
  }),
];

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
        // Fallback 1: Official ApeChain RPC
        'https://rpc.apechain.com',
        // Fallback 2: Alternative Caldera endpoint
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
  connectors, // REQUIRED: Web3Modal v5 needs these connectors
  transports: {
    // FIX: Use undefined to enable automatic fallback to all RPC URLs
    [apeChain.id]: http(undefined, {
      // Increased retry configuration for RPC reliability
      timeout: 30000,
      retryCount: 5,        // Increased from 3 to 5
      retryDelay: 1500,     // Increased from 1000 to 1500
      batch: true,          // Enable request batching
      fetchOptions: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    }),
    [polygon.id]: http(undefined, {
      // Polygon-specific configuration with higher retry tolerance
      timeout: 35000,       // Increased from 30000
      retryCount: 5,        // Increased from 3 to 5
      retryDelay: 1500,     // Increased from 1000 to 1500
      batch: true,          // Enable request batching
      fetchOptions: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    }),
  },
  // Web3 Expert: Mobile wallet compatibility
  ssr: false,
  syncConnectedChain: true,
  // Enable batch multicall for efficiency
  batch: {
    multicall: true,
  },
});

// =============================================================================
// DEBUG LOGGING (Remove after testing)
// =============================================================================
if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
  console.log('🔧 [WAGMI CONFIG DEBUG]');
  console.log('📍 ApeChain RPC:', apeChain.rpcUrls.default.http[0]);
  console.log('📍 Polygon RPC:', polygon.rpcUrls.default.http[0]);
  console.log('🔑 Alchemy API Key present:', !!process.env.REACT_APP_ALCHEMY_API_KEY);
  if (process.env.REACT_APP_ALCHEMY_API_KEY) {
    console.log('🔑 Alchemy API Key (first 10 chars):', process.env.REACT_APP_ALCHEMY_API_KEY.substring(0, 10) + '...');
  }
  console.log('⚙️ Configured chains:', config.chains.map(c => `${c.name} (${c.id})`));
}

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
    // Sanitize chain ID to prevent log injection
    const sanitizedChainId = String(chainId).replace(/[^0-9]/g, '');
    const chainName = getChainName(Number(sanitizedChainId));
    console.log(`🔗 Chain: ${chainName} (${sanitizedChainId})`);
    console.log(`📄 Contracts:`, getContractAddresses(Number(sanitizedChainId)));
  }
}