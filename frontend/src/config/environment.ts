// Environment Configuration Helper with Alchemy Integration
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  environment: Environment;
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
  appName: string;
  appUrl: string;
  enableLogging: boolean;
  // Alchemy integration
  alchemyApiKey?: string;
  polygonRpcUrl?: string;
}

const getEnvironment = (): Environment => {
  // CRITICAL: Always trust REACT_APP_ENV first (set by build commands)
  const explicitEnv = process.env.REACT_APP_ENV;
  if (explicitEnv === 'staging' || explicitEnv === 'production' || explicitEnv === 'development') {
    return explicitEnv as Environment;
  }
  
  // Fallback: Detect from hostname (for cases where REACT_APP_ENV isn't set)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production domains
    if (hostname === 'web3raffles.io' || hostname === 'apechainraffles.io') {
      return 'production';
    }
    
    // Staging domains (CloudFront)
    if (hostname.includes('d1784e9dgxn2du.cloudfront.net') || hostname.includes('staging')) {
      return 'staging';
    }
    
    // Local development
    if (hostname === 'localhost' || hostname.includes('192.168')) {
      return 'staging'; // You use staging config locally
    }
  }
  
  // Final fallback
  return 'staging';
};

// Helper to detect if running locally (dev server)
const isLocalDevelopment = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || 
         window.location.hostname.includes('192.168') ||
         window.location.port === '3000';
};

// CRITICAL: Use process.env directly instead of hardcoded values
const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    environment: 'development',
    chainId: parseInt(process.env.REACT_APP_CHAIN_ID || '33139'),
    rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x1627E7e63b63878E61f91D336385a59B1747934a',
    appName: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles (DEV)',
    appUrl: process.env.REACT_APP_APP_URL || 'http://localhost:3000',
    enableLogging: process.env.REACT_APP_ENABLE_LOGGING === 'true',
    alchemyApiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    polygonRpcUrl: process.env.REACT_APP_ALCHEMY_API_KEY ? 
      `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}` : 
      'https://polygon.meowrpc.com',
  },
  staging: {
    environment: 'staging',
    chainId: parseInt(process.env.REACT_APP_CHAIN_ID || '33139'),
    rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x1627E7e63b63878E61f91D336385a59B1747934a',
    appName: process.env.REACT_APP_APP_NAME || 'ApeChain NFT Raffles (Staging)',
    appUrl: process.env.REACT_APP_APP_URL || 'https://d1784e9dgxn2du.cloudfront.net',
    enableLogging: process.env.REACT_APP_ENABLE_LOGGING === 'true',
    alchemyApiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    polygonRpcUrl: process.env.REACT_APP_ALCHEMY_API_KEY ? 
      `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}` : 
      'https://polygon.meowrpc.com',
  },
  production: {
    environment: 'production',
    chainId: parseInt(process.env.REACT_APP_CHAIN_ID || '33139'),
    rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x1627E7e63b63878E61f91D336385a59B1747934a',
    appName: process.env.REACT_APP_APP_NAME || 'Web3 NFT Raffles',
    appUrl: process.env.REACT_APP_APP_URL || 'https://web3raffles.io',
    enableLogging: process.env.REACT_APP_ENABLE_LOGGING === 'true',
    alchemyApiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    polygonRpcUrl: process.env.REACT_APP_ALCHEMY_API_KEY ? 
      `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}` : 
      'https://polygon.meowrpc.com',
  },
};

export const config = configs[getEnvironment()];

export const isDevelopment = config.environment === 'development';
export const isStaging = config.environment === 'staging';
export const isProduction = config.environment === 'production';

// Logging helper
export const log = (...args: unknown[]) => {
  if (config.enableLogging) {
  }
};

export const logError = (...args: unknown[]) => {
  if (config.enableLogging) {
    console.error(`[${config.environment.toUpperCase()}]`, ...args);
  }
};

// Debug helper to see what environment is detected
if (typeof window !== 'undefined' && config.enableLogging) {
}