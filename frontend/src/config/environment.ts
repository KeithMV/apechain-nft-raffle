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
  const env = process.env.REACT_APP_ENV || process.env.REACT_APP_ENVIRONMENT || 'production';
  return env as Environment;
};

const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    environment: 'development',
    chainId: 31337,
    rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'http://127.0.0.1:8545',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    appName: 'ApeChain NFT Raffles (DEV)',
    appUrl: 'http://localhost:3000',
    enableLogging: true,
  },
  staging: {
    environment: 'staging',
    chainId: 33111,
    rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://curtis.rpc.caldera.xyz/http',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x...staging-address',
    appName: 'ApeChain NFT Raffles (STAGING)',
    appUrl: 'https://staging.apechainraffles.io',
    enableLogging: true,
  },
  production: {
    environment: 'production',
    chainId: 33139,
    rpcUrl: process.env.REACT_APP_APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x...production-address',
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