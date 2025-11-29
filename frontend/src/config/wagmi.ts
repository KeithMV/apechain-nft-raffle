import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { walletConnect } from 'wagmi/connectors';

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

// Professional WalletConnect configuration
export const walletConnectConnector = walletConnect({
  projectId: 'b848c907908cee0c1bcf0ab0493da6c4',
  metadata: {
    name: 'ApeChain NFT Raffle',
    description: 'Win exclusive NFTs on ApeChain',
    url: typeof window !== 'undefined' && process.env.NODE_ENV === 'development' 
      ? window.location.origin 
      : 'https://apechainraffles.io',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  showQrModal: true,
  qrModalOptions: {
    themeMode: 'light'
  }
});

// Optimized config for ApeChain only
export const config = createConfig({
  chains: [apeChain],
  connectors: [walletConnectConnector],
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
});