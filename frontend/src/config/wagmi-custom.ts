import { createConfig, http } from 'wagmi';
import { metaMask, injected, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem';

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

// Create wagmi config with only our 3 wallets
export const config = createConfig({
  chains: [apeChain],
  connectors: [
    metaMask(),
    injected({ target: 'rainbow' }),
    injected({ target: 'trust' }),
    walletConnect({ projectId: 'b848c907908cee0c1bcf0ab0493da6c4' })
  ],
  transports: {
    [apeChain.id]: http()
  },
});