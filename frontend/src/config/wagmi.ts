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
    themeMode: 'dark',
    // STRICT: Only show these 4 wallets
    includeWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
      '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a'  // Coinbase Wallet (updated ID)
    ],
    // Exclude everything else aggressively
    excludeWalletIds: [
      'ecc4036f814562b41a5268adc86270ffc6a2c746963db0c106e0c6b6b8b24bed', // 1inch
      '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Binance
      'ebb7a772952e6a06905b88b9a6e0a0d7ac1b84d8c8e8c8e8c8e8c8e8c8e8c8e8', // Bitget
      '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66', // TokenPocket
      'bc949c5d968ae81310268bf9193f9c9fb7bb4e1283e1284af8f2bd4992535fd6', // Phantom
      '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f'  // Safe
    ]
  }
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