import { createConfig, http } from 'wagmi';
import { injected, walletConnect, metaMask } from 'wagmi/connectors';
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
});

export const config = createConfig({
  chains: [apeChain],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'ApeChain NFT Raffles',
        url: 'https://www.apechainraffles.com',
      },
    }),
    injected(),
    walletConnect({
      projectId: '2f05a7cde2bb14b518a6484396a6fda8',
    }),
  ],
  transports: {
    [apeChain.id]: http('https://apechain.calderachain.xyz/http'),
  },
});