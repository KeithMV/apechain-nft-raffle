import { createConfig, http } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const apeChainMainnet = defineChain({
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

export const chains = [apeChainMainnet] as const;

// Mobile detection utility
export const isMobileDevice = () => {
  return typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if we're on mobile
const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // WalletConnect for mobile compatibility
    walletConnect({
      projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '2f05a7cde2bb14b518a6484396a6fda8',
      metadata: {
        name: 'ApeChain NFT Raffles',
        description: 'Decentralized NFT raffle platform on ApeChain',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://d3mce6qq270l98.cloudfront.net',
        icons: ['https://d3mce6qq270l98.cloudfront.net/logo192.png'],
      },
      showQrModal: !isMobile, // Hide QR on mobile, show deep links instead
    }),
    // Coinbase Wallet for mobile Safari
    coinbaseWallet({
      appName: 'ApeChain NFT Raffles',
      appLogoUrl: 'https://d3mce6qq270l98.cloudfront.net/logo192.png',
    }),
    // Injected wallets (MetaMask, etc.)
    injected({
      target: 'metaMask',
    }),
    injected(), // Fallback for other injected wallets
  ],
  transports: {
    [apeChainMainnet.id]: http('https://apechain.calderachain.xyz/http'),
  },
});