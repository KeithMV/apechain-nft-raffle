/**
 * Mobile wallet compatibility fixes
 * Handles getChainId errors and other mobile-specific issues
 */

import { useAccount, useChainId } from 'wagmi';

// Mobile-safe chain ID getter
export const getMobileChainId = () => {
  try {
    // Try wagmi hook first
    const chainId = useChainId();
    if (chainId) return chainId;
  } catch (error) {
    console.warn('Wagmi chainId failed, trying fallback');
  }

  try {
    // Fallback to direct ethereum provider
    if (typeof window !== 'undefined' && window.ethereum) {
      return parseInt(window.ethereum.chainId || '0x1', 16);
    }
  } catch (error) {
    console.warn('Direct ethereum chainId failed');
  }

  // Default to ApeChain
  return 33139;
};

// Mobile-safe account getter
export const getMobileAccount = () => {
  try {
    const { address, connector } = useAccount();
    return { address, connector };
  } catch (error) {
    console.warn('Wagmi account failed, trying fallback');
    
    // Fallback to direct ethereum provider
    if (typeof window !== 'undefined' && window.ethereum?.selectedAddress) {
      return { 
        address: window.ethereum.selectedAddress,
        connector: null 
      };
    }
    
    return { address: undefined, connector: null };
  }
};

// Check if we're on mobile
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;
};

// Mobile-safe connector client getter
export const getMobileConnectorClient = async () => {
  try {
    // Try to get connector client safely
    const { connector } = getMobileAccount();
    
    if (connector && typeof connector.getChainId === 'function') {
      return await connector.getChainId();
    }
    
    // Fallback for mobile
    return getMobileChainId();
  } catch (error) {
    console.warn('Connector client failed, using fallback:', error);
    return getMobileChainId();
  }
};