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

// WalletConnect project ID - using working project ID
const projectId = '2350e68151f4c7fbf239ab45fd750ae0';

// Web3Modal metadata
const metadata = {
  name: 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: 'https://apechain-raffles.com',
  icons: ['https://apechain-raffles.com/favicon.ico'],
  verifyUrl: 'https://apechain-raffles.com'
};

// Create wagmi config - simple working configuration
export const config = defaultWagmiConfig({
  chains: [apeChain],
  projectId,
  metadata
});

// Create Web3Modal - minimal working configuration
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: 'dark'
});