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
    default: { http: ['https://apechain-mainnet.g.alchemy.com/v2/3YobnRFCSYEuIC5c1ySEs'] },
  },
  blockExplorers: {
    default: { name: 'ApeChain Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
  testnet: false,
});

// WalletConnect project ID - new project with proper domain authorization
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Web3Modal metadata
const metadata = {
  name: 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: 'https://apechainraffles.com',
  icons: ['https://apechainraffles.com/favicon.ico'],
  verifyUrl: 'https://apechainraffles.com'
};

// Create wagmi config - simple working configuration
export const config = defaultWagmiConfig({
  chains: [apeChain],
  projectId,
  metadata
});

// Create Web3Modal - minimal working configuration
try {
  if (!projectId) {
    throw new Error('WalletConnect project ID is required');
  }
  
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    themeMode: 'dark'
  });
  console.log('Web3Modal initialized successfully with projectId:', projectId);
} catch (error) {
  console.error('Failed to initialize Web3Modal:', error);
  // Fallback: Continue without Web3Modal to prevent app crash
  if (typeof window !== 'undefined') {
    window.alert('Wallet connection may not work properly. Please refresh the page.');
  }
}