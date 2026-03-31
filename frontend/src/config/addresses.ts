/**
 * Contract Addresses - Unified Configuration
 * Re-exports from unified config for backward compatibility
 */

// Re-export everything from unified config
export {
  ChainConfig,
  CHAIN_CONFIGS,
  DEFAULT_CHAIN_ID,
  SUPPORTED_CHAIN_IDS,
  getChainConfig,
  getFactoryAddress,
  getTemplateAddress,
  getRpcUrl,
  getExplorerUrl,
  isSupportedChain,
  isApeChain,
  isPolygonChain,
  getChainName,
  getContracts,
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_TEMPLATE_ADDRESS,
} from './unified';

// Legacy compatibility exports
export const getRaffleFactoryAddress = getFactoryAddress;
export const getRaffleTemplateAddress = getTemplateAddress;
export const isV4Available = () => true; // Always true now
export const getRateLimit = () => 10; // Always 10 seconds for V4