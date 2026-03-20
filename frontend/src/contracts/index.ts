/**
 * Contract Index
 * Unified exports for all contract ABIs and configurations
 */

// Types
export * from './types';

// Factory Contracts
export { 
  RAFFLE_FACTORY_V3_ABI,
  RAFFLE_FACTORY_V4_ABI,
  RAFFLE_FACTORY_ABI // Default V3 for backward compatibility
} from './factory';

// Raffle Contracts
export { RAFFLE_CONTRACT_ABI } from './raffle';

// NFT Contracts
export { ERC721_ABI } from './erc721';

// Token Contracts
export { 
  ERC20_ABI,
  APE_TOKEN_ABI,
  TOKEN_ADDRESSES
} from './tokens';

// Lazy loading functions for better performance
export const loadFactoryABI = async (version: 'v3' | 'v4' = 'v4') => {
  const { RAFFLE_FACTORY_V3_ABI, RAFFLE_FACTORY_V4_ABI } = await import('./factory');
  return version === 'v4' ? RAFFLE_FACTORY_V4_ABI : RAFFLE_FACTORY_V3_ABI;
};

export const loadRaffleABI = async () => {
  const { RAFFLE_CONTRACT_ABI } = await import('./raffle');
  return RAFFLE_CONTRACT_ABI;
};

export const loadERC721ABI = async () => {
  const { ERC721_ABI } = await import('./erc721');
  return ERC721_ABI;
};

export const loadTokenABI = async (type: 'erc20' | 'ape' = 'erc20') => {
  const { ERC20_ABI, APE_TOKEN_ABI } = await import('./tokens');
  return type === 'ape' ? APE_TOKEN_ABI : ERC20_ABI;
};