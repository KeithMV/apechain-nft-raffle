import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, coinbaseWallet } from 'wagmi/connectors';

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

// Minimal connectors without WalletConnect
export const metaMaskConnector = injected({ target: 'metaMask' });
export const coinbaseConnector = coinbaseWallet({ appName: 'ApeChain NFT Raffle' });
export const injectedConnector = injected();

export const config = createConfig({
  chains: [apeChain],
  connectors: [metaMaskConnector, coinbaseConnector, injectedConnector],
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
});