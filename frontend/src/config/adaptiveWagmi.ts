/**
 * Adaptive Wagmi Configuration
 * Device and connection-aware Web3 performance optimization
 */

import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';
import { CHAIN_IDS, WALLET_IDS } from '../constants/chains';

// Device and connection detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';

// Adaptive configuration based on device and connection
const getAdaptiveConfig = () => {
  if (isMobile && isSlowConnection) {
    return {
      pollingInterval: 8000, // 8 seconds for slow mobile
      batchSize: 1024 * 50, // 50KB for mobile
      wait: 100, // Longer wait for batching
      staleTime: 5 * 60 * 1000, // 5 minutes
    };
  } else if (isMobile) {
    return {
      pollingInterval: 4000, // 4 seconds for mobile
      batchSize: 1024 * 100, // 100KB for mobile
      wait: 50,
      staleTime: 3 * 60 * 1000, // 3 minutes
    };
  } else {
    return {
      pollingInterval: 2000, // 2 seconds for desktop
      batchSize: 1024 * 200, // 200KB for desktop
      wait: 16, // 16ms for smooth desktop experience
      staleTime: 2 * 60 * 1000, // 2 minutes
    };
  }
};

const adaptiveConfig = getAdaptiveConfig();

// ApeChain configuration
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

// Polygon chain with adaptive RPC selection
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
      http: isMobile ? [
        // Mobile-optimized RPC endpoints (faster, more reliable)
        'https://polygon-rpc.com',
        'https://rpc.ankr.com/polygon',
        'https://polygon.llamarpc.com',
      ] : [
        // Desktop can handle more endpoints
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

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

const metadata = {
  name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: process.env.REACT_APP_APP_URL || 'http://localhost:3000',
  icons: [`${process.env.REACT_APP_APP_URL || 'http://localhost:3000'}/favicon.ico`]
};

// Adaptive wagmi configuration
export const config = defaultWagmiConfig({
  chains: [apeChain, polygonChain],
  projectId,
  metadata,
  ssr: false,
  syncConnectedChain: true,
  enableEIP6963: true,
  enableCoinbase: true,
  batch: {
    multicall: {
      batchSize: adaptiveConfig.batchSize,
      wait: adaptiveConfig.wait,
    },
  },
  pollingInterval: adaptiveConfig.pollingInterval,
});

// Create Web3Modal with device-specific optimizations
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  enableOnramp: false,
  enableSwaps: false,
  themeMode: 'dark',
  featuredWalletIds: isMobile ? [
    WALLET_IDS.METAMASK,
    WALLET_IDS.TRUST_WALLET,
  ] : [
    WALLET_IDS.METAMASK,
    WALLET_IDS.RAINBOW,
    WALLET_IDS.TRUST_WALLET,
  ],
  includeWalletIds: isMobile ? [
    WALLET_IDS.METAMASK,
    WALLET_IDS.TRUST_WALLET,
  ] : [
    WALLET_IDS.METAMASK,
    WALLET_IDS.RAINBOW,
    WALLET_IDS.TRUST_WALLET,
  ],
  excludeWalletIds: [
    WALLET_IDS.COINBASE,
    WALLET_IDS.LEDGER,
  ],
  allWallets: 'HIDE',
  defaultChain: apeChain,
  chainImages: {
    [apeChain.id]: 'https://apechain.calderaexplorer.xyz/favicon.ico',
    [polygonChain.id]: 'https://polygon.technology/favicon.ico'
  }
});

// Export adaptive configuration for use in other components
export const adaptiveSettings = {
  ...adaptiveConfig,
  isMobile,
  isSlowConnection,
};