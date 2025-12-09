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

// Clear old WalletConnect sessions on load with error handling
if (typeof window !== 'undefined') {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('wc@2') || key.startsWith('@walletconnect')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear WalletConnect storage:', error);
  }
}

// MetaMask injected connector for desktop with enhanced options
export const metaMaskConnector = injected({
  target: 'metaMask',
  shimDisconnect: true,
  unstable_shimAsyncInject: 2000, // Wait for MetaMask injection
});

// WalletConnect for mobile with filtered wallet list
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
    themeMode: 'dark',
    // Show only these 4 ApeChain-compatible wallets
    explorerRecommendedWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
      '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a'  // Coinbase Wallet
    ],
    explorerExcludedWalletIds: 'ALL' // Hide all others except recommended
  }
});

// Optimized config for ApeChain with basic transport (gas estimation issue is ApeChain infrastructure)
export const config = createConfig({
  chains: [apeChain],
  connectors: [metaMaskConnector, walletConnectConnector],
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
});