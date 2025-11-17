import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
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
    injected(),
    walletConnect({
      projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '7aca6566c4e099d07b70a3c27981ac9f',
    }),
  ],
  transports: {
    [apeChain.id]: http('https://apechain.calderachain.xyz/http'),
  },
});