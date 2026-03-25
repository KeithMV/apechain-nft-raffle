/**
 * Mobile-Safe Wagmi Configuration
 * Runtime device detection with proper mobile wallet state persistence
 */

import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';
import { CHAIN_IDS } from '../constants/chains';

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

// Optimized configuration for better performance
const getOptimalConfig = () => {
  const { isMobile } = getDeviceInfo();
  
  // Simplified settings for better performance
  if (isMobile) {
    return {
      pollingInterval: 4000, // 4 seconds - faster
      batchSize: 1024 * 64, // 64KB
      wait: 50,
      staleTime: 30 * 1000, // 30 seconds - faster refresh
    };
  } else {
    return {
      pollingInterval: 3000, // 3 seconds - faster
      batchSize: 1024 * 128, // 128KB
      wait: 32,
      staleTime: 30 * 1000, // 30 seconds - faster refresh
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

// Polygon chain with optimized RPC configuration
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
        // Fastest, most reliable endpoints first
        'https://polygon-rpc.com',
        'https://rpc.ankr.com/polygon',
        'https://polygon.llamarpc.com',
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

// Optimized wagmi configuration
export const config = defaultWagmiConfig({
  chains: [apeChain, polygonChain],
  projectId,
  metadata,
  ssr: false,
  syncConnectedChain: true,
  enableEIP6963: true,
  enableCoinbase: true,
  // Optimized batch configuration
  batch: {
    multicall: {
      batchSize: optimalConfig.batchSize,
      wait: optimalConfig.wait,
    },
  },
  // Faster polling for better UX
  pollingInterval: optimalConfig.pollingInterval,
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