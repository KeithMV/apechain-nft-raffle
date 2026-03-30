/**
 * Simplified Contract Configuration
 * Single source of truth for all contract addresses
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  factory: string;
  template: string;
  version: 'v4';
  rateLimit: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: string;
}

// Simplified contract configuration - V4 only
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  33139: { // ApeChain
    chainId: 33139,
    name: 'ApeChain',
    factory: '0x1627E7e63b63878E61f91D336385a59B1747934a', // V4 only
    template: '0x242f56507BFd5034b369418A7C9FB1b4643710a4',
    version: 'v4',
    rateLimit: 10,
    rpcUrl: 'https://apechain.calderachain.xyz/http',
    explorerUrl: 'https://apescan.io',
    nativeCurrency: 'APE'
  },
  137: { // Polygon
    chainId: 137,
    name: 'Polygon',
    factory: '0x5854AF7c836275c55469350a114F62a1609c4A42',
    template: '0xC7b41b9749724260B4264B90555c9417d66D655A',
    version: 'v4',
    rateLimit: 10,
    rpcUrl: process.env.REACT_APP_ALCHEMY_API_KEY 
      ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`
      : 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: 'POL'
  }
};

export const DEFAULT_CHAIN_ID = 33139; // ApeChain

/**
 * Get chain configuration
 */
export function getChainConfig(chainId?: number): ChainConfig {
  const id = chainId || DEFAULT_CHAIN_ID;
  const config = CHAIN_CONFIGS[id];
  
  if (!config) {
    console.warn(`Unsupported chain ${id}, falling back to ApeChain`);
    return CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
  }
  
  return config;
}

/**
 * Get factory address for chain
 */
export function getFactoryAddress(chainId?: number): string {
  return getChainConfig(chainId).factory;
}

/**
 * Get template address for chain
 */
export function getTemplateAddress(chainId?: number): string {
  return getChainConfig(chainId).template;
}

/**
 * Check if chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChains(): number[] {
  return Object.keys(CHAIN_CONFIGS).map(Number);
}

/**
 * Get contracts for a chain (legacy compatibility)
 */
export function getContracts(chainId?: number) {
  const config = getChainConfig(chainId);
  return {
    RAFFLE_FACTORY: config.factory,
    RAFFLE_FACTORY_V4: config.factory,
    RAFFLE_TEMPLATE: config.template
  };
}

// Legacy compatibility exports
export const getRaffleFactoryAddress = getFactoryAddress;
export const getRaffleTemplateAddress = getTemplateAddress;
export const isV4Available = () => true; // Always true now
export const getRateLimit = () => 10; // Always 10 seconds for V4
export const RAFFLE_FACTORY_ADDRESS = getFactoryAddress(); // Legacy export
export const RAFFLE_TEMPLATE_ADDRESS = getTemplateAddress(); // Legacy export