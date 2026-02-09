// Environment Configuration Helper
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  environment: Environment;
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
  appName: string;
  appUrl: string;
  enableLogging: boolean;
}

const getEnvironment = (): Environment => {
  // Explicit environment variable takes priority
  if (process.env.REACT_APP_ENV === 'staging') {
    return 'staging';
  }
  
  if (process.env.REACT_APP_ENV === 'development') {
    return 'development';
  }
  
  // Check for development indicators
  if (process.env.NODE_ENV === 'development' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname.includes('192.168')) {
    return 'development';
  }
  
  // Check for staging indicators
  if (process.env.REACT_APP_ENVIRONMENT === 'staging' ||
      window.location.hostname.includes('staging') ||
      window.location.hostname.includes('d2v74bfsjdq40l')) {
    return 'staging';
  }
  
  return 'production';
};

// Helper to detect if running locally (dev server)
const isLocalDevelopment = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname.includes('192.168') ||
         window.location.port === '3000';
};

const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    environment: 'development',
    chainId: 33139,
    rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x1627E7e63b63878E61f91D336385a59B1747934a',
    appName: 'ApeChain NFT Raffles (DEV)',
    appUrl: 'http://192.168.0.252:3000', // Use mobile-accessible IP
    enableLogging: true,
  },
  staging: {
    environment: 'staging',
    chainId: 33139, // Use mainnet like production
    rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x1627E7e63b63878E61f91D336385a59B1747934a',
    appName: 'ApeChain NFT Raffles (STAGING)',
    appUrl: isLocalDevelopment() ? `http://${window.location.hostname}:${window.location.port}` : 'https://staging.apechainraffles.io',
    enableLogging: true,
  },
  production: {
    environment: 'production',
    chainId: 33139,
    rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x1627E7e63b63878E61f91D336385a59B1747934a',
    appName: 'ApeChain NFT Raffles',
    appUrl: 'https://apechainraffles.io',
    enableLogging: false,
  },
};

export const config = configs[getEnvironment()];

export const isDevelopment = config.environment === 'development';
export const isStaging = config.environment === 'staging';
export const isProduction = config.environment === 'production';

// Logging helper
export const log = (...args: any[]) => {
  if (config.enableLogging) {
    console.log(`[${config.environment.toUpperCase()}]`, ...args);
  }
};

export const logError = (...args: any[]) => {
  if (config.enableLogging) {
    console.error(`[${config.environment.toUpperCase()}]`, ...args);
  }
};