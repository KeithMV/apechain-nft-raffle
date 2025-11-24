import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

// Minimal ApeChain configuration
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
});

// Ultra mobile-safe wagmi config
export const config = createConfig({
  chains: [apeChain],
  connectors: [
    // Professional mobile Safari compatible connector
    injected({
      shimDisconnect: false, // Critical for mobile Safari
      target: () => ({
        id: 'injected',
        name: 'Injected',
        provider: window.ethereum,
      }),
    }),
  ],
  transports: {
    [apeChain.id]: http(process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http', {
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
  // Mobile-safe configuration
  ssr: false,
  // Batch requests for better mobile performance
  batch: {
    multicall: true,
  },
});