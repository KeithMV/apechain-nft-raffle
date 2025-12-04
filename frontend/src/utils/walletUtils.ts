// Utility functions for wallet operations
export const formatAddress = (addr: string): string => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export const clearWalletStorage = (): void => {
  try {
    localStorage.removeItem('walletConnection');
    localStorage.removeItem('lastWalletConnector');
    localStorage.removeItem('userHasConnected');
  } catch (error) {
    console.warn('Failed to clear wallet storage:', error);
  }
};

export const isMetaMaskAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined' && 
         window.ethereum.isMetaMask;
};

export const getConnectionErrorMessage = (error: any): string => {
  if (error?.code === 4001) return 'Connection rejected by user';
  if (error?.code === -32002) return 'Connection request already pending';
  
  const message = error?.message || error?.toString() || '';
  
  if (message.includes('WebSocket') || message.includes('network connection was lost')) {
    return 'Network connection lost - check your internet';
  }
  
  if (message.includes('relay.walletconnect.org')) {
    return 'WalletConnect service temporarily unavailable';
  }
  
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Network error - please try again';
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Connection timed out - please try again';
  }
  
  if (message.includes('network')) return 'Network connection failed';
  
  return message || 'Connection failed';
};

export const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message || error.toString();
  return message.includes('WebSocket') ||
         message.includes('network') ||
         message.includes('relay') ||
         message.includes('Failed to fetch') ||
         message.includes('NetworkError') ||
         message.includes('timeout');
};