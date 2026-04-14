/**
 * SIMPLE CHAIN UTILITIES
 * Direct chain utilities without complex abstractions
 * 
 * Expert Collaboration:
 * - Code Reviewer: Simple, focused functions
 * - Debug Expert: Clear error handling and logging
 * - Web3 Expert: Reliable chain detection and switching
 */

import { useChainId, useSwitchChain } from 'wagmi';
import { apeChain, polygon, getContractAddresses, isSupportedChain, getChainName, logChainInfo } from '../config/wagmi';

// =============================================================================
// CHAIN UTILITIES (Code Reviewer: Simple, single-purpose functions)
// =============================================================================

/**
 * Get current chain information
 */
export function useSimpleChainConfig() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Debug Expert: Log chain info when enabled
  if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
    logChainInfo(chainId);
  }

  return {
    // Current chain info
    chainId,
    chainName: getChainName(chainId),
    isSupported: isSupportedChain(chainId),
    
    // Chain checks
    isApeChain: chainId === apeChain.id,
    isPolygon: chainId === polygon.id,
    
    // Contract addresses
    contracts: getContractAddresses(chainId),
    
    // Chain switching (Web3 Expert: Simple, reliable switching)
    switchToApeChain: () => {
      if (chainId !== apeChain.id) {
        switchChain({ chainId: apeChain.id });
      }
    },
    switchToPolygon: () => {
      if (chainId !== polygon.id) {
        switchChain({ chainId: polygon.id });
      }
    },
    
    // Available chains
    supportedChains: [apeChain, polygon],
  };
}

/**
 * Simple chain detection (Web3 Expert: Reliable mobile detection)
 */
export function useChainDetection() {
  const chainId = useChainId();
  
  return {
    chainId,
    isApeChain: chainId === 33139,
    isPolygon: chainId === 137,
    isSupported: chainId === 33139 || chainId === 137,
    chainName: chainId === 33139 ? 'ApeChain' : chainId === 137 ? 'Polygon' : 'Unknown',
  };
}

/**
 * Get factory address for current chain (Code Reviewer: Direct, simple)
 */
export function useFactoryAddress() {
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  return contracts.factory;
}

/**
 * Debug Expert: Simple error boundary for chain operations
 */
export function handleChainError(error: any, operation: string) {
  if (process.env.REACT_APP_ENABLE_LOGGING === 'true') {
    console.error(`❌ Chain operation failed: ${operation}`, error);
  }
  
  // Return user-friendly error message
  if (error?.message?.includes('User rejected')) {
    return 'User cancelled the operation';
  }
  
  if (error?.message?.includes('Chain not configured')) {
    return 'Please add this network to your wallet';
  }
  
  return 'Network operation failed. Please try again.';
}