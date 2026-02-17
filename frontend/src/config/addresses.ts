import { config as envConfig } from './environment';

/**
 * Centralized Contract Addresses Configuration for ApeCoin NFT Raffle System
 */

const NETWORK_CONFIGS = {
  31337: { // Hardhat localhost
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    name: 'Hardhat',
    explorerUrl: 'http://localhost:8545',
    nativeCurrency: 'ETH'
  },
  33111: { // ApeChain Curtis Testnet
    chainId: 33111,
    rpcUrl: 'https://curtis.rpc.caldera.xyz/http',
    name: 'ApeChain Curtis',
    explorerUrl: 'https://curtis.explorer.caldera.xyz',
    nativeCurrency: 'APE'
  },
  33139: { // ApeChain
    chainId: 33139,
    rpcUrl: 'https://apechain.calderachain.xyz/http',
    name: 'ApeChain',
    explorerUrl: 'https://apescan.io',
    nativeCurrency: 'APE'
  },
  137: { // Polygon Mainnet
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    name: 'Polygon',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: 'MATIC'
  },

} as const;

const CONTRACT_ADDRESSES = {
  31337: { // Hardhat localhost
    RAFFLE_FACTORY: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    RAFFLE_FACTORY_V4: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    RAFFLE_TEMPLATE: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  },
  33111: { // ApeChain Curtis Testnet - DISABLED
    RAFFLE_FACTORY: '0x0000000000000000000000000000000000000000', // Testnet disabled
    RAFFLE_FACTORY_V4: '0x0000000000000000000000000000000000000000',
    RAFFLE_TEMPLATE: '0x0000000000000000000000000000000000000000',
    disabled: true
  },
  33139: { // ApeChain
    RAFFLE_FACTORY: '0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff', // v3-FIXED-FEES
    RAFFLE_FACTORY_V4: '0x1627E7e63b63878E61f91D336385a59B1747934a', // v4-FAST-RATE-LIMIT
    RAFFLE_TEMPLATE: '0x242f56507BFd5034b369418A7C9FB1b4643710a4',
    RAFFLE_FACTORY_LEGACY: '0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900', // v2-old
    RAFFLE_FACTORY_V1: '0x05139110Db8FF9cF82A836Af95eff4530011c705' // v1-legacy
  },
  137: { // Polygon Mainnet
    RAFFLE_FACTORY: "0x5854AF7c836275c55469350a114F62a1609c4A42",
    RAFFLE_FACTORY_V4: "0x5854AF7c836275c55469350a114F62a1609c4A42",
    RAFFLE_TEMPLATE: "0xC7b41b9749724260B4264B90555c9417d66D655A"
  },

} as const;

const PROTOCOL_INFO = {
  name: 'ApeCoin NFT Raffle System',
  version: 'v4-fast-rate-limit',
  status: 'Active - 10 Second Rate Limit',
  securityFixes: ['Fixed reentrancy', 'Enhanced randomness', 'Block-based timing', 'Direct fee transfer to owner'],
  v4Features: ['10-second rate limit', '5% default fee', 'Faster raffle creation']
} as const;

function getCurrentChainId(): number {
  // Always prioritize wallet's actual chain ID
  if (typeof window !== 'undefined' && window.ethereum) {
    const chainId = window.ethereum.chainId;
    if (chainId) {
      // Handle both string (hex) and number types
      if (typeof chainId === 'string') {
        return parseInt(chainId, 16);
      } else if (typeof chainId === 'number') {
        return chainId;
      }
    }
  }
  
  // Default to ApeChain only as last resort
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
    
    return contracts;
  } catch (error) {
    // Safe fallback to ApeChain on error
    return CONTRACT_ADDRESSES[33139];
  }
}

function getRaffleFactoryAddress(chainId?: number, useV4?: boolean): string {
  try {
    const contracts = getContracts(chainId);
    
    // Type-safe access to contract properties
    const factoryV4 = contracts.RAFFLE_FACTORY_V4;
    const factory = contracts.RAFFLE_FACTORY;
    
    // Use V4 if available and requested, or if it's the only option
    if ((useV4 && factoryV4) || (!factory && factoryV4)) {
      return factoryV4;
    }
    
    const address = factory || factoryV4;
    
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
      // Check for empty string addresses (invalid) - improved validation
      const factoryAddr = contracts.RAFFLE_FACTORY;
      const templateAddr = contracts.RAFFLE_TEMPLATE;
      
      if (!factoryAddr || factoryAddr === '0x0000000000000000000000000000000000000000') {
        errors.push(`Missing or invalid Raffle Factory address for chain ${chainId}`);
      }
      if (!templateAddr || templateAddr === '0x0000000000000000000000000000000000000000') {
        errors.push(`Missing or invalid Raffle Template address for chain ${chainId}`);
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
    const v4Address = contracts.RAFFLE_FACTORY_V4;
    return !!(v4Address && v4Address !== '0x0000000000000000000000000000000000000000');
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