/**
 * Centralized Contract Addresses Configuration for ApeCoin NFT Raffle System
 */

const NETWORK_CONFIG = {
  chainId: 33139,
  rpcUrl: 'https://apechain.calderachain.xyz/http',
  name: 'ApeChain',
  explorerUrl: 'https://apescan.io'
} as const;

const CONTRACT_ADDRESSES = {
  production: {
    RAFFLE_FACTORY: '0x92cB2037cEe00dF2A32f38D68D101e8869ecEBA3',
    RAFFLE_TEMPLATE: '0xB8AaA74B8fe773b587a90F8540dEFD70C5BB3C8B'
  },
  development: {
    RAFFLE_FACTORY: '0x92cB2037cEe00dF2A32f38D68D101e8869ecEBA3',
    RAFFLE_TEMPLATE: '0xB8AaA74B8fe773b587a90F8540dEFD70C5BB3C8B'
  }
} as const;

const PROTOCOL_INFO = {
  name: 'ApeCoin NFT Raffle System',
  version: 'v2-secure',
  status: 'Active - Secure NFT Raffle Platform'
} as const;

function getEnvironment(): 'production' | 'development' {
  return (process.env.NODE_ENV as 'production' | 'development') || 'production';
}

function getContracts(env?: 'production' | 'development') {
  const environment = env || getEnvironment();
  const contracts = CONTRACT_ADDRESSES[environment] || CONTRACT_ADDRESSES.production;
  
  // Warn if using development environment
  if (environment === 'development') {
    console.warn('⚠️ Using development environment - ensure contracts are properly deployed');
  }
  
  return contracts;
}

const RAFFLE_FACTORY_ADDRESS = getContracts().RAFFLE_FACTORY;
const RAFFLE_TEMPLATE_ADDRESS = getContracts().RAFFLE_TEMPLATE;

export {
  NETWORK_CONFIG,
  CONTRACT_ADDRESSES,
  PROTOCOL_INFO,
  getEnvironment,
  getContracts,
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_TEMPLATE_ADDRESS
};