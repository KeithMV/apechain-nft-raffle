import { createConfig, http } from 'wagmi';
import { walletConnect, injected } from 'wagmi/connectors';
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
    default: { http: ['https://apechain.calderachain.xyz/http'] },
  },
  blockExplorers: {
    default: { name: 'ApeChain Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
  testnet: false,
});

// WalletConnect project ID
const WALLETCONNECT_PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '7aca6566c4e099d07b70a3c27981ac9f';

// Simple, working configuration
export const config = createConfig({
  chains: [apeChain],
  connectors: [
    injected(), // Works with MetaMask on desktop
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'ApeChain NFT Raffles',
        description: 'Decentralized NFT raffle platform on ApeChain',
        url: 'https://apechain-raffles.com',
        icons: ['https://apechain-raffles.com/favicon.ico'],
      },
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: {
          '--wcm-z-index': '1000'
        }
      }
    }),
  ],
  transports: {
    [apeChain.id]: http('https://apechain.calderachain.xyz/http'),
  },
});