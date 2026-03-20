/**
 * Contract ABIs and Configuration for ApeCoin NFT Raffle System
 * Unified exports from modular contract architecture
 */

// Re-export all contracts from the new modular structure
export * from '../contracts';

// Re-export addresses for backward compatibility
export { RAFFLE_FACTORY_ADDRESS } from './addresses';

// Legacy exports for backward compatibility
// These will be deprecated in favor of the new modular imports
export {
  RAFFLE_FACTORY_V3_ABI as BASE_RAFFLE_SYSTEM_ABI,
  RAFFLE_FACTORY_V3_ABI as RAFFLE_FACTORY_ABI,
  RAFFLE_CONTRACT_ABI,
  ERC721_ABI,
  APE_TOKEN_ABI
} from '../contracts';

// APE Token Configuration (for backward compatibility)
export const APE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // Native token