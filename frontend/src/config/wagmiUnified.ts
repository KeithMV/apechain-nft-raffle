import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';
import { CHAIN_IDS, WALLET_IDS } from '../constants/chains';

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

// Polygon chain - optimized RPC configuration for performance
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
        // Priority 1: Polygon official (most reliable for localhost)
        'https://polygon-rpc.com',
        // Priority 2: LlamaRPC (re-added as fallback)
        'https://polygon.llamarpc.com',
        // Priority 3: Public Polygon RPC (backup)
        'https://rpc-mainnet.matic.network',
        // Priority 4: QuickNode public (additional fallback)
        'https://rpc-mainnet.matic.quiknode.pro',
        // Priority 5: Alchemy with API key if available
        ...(process.env.REACT_APP_ALCHEMY_API_KEY && process.env.REACT_APP_ALCHEMY_API_KEY !== 'demo' 
          ? [`https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`] 
          : []),
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
    
    // Optimized batch configuration with better error handling
    batch: {
      multicall: {
        batchSize: 1024 * 150, // 150KB - balanced for both chains
        wait: 25, // Faster batching for better responsiveness
      },
    },
    
    // Chain-specific polling intervals for optimal performance
    pollingInterval: 8000, // 8s - faster for better UX, with proper fallbacks
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