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

// WalletConnect project ID - use your own project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '7aca6566c4e099d07b70a3c27981ac9f';

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
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    themeMode: 'dark'
  });
  console.log('Web3Modal initialized successfully with projectId:', projectId);
} catch (error) {
  console.error('Failed to initialize Web3Modal:', error);
}