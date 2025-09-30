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
    RAFFLE_FACTORY: '0xa7652f6175C664bd09A7d726A5a51ebeBe2A2DBC',
    RAFFLE_TEMPLATE: '0xB92a6C1132C6F42fC7335aa341B0AABF33ee609E'
  },
  development: {
    RAFFLE_FACTORY: '0xa7652f6175C664bd09A7d726A5a51ebeBe2A2DBC', // Use prod for now
    RAFFLE_TEMPLATE: '0xB92a6C1132C6F42fC7335aa341B0AABF33ee609E'  // Use prod for now
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