import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defineChain } from 'viem';
import { config as envConfig } from './environment';

// ApeChain configuration with environment support
export const apeChain = defineChain({
  id: envConfig.chainId,
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
    default: { name: 'ApeChain Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
  testnet: envConfig.environment !== 'production',
});

// WalletConnect project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Minimal Web3Modal metadata with environment support
const metadata = {
  name: envConfig.appName,
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: envConfig.appUrl,
  icons: [`${envConfig.appUrl}/favicon.ico`]
};

// Create wagmi config with ultra-aggressive connection optimizations
export const config = defaultWagmiConfig({
  chains: [apeChain],
  projectId,
  metadata,
  // Ultra-aggressive connection optimizations
  ssr: false,
  syncConnectedChain: true,
  pollingInterval: 500, // Even faster polling - 500ms
  batch: { multicall: true },
  cacheTime: 1000, // Ultra-short cache - 1 second
});

// Create Web3Modal with speed optimizations
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
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask first
  ],
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ],
  excludeWalletIds: [
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
    '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927',
    'ecc4036f814562b41a5268adc86270ffc6a4c9f83a2c88314b42bcda825cb462',
    '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709',
  ],
  allWallets: 'HIDE',
  defaultChain: apeChain
});