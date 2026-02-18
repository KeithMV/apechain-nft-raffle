import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';
import { CHAIN_IDS, WALLET_IDS } from '../constants/chains';

// ApeChain configuration with environment support
export const apeChain = defineChain({
  id: CHAIN_IDS.APECHAIN_MAINNET, // Always ApeChain mainnet
  name: 'ApeChain', // Keep consistent name across environments
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { 
      http: [
        'https://rpc.apechain.com',
        'https://apechain.calderachain.xyz/http'
      ]
    },
  },
  blockExplorers: {
    default: { 
      name: 'ApeChain Explorer', 
      url: 'https://apechain.calderaexplorer.xyz' 
    },
  },
  testnet: false, // Both staging and production use mainnet
});

// Custom Polygon chain with reliable RPC endpoints
export const polygonChain = defineChain({
  id: 137,
  name: 'Polygon',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: { 
      http: [
        'https://polygon-mainnet.g.alchemy.com/v2/demo',
        'https://polygon-rpc.com',
        'https://rpc-mainnet.matic.network',
        'https://matic-mainnet.chainstacklabs.com'
      ]
    },
  },
  blockExplorers: {
    default: { 
      name: 'PolygonScan', 
      url: 'https://polygonscan.com' 
    },
  },
  testnet: false,
});

// WalletConnect project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Environment-aware metadata - use build-time env vars directly
const metadata = {
  name: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: process.env.REACT_APP_APP_URL || 'http://localhost:3000',
  icons: [`${process.env.REACT_APP_APP_URL || 'http://localhost:3000'}/favicon.ico`]
};

// Create wagmi config with multi-chain support
export const config = defaultWagmiConfig({
  chains: [apeChain, polygonChain],
  projectId,
  metadata,
  ssr: false,
  syncConnectedChain: true, // This works locally, keep it
  enableEIP6963: true,
  enableCoinbase: true,
});

// Create Web3Modal with mobile-optimized settings
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  enableOnramp: false,
  enableSwaps: false,
  themeMode: 'dark',
  // Mobile-optimized wallet selection
  featuredWalletIds: [
    WALLET_IDS.METAMASK,
    WALLET_IDS.RAINBOW,
    WALLET_IDS.TRUST_WALLET,
  ],
  includeWalletIds: [
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