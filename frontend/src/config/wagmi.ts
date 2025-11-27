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

// Working project ID from the successful build
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';

// Web3Modal metadata
const metadata = {
  name: 'ApeChain NFT Raffles',
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://d3mce6qq270l98.cloudfront.net',
  icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://d3mce6qq270l98.cloudfront.net/favicon.ico']
};

// Create wagmi config - working configuration
export const config = defaultWagmiConfig({
  chains: [apeChain],
  projectId,
  metadata
});

// Initialize Web3Modal - working setup
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: 'dark',
  enableAnalytics: false,
  enableOnramp: false,
});