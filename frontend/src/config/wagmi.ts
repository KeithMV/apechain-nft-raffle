import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { walletConnect, injected } from 'wagmi/connectors';

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

// Clear old WalletConnect sessions on load
if (typeof window !== 'undefined') {
  // Clear localStorage WalletConnect data
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('wc@2') || key.startsWith('@walletconnect')) {
      localStorage.removeItem(key);
    }
  });
}

// MetaMask injected connector for desktop
export const metaMaskConnector = injected({
  target: 'metaMask'
});

// WalletConnect with only ApeChain-compatible wallets
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
    themeMode: 'dark'
  } as any // Bypass TypeScript for wallet filtering
});

// Optimized config for ApeChain with both desktop and mobile support
export const config = createConfig({
  chains: [apeChain],
  connectors: [metaMaskConnector, walletConnectConnector],
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
});