import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const apeChainMainnet = defineChain({
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

export const chains = [apeChainMainnet] as const;

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({
      target: 'metaMask',
    }),
    walletConnect({
      projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '2f05a7cde2bb14b518a6484396a6fda8',
      metadata: {
        name: 'ApeChain NFT Raffles',
        description: 'Decentralized NFT raffle platform on ApeChain',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://d3mce6qq270l98.cloudfront.net',
        icons: ['https://d3mce6qq270l98.cloudfront.net/logo192.png'],
      },
      showQrModal: true,
    }),
    injected(), // Fallback for other wallets
  ],
  transports: {
    [apeChainMainnet.id]: http('https://apechain.calderachain.xyz/http'),
  },
});