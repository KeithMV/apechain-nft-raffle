import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { metaMask, coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

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
      http: ['https://apechain.calderachain.xyz/http'] 
    },
  },
  blockExplorers: {
    default: { name: 'ApeChain Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
  testnet: false,
});

// Clean connector setup
export const connectors = [
  metaMask({
    dappMetadata: {
      name: 'ApeChain NFT Raffle',
      url: 'https://apechainraffles.io',
    },
  }),
  coinbaseWallet({
    appName: 'ApeChain NFT Raffle',
    appLogoUrl: 'https://apechainraffles.io/favicon.ico',
  }),
  injected(),
  walletConnect({
    projectId: 'b848c907908cee0c1bcf0ab0493da6c4',
    metadata: {
      name: 'ApeChain NFT Raffle',
      description: 'Win exclusive NFTs on ApeChain',
      url: 'https://apechainraffles.io',
      icons: ['https://avatars.githubusercontent.com/u/37784886']
    },
    showQrModal: true,
  }),
];

export const config = createConfig({
  chains: [apeChain],
  connectors,
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
});