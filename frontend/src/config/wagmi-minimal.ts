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

// Mobile-safe wagmi config with enhanced compatibility
export const config = createConfig({
  chains: [apeChain],
  connectors: [
    // Generic injected connector for maximum mobile compatibility
    injected({
      shimDisconnect: true, // Better mobile disconnect handling
    }),
    // Specific connectors as fallbacks
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
    injected({
      target: 'coinbaseWallet', 
      shimDisconnect: true,
    }),
  ],
  transports: {
    [apeChain.id]: http(),
  },
  // Mobile-safe configuration
  ssr: false, // Disable SSR for better mobile compatibility
});