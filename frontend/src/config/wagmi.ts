import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defineChain } from 'viem';
import { base } from 'viem/chains';
import { config as envConfig } from './environment';

// ApeChain configuration with environment support
export const apeChain = defineChain({
  id: 33139, // Always use ApeChain mainnet for now
  name: 'ApeChain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { 
      http: ['https://apechain.calderachain.xyz/http', 'https://rpc.apechain.com'] 
    },
  },
  blockExplorers: {
    default: { name: 'ApeChain Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
  testnet: false,
});

// Base chain (imported from viem)
export const baseChain = base;

// WalletConnect project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Minimal Web3Modal metadata - use production values for compatibility
const metadata = {
  name: 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: 'https://apechainraffles.io',
  icons: ['https://apechainraffles.io/favicon.ico']
};

// Create wagmi config with multi-chain support
export const config = defaultWagmiConfig({
  chains: [apeChain, baseChain],
  projectId,
  metadata,
  // Ultra-aggressive connection optimizations
  ssr: false,
  syncConnectedChain: true,
  pollingInterval: 500, // Even faster polling - 500ms
  batch: { multicall: true },
  cacheTime: 1000, // Ultra-short cache - 1 second
});

// Create Web3Modal with mobile-optimized settings
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  enableOnramp: false,
  enableSwaps: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 40,
    '--w3m-accent': '#000000'
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ],
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ],
  defaultChain: apeChain,
  chainImages: {
    33139: 'https://apechain.calderaexplorer.xyz/favicon.ico',
    8453: 'https://base.org/favicon.ico'
  }
});