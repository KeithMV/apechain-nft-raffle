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
    RAFFLE_FACTORY: '0x05139110Db8FF9cF82A836Af95eff4530011c705',
    RAFFLE_TEMPLATE: '0x33F9Ea3ec0ce47B15f4b6B757FF3Fc3948D06995'
  },
  development: {
    RAFFLE_FACTORY: '0x05139110Db8FF9cF82A836Af95eff4530011c705',
    RAFFLE_TEMPLATE: '0x33F9Ea3ec0ce47B15f4b6B757FF3Fc3948D06995'
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