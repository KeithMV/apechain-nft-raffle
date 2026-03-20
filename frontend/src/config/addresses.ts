/**
 * Contract Addresses Configuration
 * Centralized contract address management with validation
 */

import type { ContractAddresses, ChainValidation, VersionConfig, ContractVersion } from '../contracts/types';
import { getCurrentChainId, getNetworkConfig, DEFAULT_CHAIN_ID } from './networks';

const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
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
  }
} as const;

const PROTOCOL_INFO = {
  name: 'ApeCoin NFT Raffle System',
  version: 'v4-fast-rate-limit',
  status: 'Active - 10 Second Rate Limit',
  securityFixes: ['Fixed reentrancy', 'Enhanced randomness', 'Block-based timing', 'Direct fee transfer to owner'],
  v4Features: ['10-second rate limit', '5% default fee', 'Faster raffle creation']
} as const;

/**
 * Get contract addresses for a chain
 */
export function getContracts(chainId?: number): ContractAddresses {
  try {
    const currentChainId = chainId || getCurrentChainId();
    const contracts = CONTRACT_ADDRESSES[currentChainId];
    
    if (!contracts) {
      // Fallback to ApeChain for unconfigured chains
      return CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];
    }
    
    return contracts;
  } catch (error) {
    // Safe fallback to ApeChain on error
    return CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];
  }
}

/**
 * Get raffle factory address with version support
 */
export function getRaffleFactoryAddress(chainId?: number, useV4?: boolean): string {
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
    return CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].RAFFLE_FACTORY;
  }
}

/**
 * Get raffle template address
 */
export function getRaffleTemplateAddress(chainId?: number): string {
  try {
    const address = getContracts(chainId).RAFFLE_TEMPLATE;
    
    if (!address) {
      throw new Error(`No Raffle Template address configured for chain ${chainId || getCurrentChainId()}`);
    }
    
    return address;
  } catch (error) {
    // Return ApeChain address as safe fallback
    return CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].RAFFLE_TEMPLATE;
  }
}

/**
 * Validate contract configuration for a chain
 */
export function validateChainConfig(chainId: number): ChainValidation {
  const errors: string[] = [];
  
  try {
    // Check if network is supported
    const networkConfig = getNetworkConfig(chainId);
    if (!networkConfig) {
      errors.push(`Unsupported network: ${chainId}`);
    }
    
    // Check if contracts are configured
    const contracts = CONTRACT_ADDRESSES[chainId];
    if (!contracts) {
      errors.push(`No contract addresses configured for chain ${chainId}`);
    } else {
      // Check for empty string addresses (invalid)
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
export function isV4Available(chainId?: number): boolean {
  try {
    const contracts = getContracts(chainId);
    const v4Address = contracts.RAFFLE_FACTORY_V4;
    return !!(v4Address && v4Address !== '0x0000000000000000000000000000000000000000');
  } catch {
    return false;
  }
}

/**
 * Get rate limit for contract version
 */
export function getRateLimit(useV4?: boolean): number {
  return useV4 ? 10 : 300; // 10 seconds for V4, 5 minutes for V3
}

/**
 * Get version configuration
 */
export function getVersionConfig(chainId?: number, useV4?: boolean): VersionConfig {
  const version: ContractVersion = useV4 ? 'v4' : 'v3';
  const rateLimit = getRateLimit(useV4);
  const address = getRaffleFactoryAddress(chainId, useV4);
  
  return {
    version,
    rateLimit,
    features: useV4 ? [...PROTOCOL_INFO.v4Features] : ['5-minute rate limit', 'Standard fees'],
    address
  };
}

// Legacy exports for backward compatibility
export const RAFFLE_FACTORY_ADDRESS = getRaffleFactoryAddress(undefined, true); // Use V4 by default
export const RAFFLE_TEMPLATE_ADDRESS = getRaffleTemplateAddress();
export { PROTOCOL_INFO, CONTRACT_ADDRESSES };