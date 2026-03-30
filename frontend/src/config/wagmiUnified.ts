import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { CHAIN_IDS, WALLET_IDS } from '../constants/chains';
import { getAllRPCURLs, logRPCConfig, getPrimaryRPCURL } from './rpcConfig';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

// ApeChain configuration - unified for all devices
export const apeChain = defineChain({
  id: CHAIN_IDS.APECHAIN_MAINNET,
  name: 'ApeChain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { 
      http: getAllRPCURLs(CHAIN_IDS.APECHAIN_MAINNET)
    },
  },
  blockExplorers: {
    default: { 
      name: 'ApeChain Explorer', 
      url: 'https://apechain.calderaexplorer.xyz' 
    },
  },
  testnet: false,
});

// Polygon chain - simplified RPC configuration
export const polygonChain = defineChain({
  id: 137,
  name: 'Polygon',
  nativeCurrency: {
    decimals: 18,
    name: 'POL',
    symbol: 'POL',
  },
  rpcUrls: {
    default: {
      http: getAllRPCURLs(137),
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://polygonscan.com',
    },
  },
});

// Device detection utility (runtime)
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    ? 'mobile' : 'desktop';
};

// Direct wagmi configuration with explicit RPC control
const createAdaptiveConfig = () => {
  const isMobile = getDeviceType() === 'mobile';
  
  // Log RPC configuration for debugging
  logRPCConfig();
  
  console.log(`🔧 [UNIFIED CONFIG] Creating direct wagmi configuration for ${isMobile ? 'mobile' : 'desktop'}`);
  console.log('🔗 [RPC] ApeChain RPC:', getPrimaryRPCURL(CHAIN_IDS.APECHAIN_MAINNET));
  console.log('🔗 [RPC] Polygon RPC:', getPrimaryRPCURL(137));
  
  const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'b848c907908cee0c1bcf0ab0493da6c4';
  
  return createConfig({
    chains: [apeChain, polygonChain],
    connectors: [
      injected(),
      walletConnect({ projectId }),
      coinbaseWallet({ appName: 'ApeChain NFT Raffles' }),
    ],
    transports: {
      [CHAIN_IDS.APECHAIN_MAINNET]: http(getPrimaryRPCURL(CHAIN_IDS.APECHAIN_MAINNET)),
      137: http(getPrimaryRPCURL(137), {
        // Add retry and timeout configuration for better reliability
        retryCount: 3,
        retryDelay: 1000,
        timeout: 10000,
      }),
    },
    batch: {
      multicall: {
        batchSize: 1024 * 10, // Reduced to 10KB batches
        wait: 200, // Increased to 200ms delay
      },
    },
    pollingInterval: isMobile ? 20000 : 15000, // Much slower polling
  });
};

// Export single unified config
export const config = createAdaptiveConfig();

export const getWalletConfig = () => {
  const isMobile = getDeviceType() === 'mobile';
  
  return {
    // For desktop, don't specify featuredWalletIds to let Web3Modal show all available wallets
    featuredWalletIds: isMobile ? [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ] : undefined, // Let Web3Modal auto-detect on desktop
    
    // Don't restrict wallet IDs on desktop
    includeWalletIds: isMobile ? [
      WALLET_IDS.METAMASK,
      WALLET_IDS.TRUST_WALLET,
      WALLET_IDS.RAINBOW,
    ] : undefined,
    
    // Only exclude problematic wallets on mobile
    excludeWalletIds: isMobile ? [
      WALLET_IDS.COINBASE,
      WALLET_IDS.LEDGER,
    ] : [],
  };
};