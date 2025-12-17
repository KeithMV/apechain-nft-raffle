import { SecurityUtils } from './security';

// Utility functions for wallet operations
export const formatAddress = (addr: string): string => {
  if (!addr || typeof addr !== 'string' || !SecurityUtils.validateAddress(addr)) {
    return 'Invalid Address';
  }
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export const clearWalletStorage = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  const keysToRemove = ['walletConnection', 'lastWalletConnector', 'userHasConnected'];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Sanitize key for logging to prevent log injection
      const sanitizedKey = key.replace(/[\r\n\t]/g, '').slice(0, 50);
      console.warn(`Failed to remove ${sanitizedKey} from storage:`, error);
    }
  });
};

export const isMetaMaskAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined' && 
         window.ethereum.isMetaMask;
};

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

export const isMobileWalletApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent;
  return userAgent.includes('MetaMaskMobile') || 
         userAgent.includes('Trust') ||
         userAgent.includes('CoinbaseWallet') ||
         userAgent.includes('Rainbow');
};

export const getMobileWalletDeepLink = (walletName: string): string => {
  const currentUrl = encodeURIComponent(window.location.href);
  
  switch (walletName.toLowerCase()) {
    case 'metamask':
      return `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
    case 'trust':
      return `https://link.trustwallet.com/open_url?coin_id=60&url=${currentUrl}`;
    case 'coinbase':
      return `https://go.cb-w.com/dapp?cb_url=${currentUrl}`;
    case 'rainbow':
      return `https://rnbwapp.com/dapp?url=${currentUrl}`;
    default:
      return window.location.href;
  }
};

interface WalletError {
  code?: number;
  message?: string;
  toString?: () => string;
}

export const getConnectionErrorMessage = (error: WalletError | unknown): string => {
  const errorObj = error as WalletError;
  if (errorObj?.code === 4001) return 'Connection rejected by user';
  if (errorObj?.code === -32002) return 'Connection request already pending';
  
  const message = errorObj?.message || (errorObj?.toString?.() ?? '') || '';
  
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

export const isConnectionError = (error: WalletError | unknown): boolean => {
  if (!error) return false;
  
  const errorObj = error as WalletError;
  const message = errorObj?.message || (errorObj?.toString?.() ?? '') || '';
  return message.includes('WebSocket') ||
         message.includes('network') ||
         message.includes('relay') ||
         message.includes('Failed to fetch') ||
         message.includes('NetworkError') ||
         message.includes('timeout');
};