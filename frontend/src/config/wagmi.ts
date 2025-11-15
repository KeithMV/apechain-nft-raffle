import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
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
    injected(),
  ],
  transports: {
    [apeChainMainnet.id]: http('https://apechain.calderachain.xyz/http'),
  },
});