import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';
import { CHAIN_IDS, WALLET_IDS } from '../constants/chains';

// Dynamic RPC endpoint management
let polygonRPCEndpoints = [
  // Priority 1: Most reliable public endpoints
  'https://rpc-mainnet.matic.network',
  'https://polygon-rpc.com', 
  'https://rpc.ankr.com/polygon',
  // Priority 2: Additional fallbacks
  'https://rpc-mainnet.matic.quiknode.pro',
  // Priority 3: LlamaRPC (currently failing - moved to last)
  'https://polygon.llamarpc.com',
];

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
      http: polygonRPCEndpoints,
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

// Device-adaptive configuration function with chain-specific optimizations
const createAdaptiveConfig = () => {
  // Always create desktop config - device detection will happen in Web3Modal setup
  console.log('🔧 [UNIFIED CONFIG] Creating unified configuration with chain-specific optimizations');
  
  return defaultWagmiConfig({
    chains: [apeChain, polygonChain],
    projectId,
    metadata,
    ssr: false,
    syncConnectedChain: true,
    enableEIP6963: true,
    enableCoinbase: true, // Enable for all devices, Web3Modal will handle appropriately
    
    // Chain-specific batch configuration with better error handling
    batch: {
      multicall: {
        batchSize: 1024 * 100, // 100KB - optimized for Polygon congestion
        wait: 50, // 50ms - longer wait for network congestion
      },
    },
    
    // Balanced polling interval - faster than before but not excessive
    pollingInterval: 6000, // 6s - good balance for both chains
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