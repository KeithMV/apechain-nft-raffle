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

// PHASE 1: Simplified Polygon configuration with Alchemy
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
        // Primary: Your Alchemy endpoint (reliable, paid)
        `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
        // Backup: Simple CORS-friendly public RPC
        'https://polygon-rpc.com'
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

// Device detection utility (runtime)
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    ? 'mobile' : 'desktop';
};

// PHASE 1: Simplified configuration for both chains
const createSimplifiedConfig = () => {
  const isMobile = getDeviceType() === 'mobile';
  
  console.log('🔧 [PHASE 1] Creating simplified dual-chain configuration');
  console.log('⚡ [ALCHEMY] Using Alchemy for Polygon:', !!process.env.REACT_APP_ALCHEMY_API_KEY);
  
  return defaultWagmiConfig({
    chains: [apeChain, polygonChain],
    projectId,
    metadata,
    ssr: false,
    syncConnectedChain: true,
    enableEIP6963: true,
    enableCoinbase: true,
    
    // Reasonable batch configuration for both chains
    batch: {
      multicall: {
        batchSize: 1024 * 100, // 100KB batches
        wait: 50, // 50ms wait
      },
    },
    
    // Reasonable polling - not too aggressive
    pollingInterval: isMobile ? 15000 : 10000, // 15s mobile, 10s desktop
  });
};

// Export single unified config
export const config = createSimplifiedConfig();

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