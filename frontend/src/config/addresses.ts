/**
 * Contract Addresses - Simplified Configuration
 * Direct exports from simplified wagmi config
 */

import { getContractAddresses, isSupportedChain, getChainName, apeChain, polygon } from './wagmi';

// =============================================================================
// CHAIN CONFIGURATION FUNCTION
// =============================================================================

/**
 * Get chain configuration (simplified version)
 */
export function getChainConfig(chainId?: number) {
  const targetChainId = chainId || apeChain.id;
  const contracts = getContractAddresses(targetChainId);
  const isPolygon = targetChainId === polygon.id;
  const isApeChain = targetChainId === apeChain.id;
  
  return {
    chainId: targetChainId,
    name: getChainName(targetChainId),
    nativeCurrency: {
      name: isApeChain ? 'ApeCoin' : 'POL',
      symbol: isApeChain ? 'APE' : 'POL',
      decimals: 18,
    },
    explorerUrl: isApeChain ? 'https://apescan.io' : 'https://polygonscan.com',
    rpcUrl: isApeChain 
      ? 'https://apechain.calderachain.xyz/http'
      : `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY || 'fallback'}`,
    contracts: {
      factory: contracts.factory,
      template: contracts.template,
    },
    settings: {
      pollingInterval: 8000, // 8s for all chains
      timeout: isPolygon ? 30000 : 25000, // 30s for Polygon, 25s for ApeChain
      retries: isPolygon ? 3 : 2,
      rateLimit: 10, // 10 seconds
    },
  };
}

// =============================================================================
// SIMPLIFIED CONTRACT ADDRESS FUNCTIONS
// =============================================================================

/**
 * Get factory address for chain
 */
export function getFactoryAddress(chainId?: number): string {
  const contracts = getContractAddresses(chainId || apeChain.id);
  return contracts.factory;
}

/**
 * Get template address for chain
 */
export function getTemplateAddress(chainId?: number): string {
  const contracts = getContractAddresses(chainId || apeChain.id);
  return contracts.template;
}

/**
 * Get all contracts for chain
 */
export function getContracts(chainId?: number) {
  const contracts = getContractAddresses(chainId || apeChain.id);
  return {
    RAFFLE_FACTORY: contracts.factory,
    RAFFLE_FACTORY_V4: contracts.factory,
    RAFFLE_TEMPLATE: contracts.template,
  };
}

// =============================================================================
// CHAIN UTILITIES (Re-exported from wagmi config)
// =============================================================================

export { isSupportedChain, getChainName } from './wagmi';

/**
 * Check if chain is ApeChain
 */
export function isApeChain(chainId?: number): boolean {
  return chainId === apeChain.id;
}

/**
 * Check if chain is Polygon
 */
export function isPolygonChain(chainId?: number): boolean {
  return chainId === polygon.id;
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

// Default addresses (ApeChain)
export const RAFFLE_FACTORY_ADDRESS = getFactoryAddress();
export const RAFFLE_TEMPLATE_ADDRESS = getTemplateAddress();

// Legacy function names
export const getRaffleFactoryAddress = getFactoryAddress;
export const getRaffleTemplateAddress = getTemplateAddress;
export const isV4Available = () => true; // Always true now
export const getRateLimit = () => 10; // Always 10 seconds for V4

// Chain constants
export const DEFAULT_CHAIN_ID = apeChain.id;
export const SUPPORTED_CHAIN_IDS = [apeChain.id, polygon.id];