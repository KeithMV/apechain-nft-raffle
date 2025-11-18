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

// WalletConnect project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '7aca6566c4e099d07b70a3c27981ac9f';

// Web3Modal metadata
const metadata = {
  name: 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: 'https://apechain-raffles.com',
  icons: ['https://apechain-raffles.com/favicon.ico']
};

// Create wagmi config
export const config = defaultWagmiConfig({
  chains: [apeChain],
  projectId,
  metadata,
});

// Create Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeMode: 'dark'
});