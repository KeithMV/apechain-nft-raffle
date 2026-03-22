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

// Polygon chain - unified RPC configuration
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
        'https://polygon-mainnet.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78',
        'https://polygon-rpc.com',
        'https://rpc.ankr.com/polygon',
        'https://polygon.llamarpc.com',
        'https://polygon-mainnet.public.blastapi.io',
        'https://polygon.blockpi.network/v1/rpc/public',
        'https://rpc-mainnet.matic.quiknode.pro'
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

// Device-adaptive configuration function
const createAdaptiveConfig = () => {
  // Always create desktop config - device detection will happen in Web3Modal setup
  console.log('🔧 [UNIFIED CONFIG] Creating unified configuration for all devices');
  
  return defaultWagmiConfig({
    chains: [apeChain, polygonChain],
    projectId,
    metadata,
    ssr: false,
    syncConnectedChain: true,
    enableEIP6963: true,
    enableCoinbase: true, // Enable for all devices, Web3Modal will handle appropriately
    
    // Standard batch configuration
    batch: {
      multicall: {
        batchSize: 1024 * 200, // 200KB standard
        wait: 32, // Standard wait time
      },
    },
    
    // Standard polling interval
    pollingInterval: 15000, // 15s standard
  });
};

// Export single unified config
export const config = createAdaptiveConfig();

// Export wallet configuration for Web3Modal (runtime detection)
export const getWalletConfig = () => {
  const isMobile = getDeviceType() === 'mobile';
  
  return {
    featuredWalletIds: isMobile ? [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ] : [
      WALLET_IDS.METAMASK,
      WALLET_IDS.RAINBOW,
      WALLET_IDS.TRUST_WALLET,
    ],
    
    includeWalletIds: [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ],
    
    excludeWalletIds: isMobile ? [
      WALLET_IDS.COINBASE,
      WALLET_IDS.LEDGER,
    ] : [],
  };
};