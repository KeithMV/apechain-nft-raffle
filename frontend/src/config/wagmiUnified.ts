import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';
import { CHAIN_IDS, WALLET_IDS } from '../constants/chains';

// ApeChain configuration - WORKING (unchanged)
export const apeChain = defineChain({
  id: CHAIN_IDS.APECHAIN_MAINNET,
  name: 'ApeChain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { 
      http: [envConfig.rpcUrl, 'https://rpc.apechain.com'] 
    },
  },
  blockExplorers: {
    default: { 
      name: 'ApeChain Explorer', 
      url: 'https://apechain.calderaexplorer.xyz' 
    },
  },
  testnet: false,
});

// Polygon configuration with free high-limit RPC
export const polygonChain = defineChain({
  id: 137,
  name: 'Polygon',
  nativeCurrency: {
    decimals: 18,
    name: 'POL',
    symbol: 'POL',
  },
  rpcUrls: {
    default: {
      http: [
        // Primary: Polygon's free RPC with higher limits
        'https://polygon-rpc.com',
        // Backup: Ankr free RPC
        'https://rpc.ankr.com/polygon',
        // Backup: Another reliable free RPC
        'https://polygon.meowrpc.com',
        // Emergency fallback: Your Alchemy (if needed)
        `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://polygonscan.com',
    },
  },
});

// WalletConnect project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Unified metadata
const metadata = {
  name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain and Polygon',
  url: process.env.REACT_APP_APP_URL || 'http://localhost:3000',
  icons: [`${process.env.REACT_APP_APP_URL || 'http://localhost:3000'}/favicon.ico`]
};

// PHASE 2: Chain-specific optimization utilities
const getChainOptimizedSettings = (chainId: number) => {
  switch (chainId) {
    case 137: // Polygon - OPTIMIZED: Balanced settings for good UX
      return {
        pollingInterval: 8000,        // 8s - Faster polling for better UX (was 15s)
        batchSize: 1024 * 40,         // 40KB - Moderate batches (was 25KB)
        batchWait: 300,               // 300ms - Moderate waits (was 500ms)
        retryDelay: 3000,             // 3s - Moderate retry delays (was 5s)
        maxRetries: 2,                // Keep conservative retries
      };
    case 33139: // ApeChain - Keep current working settings
    default:
      return {
        pollingInterval: 12000,       // 12s - Current working setting
        batchSize: 1024 * 100,        // 100KB - Larger batches (less congested)
        batchWait: 50,                // 50ms - Shorter waits (reliable network)
        retryDelay: 1000,             // 1s - Faster retries (stable network)
        maxRetries: 2,                // Fewer retries needed
      };
  }
};

// PHASE 2: Dynamic configuration based on primary chain
const getPrimaryChainId = () => {
  // Default to ApeChain, but could be made dynamic based on user preference
  return CHAIN_IDS.APECHAIN_MAINNET;
};

// Device detection utility (runtime)
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    ? 'mobile' : 'desktop';
};

// PHASE 2: Chain-optimized configuration with Free Polygon RPC
const createOptimizedConfig = () => {
  const isMobile = getDeviceType() === 'mobile';
  const primaryChain = getPrimaryChainId();
  const chainSettings = getChainOptimizedSettings(primaryChain);
  
  console.log('🔧 [PHASE 2] Creating chain-optimized dual-chain configuration');
  console.log('🆓 [POLYGON] Using free Polygon RPC with higher limits');
  console.log('🎯 [OPTIMIZATION] Primary chain settings:', {
    chainId: primaryChain,
    polling: chainSettings.pollingInterval,
    batchSize: chainSettings.batchSize,
    batchWait: chainSettings.batchWait
  });
  
  return defaultWagmiConfig({
    chains: [apeChain, polygonChain],
    projectId,
    metadata,
    ssr: false,
    syncConnectedChain: true,
    enableEIP6963: true,
    enableCoinbase: true,
    
    // PHASE 2: Chain-optimized batch configuration
    batch: {
      multicall: {
        batchSize: chainSettings.batchSize,
        wait: chainSettings.batchWait,
      },
    },
    
    // PHASE 2: Optimized polling based on primary chain
    pollingInterval: isMobile 
      ? chainSettings.pollingInterval + 5000  // +5s for mobile
      : chainSettings.pollingInterval,
  });
};

// Export single unified config
export const config = createOptimizedConfig();

// PHASE 2: Chain-specific React Query configurations
export const getChainQueryConfig = (chainId: number) => {
  const settings = getChainOptimizedSettings(chainId);
  
  return {
    staleTime: chainId === 137 
      ? 15000   // 15s for Polygon (faster refresh)
      : 30000,  // 30s for ApeChain (more stable)
    
    gcTime: chainId === 137
      ? 5 * 60 * 1000   // 5min for Polygon (shorter cache)
      : 10 * 60 * 1000, // 10min for ApeChain (longer cache)
    
    retryDelay: settings.retryDelay,
    retry: settings.maxRetries,
    
    // Polygon needs more conservative refetch settings
    refetchOnWindowFocus: chainId === 137 ? false : true,
    refetchOnReconnect: true,
    refetchInterval: false, // Let polling handle updates
  };
};

// PHASE 2: Export chain settings for use in hooks
export const getChainSettings = getChainOptimizedSettings;

export const getWalletConfig = () => {
  const isMobile = getDeviceType() === 'mobile';
  
  return {
    featuredWalletIds: isMobile ? [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ] : undefined,
    
    includeWalletIds: isMobile ? [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ] : undefined,
    
    excludeWalletIds: isMobile ? [
      WALLET_IDS.COINBASE,
      WALLET_IDS.LEDGER,
    ] : [],
  };
};

// PHASE 1: Remove all complex RPC management functions
// These were causing the 2000+ error loops - now simplified

// Legacy exports for backward compatibility (no-ops)
export const markEndpointAsFailed = () => {
  console.warn('[DEPRECATED] markEndpointAsFailed - using simplified RPC management');
};

export const getHealthyPolygonEndpoints = () => {
  console.warn('[DEPRECATED] getHealthyPolygonEndpoints - using simplified RPC management');
  return [];
};

export const updatePolygonRPCEndpoints = () => {
  console.warn('[DEPRECATED] updatePolygonRPCEndpoints - using simplified RPC management');
};

export const getPolygonRPCEndpoints = () => {
  console.warn('[DEPRECATED] getPolygonRPCEndpoints - using simplified RPC management');
  return [];
};

// Chain utility functions for backward compatibility
export const isApeChain = (chainId?: number) => chainId === 33139;
export const isPolygonChain = (chainId?: number) => chainId === 137;
export const isSupportedChain = (chainId?: number) => chainId === 33139 || chainId === 137;

export const getChainName = (chainId?: number) => {
  switch (chainId) {
    case 33139: return 'ApeChain';
    case 137: return 'Polygon';
    default: return 'Unknown';
  }
};

// Simple chain configuration interface
export interface ChainConfiguration {
  polling: {
    interval: number;
    fastInterval: number;
    slowInterval: number;
  };
  batch: {
    contractSize: number;
    raffleSize: number;
    contractDelay: number;
    raffleDelay: number;
    maxConcurrent: number;
  };
  transaction: {
    timeoutMultiplier: number;
  };
  cache: {
    staleTime: number;
    gcTime: number;
    userStaleTime: number;
    userGcTime: number;
    invalidationDelay: number;
    maxPages: number;
  };
  nft: {
    batchSize: number;
    retryDelay: number;
    scanTimeout: number;
    chunkSize: bigint;
    maxChunks: number;
    targetCount: number;
  };
  rpc: {
    timeout: number;
    retries: number;
  };
}

// Get chain configuration
export const getChainConfig = (chainId?: number): ChainConfiguration => {
  const settings = getChainOptimizedSettings(chainId || 33139);
  
  return {
    polling: {
      interval: settings.pollingInterval,
      fastInterval: settings.pollingInterval / 2,
      slowInterval: settings.pollingInterval * 2,
    },
    batch: {
      contractSize: Math.floor(settings.batchSize / 1024), // Convert to KB
      raffleSize: Math.floor(settings.batchSize / 1024),
      contractDelay: settings.batchWait,
      raffleDelay: settings.batchWait,
      maxConcurrent: 3,
    },
    transaction: {
      timeoutMultiplier: chainId === 137 ? 1.5 : 1.0,
    },
    cache: {
      staleTime: chainId === 137 ? 15000 : 30000, // Faster refresh for Polygon
      gcTime: chainId === 137 ? 5 * 60 * 1000 : 10 * 60 * 1000,
      userStaleTime: 15000,
      userGcTime: 2 * 60 * 1000,
      invalidationDelay: chainId === 137 ? 1000 : 1000, // 1s for both chains - faster updates
      maxPages: 5,
    },
    nft: {
      batchSize: 10,
      retryDelay: settings.retryDelay,
      scanTimeout: 30000, // 30s timeout for NFT API calls
      chunkSize: chainId === 137 ? 1000n : 2000n, // Smaller chunks for Polygon
      maxChunks: chainId === 137 ? 5 : 10, // Fewer chunks for Polygon
      targetCount: chainId === 137 ? 20 : 50, // Fewer NFTs for Polygon
    },
    rpc: {
      timeout: 10000,
      retries: settings.maxRetries,
    },
  };
};

// Operation configuration
export const getOperationConfig = (chainId?: number, operation?: string) => {
  const baseTimeout = 20000;
  const multiplier = chainId === 137 ? 1.5 : 1.0;
  
  return {
    timeout: baseTimeout * multiplier,
    retries: chainId === 137 ? 3 : 2,
    retryDelay: chainId === 137 ? 2000 : 1000,
    staleTime: chainId === 137 ? 25000 : 30000,
  };
};