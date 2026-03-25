// Suppress WalletConnect console errors
export const suppressWalletConnectErrors = () => {
  if (typeof window !== 'undefined') {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      // Suppress known WalletConnect errors
      if (
        message.includes('No matching key') ||
        message.includes('session topic doesn\'t exist') ||
        message.includes('Pending session not found') ||
        message.includes('WalletConnect Core is already initialized') ||
        message.includes('Ue: Unexpected error') ||
        message.includes('evmAsk.js') ||
        message.includes('selectExtension') ||
        message.includes('r.request') ||
        message.includes('r.selectExtension') ||
        message.includes('Unexpected error at r.request') ||
        message.includes('wallet_requestPermissions') ||
        message.includes('MetaMask - RPC Error') ||
        message.includes('Unhandled Promise Rejection') ||
        message.includes('WebSocket connection') ||
        message.includes('relay.walletconnect.org') ||
        message.includes('searchWalletByIds') ||
        message.includes('HTTP status code: 400') ||
        message.includes('fetchData') ||
        message.includes('FetchUtil.get')
      ) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      // Suppress known warnings
      if (
        message.includes('Ethereum provider not available') ||
        message.includes('WalletConnect Core is already initialized') ||
        message.includes('sourcesContent') ||
        message.includes('Source Map') ||
        message.includes('has invalid')
      ) {
        return; // Suppress these warnings
      }
      originalWarn.apply(console, args);
    };
  }
};

// Clean all WalletConnect storage
export const cleanWalletConnectStorage = () => {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage safely
  if (window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('walletconnect') || 
          key.includes('wc@2') || 
          key.includes('wc_') ||
          key.startsWith('@walletconnect')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore individual removal errors
        }
      });
    } catch (error) {
      console.warn('Failed to clean localStorage:', error);
    }
  }
  
  // Clear sessionStorage safely
  if (window.sessionStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.includes('walletconnect') || 
          key.includes('wc@2') || 
          key.includes('wc_') ||
          key.startsWith('@walletconnect')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          // Ignore individual removal errors
        }
      });
    } catch (error) {
      console.warn('Failed to clean sessionStorage:', error);
    }
  }
};