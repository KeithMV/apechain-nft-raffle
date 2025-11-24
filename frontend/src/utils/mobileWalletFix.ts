/**
 * Mobile wallet compatibility fixes
 * Handles mobile-specific wallet connection issues
 */

import { getAccount, getChainId } from '@wagmi/core';
import { config } from '../config/wagmi-minimal';

// Mobile-safe chain ID getter using wagmi core
export const getMobileChainId = () => {
  try {
    return getChainId(config);
  } catch (error) {
    console.warn('Wagmi chainId failed, trying fallback');
    
    try {
      // Fallback to direct ethereum provider
      if (typeof window !== 'undefined' && window.ethereum) {
        return parseInt(window.ethereum.chainId || '0x811f', 16); // ApeChain hex
      }
    } catch (error) {
      console.warn('Direct ethereum chainId failed');
    }

    // Default to ApeChain
    return 33139;
  }
};

// Mobile-safe account getter using wagmi core
export const getMobileAccount = () => {
  try {
    const account = getAccount(config);
    return { address: account.address };
  } catch (error) {
    console.warn('Wagmi account failed, trying fallback');
    
    // Fallback to direct ethereum provider
    if (typeof window !== 'undefined' && window.ethereum?.selectedAddress) {
      return { 
        address: window.ethereum.selectedAddress as `0x${string}`
      };
    }
    
    return { address: undefined };
  }
};

// Check if we're on mobile
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;
};

// Mobile-safe chain validation
export const validateMobileChain = async (): Promise<boolean> => {
  try {
    const chainId = getMobileChainId();
    return chainId === 33139;
  } catch (error) {
    console.warn('Chain validation failed:', error);
    return false;
  }
};