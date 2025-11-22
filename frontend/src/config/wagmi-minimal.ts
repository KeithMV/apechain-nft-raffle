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
    // Single generic injected connector for maximum mobile compatibility
    injected({
      shimDisconnect: true,
      // Mobile-safe options
      target() {
        // Return the first available injected wallet
        return typeof window !== 'undefined' && window.ethereum ? 'injected' : 'metaMask';
      },
    }),
  ],
  transports: {
    [apeChain.id]: http({
      // Mobile-safe transport options
      timeout: 30000, // 30s timeout for mobile networks
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