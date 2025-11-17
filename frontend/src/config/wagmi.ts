import { createConfig, http } from 'wagmi';
import { injected, walletConnect, coinbaseWallet, metaMask } from '@wagmi/connectors';
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

export const config = createConfig({
  chains: [apeChain],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'ApeChain NFT Raffles',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://www.apechainraffles.com',
      },
    }),
    walletConnect({
      projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID!,
      metadata: {
        name: 'ApeChain NFT Raffles',
        description: 'Decentralized NFT raffle platform on ApeChain',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://www.apechainraffles.com',
        icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://www.apechainraffles.com'}/logo192.png`],
      },
    }),
    coinbaseWallet({
      appName: 'ApeChain NFT Raffles',
      appLogoUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.apechainraffles.com'}/logo192.png`,
    }),
    injected(),
  ],
  transports: {
    [apeChain.id]: http('https://apechain.calderachain.xyz/http'),
  },
});