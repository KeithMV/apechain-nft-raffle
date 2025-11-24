/**
 * Professional mobile detection and wallet compatibility utilities
 * Industry standard patterns for cross-platform Web3 applications
 */

// Detect mobile Safari specifically
export const isMobileSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isMobile = /iPhone|iPad|iPod/.test(userAgent);
  
  return isSafari && isMobile;
};

// Detect any mobile browser
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;
};

// Check if wallet provider is available
export const isWalletAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return !!(window as any).ethereum;
};

// Professional mobile wallet compatibility check
export const getMobileWalletCompatibility = () => {
  const mobile = isMobile();
  const mobileSafari = isMobileSafari();
  const walletAvailable = isWalletAvailable();
  
  return {
    isMobile: mobile,
    isMobileSafari: mobileSafari,
    hasWallet: walletAvailable,
    requiresSpecialHandling: mobileSafari && walletAvailable
  };
};