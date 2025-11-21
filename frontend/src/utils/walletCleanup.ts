/**
 * Utility to clean up stale WalletConnect sessions
 * Fixes the session errors and multiple initialization issues
 */

export const clearWalletConnectSessions = () => {
  try {
    // Clear WalletConnect related localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('wc@2:') ||
        key.startsWith('@walletconnect') ||
        key.includes('walletconnect') ||
        key.includes('wc_')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`🧹 Cleared ${keysToRemove.length} stale WalletConnect sessions`);
  } catch (error) {
    console.warn('Failed to clear WalletConnect sessions:', error);
  }
};

export const initializeCleanWalletConnect = () => {
  // Clear stale sessions on app start
  clearWalletConnectSessions();
  
  // Set up periodic cleanup (every 30 minutes)
  setInterval(clearWalletConnectSessions, 30 * 60 * 1000);
};