import { createConfig, http } from 'wagmi';
import { metaMask, walletConnect, coinbaseWallet, injected } from 'wagmi/connectors';
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

// Validate ApeChain configuration
if (!apeChain.id || !apeChain.rpcUrls.default.http[0]) {
  throw new Error('Invalid ApeChain configuration');
}

// WalletConnect project ID with validation
const WALLETCONNECT_PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '7aca6566c4e099d07b70a3c27981ac9f';

if (!WALLETCONNECT_PROJECT_ID || WALLETCONNECT_PROJECT_ID.length < 10) {
  console.error('Invalid WalletConnect project ID');
}

// Create wagmi configuration
export const config = createConfig({
  chains: [apeChain],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'ApeChain NFT Raffles',
        url: 'https://apechain-raffles.com',
      },
    }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'ApeChain NFT Raffles',
        description: 'Decentralized NFT raffle platform on ApeChain',
        url: 'https://apechain-raffles.com',
        icons: ['https://apechain-raffles.com/favicon.ico'],
      },
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: 'ApeChain NFT Raffles',
      appLogoUrl: 'https://apechain-raffles.com/logo192.png',
    }),
    injected(),
  ],
  transports: {
    [apeChain.id]: http('https://apechain.calderachain.xyz/http'),
  },
  ssr: false,
});