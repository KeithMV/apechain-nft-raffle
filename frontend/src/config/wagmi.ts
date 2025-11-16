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

export const isMobileDevice = () => {
  return typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Static connector configuration to prevent SSR hydration mismatch
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    walletConnect({
      projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '2f05a7cde2bb14b518a6484396a6fda8',
      metadata: {
        name: 'ApeChain NFT Raffles',
        description: 'Decentralized NFT raffle platform on ApeChain',
        url: 'https://www.apechainraffles.com',
        icons: ['https://www.apechainraffles.com/logo192.png'],
      },
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: 'ApeChain NFT Raffles',
      appLogoUrl: 'https://www.apechainraffles.com/logo192.png',
    }),
    injected(),
  ],
  transports: {
    [apeChainMainnet.id]: http('https://apechain.calderachain.xyz/http'),
  },
});