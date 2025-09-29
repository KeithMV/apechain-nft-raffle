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
    RAFFLE_FACTORY: '0x295BD0316a127ed9ddFC1c74d784D650ab02429D',
    RAFFLE_TEMPLATE: '0xfBAA90BfC8d9F0518827dC1499AAA17B8Bf2790d'
  },
  development: {
    RAFFLE_FACTORY: '0x295BD0316a127ed9ddFC1c74d784D650ab02429D',
    RAFFLE_TEMPLATE: '0xfBAA90BfC8d9F0518827dC1499AAA17B8Bf2790d'
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