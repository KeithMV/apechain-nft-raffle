/**
 * Hook Exports
 * Centralized hook exports for better import organization
 */

// Primary Hooks
export { useWalletConnection } from './useWalletConnection';
export { useNFTMetadata } from './useNFTMetadata';
export { useRaffleContract } from './useRaffleContract';
export { useAllRaffles, useUserRafflePositions, useCreatedRaffles, useClearRaffleCache } from './useRafflePositions';

// Specialized Hooks
export { useEmergencySelectWinner, useCommitRandomness, useRevealAndSelectWinner } from './useWinnerSelection';
export { useCancelRaffle } from './useCancelRaffle';
export { useApeBalance, useApeDecimals, useApeSymbol, apeTokenUtils } from './useApeToken';

// Utility Hooks
export { useAutoRefresh } from './useAutoRefresh';
export { useMetaMaskSession } from './useMetaMaskSession';
export { useConnectionPersistence } from './useConnectionPersistence';

// Legacy Hooks (deprecated)
export { useWallet } from './useWallet'; // Use useWalletConnection instead
export { useApeChainConnectors } from './useApeChainConnectors';