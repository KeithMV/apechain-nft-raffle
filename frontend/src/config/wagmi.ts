import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defineChain } from 'viem';

// ApeChain configuration
export const apeChain = defineChain({
  id: 33139,
  name: 'ApeChain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { 
      http: [
        process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
        'https://rpc.apechain.com'
      ] 
    },
  },
  blockExplorers: {
    default: { name: 'ApeChain Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
  testnet: false,
});

// WalletConnect project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Web3Modal metadata - mobile optimized
const metadata = {
  name: 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://d3mce6qq270l98.cloudfront.net',
  icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://d3mce6qq270l98.cloudfront.net/favicon.ico']
};

// Create wagmi config with mobile-first approach
export const config = defaultWagmiConfig({
  chains: [apeChain],
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: true,
});

// Create Web3Modal with mobile-optimized settings
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  // Mobile-specific optimizations
  allowUnsupportedChain: false,
  enableOnramp: false,
  enableSwaps: false,
  // Wallet selection optimized for mobile
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ],
});