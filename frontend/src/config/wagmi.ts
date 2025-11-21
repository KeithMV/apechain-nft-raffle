import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defineChain } from 'viem';

// Environment configuration with validation
class ConfigError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = 'ConfigError';
  }
}

// Validate required environment variables
function validateEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new ConfigError(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Environment-based configuration
const ENV_CONFIG = {
  alchemyApiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
  apechainRpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
  backupRpcUrl: process.env.REACT_APP_BACKUP_RPC_URL || 'https://rpc.apechain.com',
  walletConnectProjectId: validateEnvVar('REACT_APP_WALLETCONNECT_PROJECT_ID', 'b848c907908cee0c1bcf0ab0493da6c4'),
  appName: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles',
  appUrl: process.env.REACT_APP_APP_URL || 'https://d3mce6qq270l98.cloudfront.net',
  environment: process.env.REACT_APP_ENVIRONMENT || 'development'
};

// Build RPC URLs with proper fallback
function buildRpcUrls(): string[] {
  const urls: string[] = [];
  
  // Add Alchemy if API key is available
  if (ENV_CONFIG.alchemyApiKey) {
    urls.push(`https://apechain-mainnet.g.alchemy.com/v2/${ENV_CONFIG.alchemyApiKey}`);
  }
  
  // Add official and backup RPCs
  urls.push(ENV_CONFIG.apechainRpcUrl, ENV_CONFIG.backupRpcUrl);
  
  return urls;
}

// ApeChain configuration with environment-based RPC URLs
export const apeChain = defineChain({
  id: 33139,
  name: 'ApeChain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { http: buildRpcUrls() },
  },
  blockExplorers: {
    default: { name: 'ApeChain Explorer', url: 'https://apechain.calderaexplorer.xyz' },
  },
  testnet: false,
});

// Web3Modal metadata with environment configuration
const metadata = {
  name: ENV_CONFIG.appName,
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: ENV_CONFIG.environment === 'development' ? 'http://localhost:3000' : ENV_CONFIG.appUrl,
  icons: [`${ENV_CONFIG.environment === 'development' ? 'http://localhost:3000' : ENV_CONFIG.appUrl}/favicon.ico`],
  verifyUrl: ENV_CONFIG.environment === 'development' ? 'http://localhost:3000' : ENV_CONFIG.appUrl
};

// Create wagmi config with error handling
export const config = (() => {
  try {
    return defaultWagmiConfig({
      chains: [apeChain],
      projectId: ENV_CONFIG.walletConnectProjectId,
      metadata
    });
  } catch (error) {
    console.error('Failed to create wagmi config:', error);
    throw new ConfigError('Unable to initialize Web3 configuration');
  }
})();

// Initialize Web3Modal with comprehensive error handling
let web3ModalInitialized = false;

export function initializeWeb3Modal(): boolean {
  if (web3ModalInitialized) {
    return true;
  }

  try {
    createWeb3Modal({
      wagmiConfig: config,
      projectId: ENV_CONFIG.walletConnectProjectId,
      themeMode: 'dark',
      enableAnalytics: ENV_CONFIG.environment === 'production',
      enableOnramp: false, // Disable for security
    });
    
    web3ModalInitialized = true;
    
    if (ENV_CONFIG.environment === 'development') {
      console.log('✅ Web3Modal initialized successfully');
      console.log('📊 RPC URLs:', buildRpcUrls().length, 'endpoints configured');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Web3Modal:', error);
    
    // Production-grade error handling
    if (ENV_CONFIG.environment === 'production') {
      // Log to monitoring service in production
      // Example: Sentry.captureException(error);
    }
    
    return false;
  }
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initializeWeb3Modal();
}

// Export configuration for debugging (development only)
export const debugConfig = ENV_CONFIG.environment === 'development' ? {
  rpcUrls: buildRpcUrls(),
  environment: ENV_CONFIG.environment,
  hasAlchemyKey: !!ENV_CONFIG.alchemyApiKey
} : undefined;