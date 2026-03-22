import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';
import { CHAIN_IDS, WALLET_IDS } from '../constants/chains';

// ApeChain configuration with mobile-optimized settings
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

// Polygon chain with mobile-optimized RPC selection
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
        // Prioritize most reliable RPCs for mobile
        'https://polygon-rpc.com',
        'https://rpc.ankr.com/polygon',
        'https://polygon.llamarpc.com',
        'https://polygon-mainnet.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78',
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

// Mobile-optimized metadata
const metadata = {
  name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: process.env.REACT_APP_APP_URL || 'http://localhost:3000',
  icons: [`${process.env.REACT_APP_APP_URL || 'http://localhost:3000'}/favicon.ico`]
};

// Detect if running on mobile device
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Mobile-optimized wagmi config
export const mobileConfig = defaultWagmiConfig({
  chains: [apeChain, polygonChain],
  projectId,
  metadata,
  ssr: false,
  syncConnectedChain: true,
  enableEIP6963: true,
  enableCoinbase: false, // Disable Coinbase for mobile to reduce complexity
  
  // Mobile-optimized batch configuration
  batch: {
    multicall: {
      batchSize: 1024 * 100, // Smaller batch size for mobile (100KB)
      wait: 50, // Longer wait time for mobile networks
    },
  },
  
  // Mobile-optimized polling - much more conservative
  pollingInterval: isMobile() ? 30000 : 15000, // 30s mobile, 15s desktop
});

// Mobile-optimized Web3Modal configuration
export const createMobileWeb3Modal = () => {
  return createWeb3Modal({
    wagmiConfig: mobileConfig,
    projectId,
    enableAnalytics: false,
    enableOnramp: false,
    enableSwaps: false,
    themeMode: 'dark',
    
    // Mobile-specific wallet configuration
    featuredWalletIds: [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ],
    
    includeWalletIds: [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ],
    
    // Exclude problematic wallets on mobile
    excludeWalletIds: [
      WALLET_IDS.COINBASE,
      WALLET_IDS.LEDGER,
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    ],
    
    allWallets: 'HIDE',
    defaultChain: apeChain,
    
    // Mobile-optimized connection settings
    themeVariables: {
      '--w3m-z-index': 999999,
      '--w3m-overlay-background-color': 'rgba(0, 0, 0, 0.8)',
    } as any,
    
    chainImages: {
      [apeChain.id]: 'https://apechain.calderaexplorer.xyz/favicon.ico',
      [polygonChain.id]: 'https://polygon.technology/favicon.ico'
    }
  });
};

// Export the mobile config as default for mobile devices
export const config = mobileConfig;