/**
 * Optimized Web3Modal configuration for minimal bundle size
 * Only loads what's needed for ApeChain NFT Raffles
 */
import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'

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
})

// Project ID from environment
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4'

// Mobile-optimized wagmi config with WalletConnect priority for mobile
export const config = createConfig({
  chains: [apeChain],
  connectors: [
    // Desktop MetaMask
    injected({ 
      target: 'metaMask',
      shimDisconnect: true
    }),
    // WalletConnect for mobile (primary mobile solution)
    walletConnect({ 
      projectId,
      metadata: {
        name: 'ApeChain NFT Raffles',
        description: 'NFT Raffle Platform on ApeChain',
        url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        icons: [`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/favicon.ico`]
      },
      showQrModal: true, // Essential for mobile
      qrModalOptions: {
        themeMode: 'dark'
      }
    }),
    // Coinbase Wallet for mobile
    coinbaseWallet({ 
      appName: 'ApeChain NFT Raffles',
      appLogoUrl: 'https://d3mce6qq270l98.cloudfront.net/favicon.ico',
      preference: 'all'
    }),
  ],
  transports: {
    [apeChain.id]: http(),
  },
  ssr: false,
  multiInjectedProviderDiscovery: false,
})

// Lazy-loaded Web3Modal instance with minimal features
let web3modal: any = null

export const getWeb3Modal = async () => {
  if (!web3modal) {
    // Dynamic import to reduce initial bundle
    const { createWeb3Modal } = await import('@web3modal/wagmi')
    
    web3modal = createWeb3Modal({
      wagmiConfig: config,
      projectId,
      // Minimal features for smaller bundle
      enableAnalytics: false,
      enableOnramp: false,
      // Theme optimization
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#10b981',
        '--w3m-border-radius-master': '12px',
      },
      // Mobile-optimized wallet list
      featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      ],
      // Mobile-specific options
      includeWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
      ],
    })
  }
  return web3modal
}