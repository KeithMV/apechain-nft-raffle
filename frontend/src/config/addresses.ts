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
    RAFFLE_FACTORY: '0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff', // v3-FIXED-FEES
    RAFFLE_FACTORY_V4: '0x1627E7e63b63878E61f91D336385a59B1747934a', // v4-FAST-RATE-LIMIT
    RAFFLE_TEMPLATE: '0x242f56507BFd5034b369418A7C9FB1b4643710a4',
    RAFFLE_FACTORY_LEGACY: '0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900', // v2-old
    RAFFLE_FACTORY_V1: '0x05139110Db8FF9cF82A836Af95eff4530011c705' // v1-legacy
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
  version: 'v4-fast-rate-limit',
  status: 'Active - 10 Second Rate Limit',
  securityFixes: ['Fixed reentrancy', 'Enhanced randomness', 'Block-based timing', 'Direct fee transfer to owner'],
  v4Features: ['10-second rate limit', '5% default fee', 'Faster raffle creation']
} as const;

function getCurrentChainId(): number {
  // Try to get chain ID from window.ethereum if available
  if (typeof window !== 'undefined' && window.ethereum) {
    const chainId = window.ethereum.chainId;
    if (chainId) {
      return parseInt(chainId, 16);
    }
  }
  // Default to ApeChain
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

function getRaffleFactoryAddress(chainId?: number, useV4?: boolean): string {
  try {
    const contracts = getContracts(chainId);
    
    // Use V4 if available and requested
    if (useV4 && contracts.RAFFLE_FACTORY_V4) {
      return contracts.RAFFLE_FACTORY_V4;
    }
    
    const address = contracts.RAFFLE_FACTORY;
    
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

/**
 * Check if V4 is available and configured
 */
function isV4Available(chainId?: number): boolean {
  try {
    const contracts = getContracts(chainId);
    return !!(contracts.RAFFLE_FACTORY_V4 && contracts.RAFFLE_FACTORY_V4.length > 0);
  } catch {
    return false;
  }
}

/**
 * Get rate limit for current version
 */
function getRateLimit(useV4?: boolean): number {
  return useV4 ? 10 : 300; // 10 seconds for V4, 5 minutes for V3
}

// Legacy exports for backward compatibility
const NETWORK_CONFIG = NETWORK_CONFIGS[33139];
const RAFFLE_FACTORY_ADDRESS = getRaffleFactoryAddress(undefined, true); // Use V4 by default
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
  isV4Available,
  getRateLimit,
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_TEMPLATE_ADDRESS
};