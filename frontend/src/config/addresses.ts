/**
 * Centralized Contract Addresses Configuration for ApeCoin NFT Raffle System
 */

const NETWORK_CONFIGS = {
  33139: { // ApeChain
    chainId: 33139,
    rpcUrl: 'https://apechain.calderachain.xyz/http',
    name: 'ApeChain',
    explorerUrl: 'https://apescan.io',
    nativeCurrency: 'APE'
  },
  8453: { // Base Mainnet
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    name: 'Base',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: 'ETH'
  },
  84532: { // Base Sepolia Testnet
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    name: 'Base Sepolia',
    explorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: 'ETH'
  }
} as const;

const CONTRACT_ADDRESSES = {
  33139: { // ApeChain
    RAFFLE_FACTORY: '0x05139110Db8FF9cF82A836Af95eff4530011c705',
    RAFFLE_TEMPLATE: '0xB92a6C1132C6F42fC7335aa341B0AABF33ee609E'
  },
  8453: { // Base Mainnet - To be deployed
    RAFFLE_FACTORY: '', // Deploy here
    RAFFLE_TEMPLATE: ''
  },
  84532: { // Base Sepolia - For testing
    RAFFLE_FACTORY: '', // Test deployment
    RAFFLE_TEMPLATE: ''
  }
} as const;

const PROTOCOL_INFO = {
  name: 'ApeCoin NFT Raffle System',
  version: 'v2-secure',
  status: 'Active - Secure NFT Raffle Platform'
} as const;

function getCurrentChainId(): number {
  // Default to ApeChain, will be updated by wallet connection
  return 33139;
}

function getNetworkConfig(chainId?: number) {
  try {
    const currentChainId = chainId || getCurrentChainId();
    const config = NETWORK_CONFIGS[currentChainId as keyof typeof NETWORK_CONFIGS];
    
    if (!config) {
      // Fallback to ApeChain for unsupported networks
      return NETWORK_CONFIGS[33139];
    }
    
    return config;
  } catch (error) {
    // Safe fallback to ApeChain on error
    return NETWORK_CONFIGS[33139];
  }
}

function getContracts(chainId?: number) {
  try {
    const currentChainId = chainId || getCurrentChainId();
    const contracts = CONTRACT_ADDRESSES[currentChainId as keyof typeof CONTRACT_ADDRESSES];
    
    if (!contracts) {
      // Fallback to ApeChain for unconfigured chains
      return CONTRACT_ADDRESSES[33139];
    }
    
    // Validate that required contracts are configured
    if (!contracts.RAFFLE_FACTORY || !contracts.RAFFLE_TEMPLATE) {
      // Fallback to ApeChain for incomplete configurations
      return CONTRACT_ADDRESSES[33139];
    }
    
    return contracts;
  } catch (error) {
    // Safe fallback to ApeChain on error
    return CONTRACT_ADDRESSES[33139];
  }
}

function getRaffleFactoryAddress(chainId?: number): string {
  try {
    const address = getContracts(chainId).RAFFLE_FACTORY;
    
    if (!address) {
      throw new Error(`No Raffle Factory address configured for chain ${chainId || getCurrentChainId()}`);
    }
    
    return address;
  } catch (error) {
    // Return ApeChain address as safe fallback
    return CONTRACT_ADDRESSES[33139].RAFFLE_FACTORY;
  }
}

function getRaffleTemplateAddress(chainId?: number): string {
  try {
    const address = getContracts(chainId).RAFFLE_TEMPLATE;
    
    if (!address) {
      throw new Error(`No Raffle Template address configured for chain ${chainId || getCurrentChainId()}`);
    }
    
    return address;
  } catch (error) {
    // Return ApeChain address as safe fallback
    return CONTRACT_ADDRESSES[33139].RAFFLE_TEMPLATE;
  }
}

/**
 * Validates contract configuration for a given chain
 * Useful for debugging and client setup
 */
function validateChainConfig(chainId: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Check if network is supported
    if (!NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS]) {
      errors.push(`Unsupported network: ${chainId}`);
    }
    
    // Check if contracts are configured
    const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!contracts) {
      errors.push(`No contract addresses configured for chain ${chainId}`);
    } else {
      if (!contracts.RAFFLE_FACTORY) {
        errors.push(`Missing Raffle Factory address for chain ${chainId}`);
      }
      if (!contracts.RAFFLE_TEMPLATE) {
        errors.push(`Missing Raffle Template address for chain ${chainId}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push(`Validation error: ${error}`);
    return { isValid: false, errors };
  }
}

// Legacy exports for backward compatibility
const NETWORK_CONFIG = NETWORK_CONFIGS[33139];
const RAFFLE_FACTORY_ADDRESS = getRaffleFactoryAddress();
const RAFFLE_TEMPLATE_ADDRESS = getRaffleTemplateAddress();

export {
  NETWORK_CONFIGS,
  NETWORK_CONFIG,
  CONTRACT_ADDRESSES,
  PROTOCOL_INFO,
  getCurrentChainId,
  getNetworkConfig,
  getContracts,
  getRaffleFactoryAddress,
  getRaffleTemplateAddress,
  validateChainConfig,
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_TEMPLATE_ADDRESS
};