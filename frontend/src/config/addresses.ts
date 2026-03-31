/**
 * Contract Addresses - Unified Configuration
 * Re-exports from unified config for backward compatibility
 */

import { getChainConfig as getChainConfigInternal } from './unified';

// Re-export everything from unified config
export {
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
export const getRaffleFactoryAddress = (chainId?: number) => {
  const config = getChainConfigInternal(chainId);
  return config.contracts.factory;
};
export const getRaffleTemplateAddress = (chainId?: number) => {
  const config = getChainConfigInternal(chainId);
  return config.contracts.template;
};
export const isV4Available = () => true; // Always true now
export const getRateLimit = () => 10; // Always 10 seconds for V4