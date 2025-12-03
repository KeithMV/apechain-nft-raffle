// ApeChain Compatible Wallets Configuration
export const APECHAIN_COMPATIBLE_WALLETS = {
  // Confirmed working wallets
  METAMASK: {
    name: 'MetaMask',
    id: 'metaMask',
    supported: true,
    mobile: true,
    desktop: true,
    icon: '🦊'
  },
  
  WALLET_CONNECT: {
    name: 'WalletConnect',
    id: 'walletConnect', 
    supported: true,
    mobile: true,
    desktop: false,
    icon: '🔗'
  },

  // Known compatible wallets
  TRUST_WALLET: {
    name: 'Trust Wallet',
    id: 'trust',
    supported: true,
    mobile: true,
    desktop: false,
    icon: '🛡️'
  },

  RAINBOW: {
    name: 'Rainbow',
    id: 'rainbow',
    supported: true,
    mobile: true,
    desktop: true,
    icon: '🌈'
  }
};

// Wallets that DON'T support ApeChain (filter these out)
export const INCOMPATIBLE_WALLETS = [
  'coinbaseWallet', // Coinbase Wallet doesn't support custom chains easily
  'ledger', // Hardware wallets need special setup
  'trezor',
  'phantom', // Solana wallet
  'keplr', // Cosmos wallet
  'argent', // Ethereum L2 focused
  'gnosis', // Multi-sig focused
  'frame' // Desktop only, limited chain support
];

export const isWalletCompatible = (walletId: string): boolean => {
  return !INCOMPATIBLE_WALLETS.includes(walletId);
};

export const getCompatibleWallets = () => {
  return Object.values(APECHAIN_COMPATIBLE_WALLETS).filter(wallet => wallet.supported);
};