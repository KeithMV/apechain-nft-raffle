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
    RAFFLE_FACTORY: '0xB035C089e7880bCc037aaAaE73b2ab1DAaaf6AD6',
    RAFFLE_TEMPLATE: '0x2D4CeC0B3dB6ae8baB8fB235daf1bBc122c4f284'
  },
  development: {
    RAFFLE_FACTORY: '0xB035C089e7880bCc037aaAaE73b2ab1DAaaf6AD6',
    RAFFLE_TEMPLATE: '0x2D4CeC0B3dB6ae8baB8fB235daf1bBc122c4f284'
  }
} as const;

const PROTOCOL_INFO = {
  name: 'ApeCoin NFT Raffle System',
  version: 'v1',
  status: 'Active - NFT Raffle Platform'
} as const;

function getEnvironment(): 'production' | 'development' {
  return (process.env.NODE_ENV as 'production' | 'development') || 'production';
}

function getContracts(env?: 'production' | 'development') {
  const environment = env || getEnvironment();
  return CONTRACT_ADDRESSES[environment] || CONTRACT_ADDRESSES.production;
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