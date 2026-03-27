import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';
import { CHAIN_IDS, WALLET_IDS } from '../constants/chains';

// Dynamic RPC endpoint management with health monitoring - ALCHEMY INTEGRATION
let polygonRPCEndpoints = [
  // Priority 1: Alchemy RPC (most reliable with API key)
  ...(process.env.REACT_APP_ALCHEMY_API_KEY ? [
    `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
  ] : []),
  // Priority 2: CORS-friendly public endpoints
  'https://polygon-rpc.com', // Basic but CORS-friendly
  'https://rpc-mainnet.maticvigil.com', // MaticVigil (CORS-friendly)
  // Priority 3: Backup endpoints (may have CORS issues in browser)
  'https://polygon.meowrpc.com', // MeowRPC (fast but CORS issues)
  'https://rpc.polygon.gateway.fm', // Gateway FM
  'https://polygon-bor-rpc.publicnode.com', // PublicNode
];

// Failed endpoints tracking for circuit breaker
const failedEndpoints = new Set<string>();
const endpointFailureCount = new Map<string, number>();
const FAILURE_THRESHOLD = 3;
const RECOVERY_TIME = 5 * 60 * 1000; // 5 minutes

// Circuit breaker: Remove failing endpoints
export const markEndpointAsFailed = (endpoint: string) => {
  const currentCount = endpointFailureCount.get(endpoint) || 0;
  endpointFailureCount.set(endpoint, currentCount + 1);
  
  if (currentCount + 1 >= FAILURE_THRESHOLD) {
    failedEndpoints.add(endpoint);
    console.warn(`🚫 [RPC] Endpoint marked as failed: ${endpoint}`);
    
    // Schedule recovery attempt
    setTimeout(() => {
      failedEndpoints.delete(endpoint);
      endpointFailureCount.delete(endpoint);
      console.log(`🔄 [RPC] Endpoint recovery attempted: ${endpoint}`);
    }, RECOVERY_TIME);
  }
};

// Get healthy endpoints only with Alchemy priority
export const getHealthyPolygonEndpoints = () => {
  const healthy = polygonRPCEndpoints.filter(endpoint => !failedEndpoints.has(endpoint));
  // Always ensure we have at least one endpoint - prioritize Alchemy if available
  if (healthy.length === 0) {
    const fallbacks = process.env.REACT_APP_ALCHEMY_API_KEY ? [
      `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
      'https://polygon-rpc.com',
      'https://rpc-mainnet.maticvigil.com'
    ] : [
      'https://polygon-rpc.com',
      'https://rpc-mainnet.maticvigil.com'
    ];
    return fallbacks;
  }
  return healthy;
};

// Function to update RPC endpoints based on health monitoring
export const updatePolygonRPCEndpoints = (healthyEndpoints: string[]) => {
  if (healthyEndpoints.length > 0) {
    polygonRPCEndpoints = healthyEndpoints;
    console.log('🔄 [RPC] Updated Polygon endpoints based on health monitoring:', healthyEndpoints);
  }
};

// Function to get current RPC endpoints
export const getPolygonRPCEndpoints = () => polygonRPCEndpoints;

// ApeChain configuration - unified for all devices
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

// Polygon chain - optimized RPC configuration with health monitoring
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
      http: getHealthyPolygonEndpoints(),
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
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: process.env.REACT_APP_APP_URL || 'http://localhost:3000',
  icons: [`${process.env.REACT_APP_APP_URL || 'http://localhost:3000'}/favicon.ico`]
};

// Device detection utility (runtime)
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    ? 'mobile' : 'desktop';
};

// Device-adaptive configuration function with chain-specific optimizations and Alchemy integration
const createAdaptiveConfig = () => {
  const isMobile = getDeviceType() === 'mobile';
  const hasAlchemy = !!process.env.ALCHEMY_API_KEY;
  
  console.log(`🔧 [UNIFIED CONFIG] Creating unified configuration for ${isMobile ? 'mobile' : 'desktop'} with circuit breaker protection`);
  if (hasAlchemy) {
    console.log('⚡ [ALCHEMY] Using Alchemy RPC endpoints for enhanced performance');
  } else {
    console.log('🌐 [PUBLIC RPC] Using public RPC endpoints (consider adding ALCHEMY_API_KEY for better performance)');
  }
  
  return defaultWagmiConfig({
    chains: [apeChain, polygonChain],
    projectId,
    metadata,
    ssr: false,
    syncConnectedChain: true,
    enableEIP6963: true,
    enableCoinbase: true, // Enable for all devices, Web3Modal will handle appropriately
    
    // Chain-specific batch configuration optimized for speed
    batch: {
      multicall: {
        batchSize: 1024 * 50, // Reduced to 50KB for faster responses
        wait: 16, // Reduced to 16ms for snappier performance
      },
    },
    
    // Much shorter polling interval to reduce load
    pollingInterval: isMobile ? 15000 : 6000, // AGGRESSIVE: 15s mobile, 6s desktop (much faster)
  });
};

// Export single unified config
export const config = createAdaptiveConfig();

export const getWalletConfig = () => {
  const isMobile = getDeviceType() === 'mobile';
  
  return {
    // For desktop, don't specify featuredWalletIds to let Web3Modal show all available wallets
    featuredWalletIds: isMobile ? [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ] : undefined, // Let Web3Modal auto-detect on desktop
    
    // Don't restrict wallet IDs on desktop
    includeWalletIds: isMobile ? [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ] : undefined,
    
    // Only exclude problematic wallets on mobile
    excludeWalletIds: isMobile ? [
      WALLET_IDS.COINBASE,
      WALLET_IDS.LEDGER,
    ] : [],
  };
};