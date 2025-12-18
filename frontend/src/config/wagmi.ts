import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';

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

// Desktop and mobile connectors
export const metaMaskConnector = injected({ target: 'metaMask' });
export const coinbaseConnector = coinbaseWallet({ appName: 'ApeChain NFT Raffle' });
export const injectedConnector = injected();
export const walletConnectConnector = walletConnect({
  projectId: 'b848c907908cee0c1bcf0ab0493da6c4',
  metadata: {
    name: 'ApeChain NFT Raffle',
    description: 'Win exclusive NFTs on ApeChain',
    url: 'https://apechainraffles.io',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  }
});

export const config = createConfig({
  chains: [apeChain],
  connectors: [metaMaskConnector, coinbaseConnector, injectedConnector, walletConnectConnector],
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
});