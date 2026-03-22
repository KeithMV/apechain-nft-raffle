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

// Device detection utility
const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    ? 'mobile' : 'desktop';
};

// WalletConnect project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Unified metadata
const metadata = {
  name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: process.env.REACT_APP_APP_URL || 'http://localhost:3000',
  icons: [`${process.env.REACT_APP_APP_URL || 'http://localhost:3000'}/favicon.ico`]
};

// Device-adaptive configuration function
const createAdaptiveConfig = () => {
  const deviceType = getDeviceType();
  const isMobile = deviceType === 'mobile';
  
  console.log(`🔧 [UNIFIED CONFIG] Creating ${deviceType} configuration`);
  
  return defaultWagmiConfig({
    chains: [apeChain, polygonChain],
    projectId,
    metadata,
    ssr: false,
    syncConnectedChain: true,
    enableEIP6963: true,
    enableCoinbase: !isMobile, // Disable Coinbase on mobile only
    
    // Adaptive batch configuration
    batch: {
      multicall: {
        batchSize: isMobile ? 1024 * 100 : 1024 * 200, // 100KB mobile, 200KB desktop
        wait: isMobile ? 50 : 32, // Longer wait for mobile networks
      },
    },
    
    // Adaptive polling interval
    pollingInterval: isMobile ? 30000 : 15000, // 30s mobile, 15s desktop
  });
};

// Export single unified config
export const config = createAdaptiveConfig();

// Export device type for Web3Modal configuration
export const deviceType = getDeviceType();
export const isMobile = deviceType === 'mobile';

// Export wallet configuration for Web3Modal
export const getWalletConfig = () => ({
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
});