import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const apeChain = defineChain({
  id: 33139,
  name: 'ApeChain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { http: ['https://apechain.calderachain.xyz/http'] },
  },
  blockExplorers: {
    default: { name: 'ApeChain Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
  testnet: false,
});

export const config = getDefaultConfig({
  appName: 'ApeChain NFT Raffles',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '2f05a7cde2bb14b518a6484396a6fda8',
  chains: [apeChain],
  ssr: false, // Disable SSR for custom chains
});