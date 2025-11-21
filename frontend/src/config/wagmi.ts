// Web3Modal removed - using minimal wagmi config
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

// Dynamic URL detection for proper WalletConnect configuration
function getCurrentUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return ENV_CONFIG.environment === 'development' ? 'http://localhost:3000' : ENV_CONFIG.appUrl;
}

// Web3Modal metadata with dynamic URL configuration
const metadata = {
  name: ENV_CONFIG.appName,
  description: 'Decentralized NFT raffle platform on ApeChain',
  url: getCurrentUrl(),
  icons: [`${getCurrentUrl()}/favicon.ico`],
  verifyUrl: getCurrentUrl()
};

// Using minimal wagmi config - see wagmi-minimal.ts
export { config } from './wagmi-minimal';

// Export configuration for debugging (development only)
export const debugConfig = ENV_CONFIG.environment === 'development' ? {
  rpcUrls: buildRpcUrls(),
  environment: ENV_CONFIG.environment,
  hasAlchemyKey: !!ENV_CONFIG.alchemyApiKey
} : undefined;