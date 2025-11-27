import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

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

// Mobile-compatible wagmi config
export const config = createConfig({
  chains: [apeChain],
  connectors: [
    // Universal injected connector for all mobile wallets
    injected({
      target: () => ({
        id: 'injected',
        name: 'Wallet',
        provider: typeof window !== 'undefined' ? window.ethereum : undefined,
      }),
    })
  ],
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
  multiInjectedProviderDiscovery: false,
});