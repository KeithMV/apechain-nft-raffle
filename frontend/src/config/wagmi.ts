import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';

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

// WalletConnect project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '7aca6566c4e099d07b70a3c27981ac9f';

// Create wagmi config with minimal connectors
export const config = createConfig({
  chains: [apeChain],
  connectors: [
    metaMask(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'ApeChain NFT Raffles',
        description: 'Decentralized NFT raffle platform on ApeChain',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://apechainraffles.io',
        icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://apechainraffles.io/favicon.ico']
      }
    }),
    coinbaseWallet({
      appName: 'ApeChain NFT Raffles',
      appLogoUrl: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://apechainraffles.io/favicon.ico'
    })
  ],
  transports: {
    [apeChain.id]: http()
  }
});