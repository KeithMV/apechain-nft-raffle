/**
 * Mobile-Safe Wagmi Configuration
 * Runtime device detection with proper mobile wallet state persistence
 */

import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';
import { CHAIN_IDS, WALLET_IDS } from '../constants/chains';

// Runtime device detection (safer for mobile)
const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return { isMobile: false, isSlowConnection: false };
  }
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
  
  return { isMobile, isSlowConnection };
};

// Conservative configuration that works well on both mobile and desktop
const getOptimalConfig = () => {
  const { isMobile, isSlowConnection } = getDeviceInfo();
  
  // Use more conservative settings that work reliably across devices
  if (isMobile) {
    return {
      pollingInterval: 6000, // 6 seconds - reliable for mobile
      batchSize: 1024 * 64, // 64KB - safe for mobile memory
      wait: 50, // Reasonable batching delay
      staleTime: 4 * 60 * 1000, // 4 minutes
    };
  } else {
    return {
      pollingInterval: 4000, // 4 seconds - faster for desktop but not aggressive
      batchSize: 1024 * 128, // 128KB - balanced for desktop
      wait: 32, // Standard batching delay
      staleTime: 3 * 60 * 1000, // 3 minutes
    };
  }
};

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

// Polygon chain with mobile-safe RPC configuration
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
        // Prioritize most reliable endpoints for mobile compatibility
        'https://polygon-rpc.com',
        'https://rpc.ankr.com/polygon',
        'https://polygon.llamarpc.com',
        'https://polygon-mainnet.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78',
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
});

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

const metadata = {
  name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: process.env.REACT_APP_APP_URL || 'http://localhost:3000',
  icons: [`${process.env.REACT_APP_APP_URL || 'http://localhost:3000'}/favicon.ico`]
};

// Get optimal configuration
const optimalConfig = getOptimalConfig();

// Mobile-safe wagmi configuration
export const config = defaultWagmiConfig({
  chains: [apeChain, polygonChain],
  projectId,
  metadata,
  ssr: false,
  syncConnectedChain: true,
  enableEIP6963: true,
  enableCoinbase: true,
  // Conservative batch configuration for mobile compatibility
  batch: {
    multicall: {
      batchSize: optimalConfig.batchSize,
      wait: optimalConfig.wait,
    },
  },
  // Moderate polling interval that works on mobile
  pollingInterval: optimalConfig.pollingInterval,
  // Remove storage configuration to avoid TypeScript issues
});

// Mobile-optimized Web3Modal configuration
const deviceInfo = getDeviceInfo();

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  enableOnramp: false,
  enableSwaps: false,
  themeMode: 'dark',
  // Mobile-first wallet selection - prioritize MetaMask for mobile
  featuredWalletIds: deviceInfo.isMobile ? [
    WALLET_IDS.METAMASK, // MetaMask first for mobile
  ] : [
    WALLET_IDS.METAMASK,
    WALLET_IDS.RAINBOW,
    WALLET_IDS.TRUST_WALLET,
  ],
  includeWalletIds: deviceInfo.isMobile ? [
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

// Export device info for runtime use
export const getDeviceSettings = () => {
  const deviceInfo = getDeviceInfo();
  const config = getOptimalConfig();
  
  return {
    ...deviceInfo,
    ...config,
  };
};