import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, walletConnect } from 'wagmi/connectors';

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

// Prevent WalletConnect double initialization
let walletConnectConnector: any = null;

function getWalletConnectConnector() {
  if (!walletConnectConnector) {
    walletConnectConnector = walletConnect({
      projectId: 'b848c907908cee0c1bcf0ab0493da6c4',
      metadata: {
        name: 'ApeChain NFT Raffles',
        description: 'NFT Raffle Platform',
        url: 'https://apechainraffles.io',
        icons: ['https://apechainraffles.io/favicon.ico']
      }
    });
  }
  return walletConnectConnector;
}

// wagmi config with WalletConnect for mobile
export const config = createConfig({
  chains: [apeChain],
  connectors: [
    injected({
      target: 'metaMask'
    }),
    getWalletConnectConnector()
  ],
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
});