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
        message.includes('relay.walletconnect.org')
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
  if (typeof window !== 'undefined') {
    // Clear localStorage
    if (window.localStorage) {
      Object.keys(localStorage).forEach(key => {
        if (
          key.includes('walletconnect') || 
          key.includes('wc@2') || 
          key.includes('wc_') ||
          key.startsWith('@walletconnect')
        ) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Clear sessionStorage
    if (window.sessionStorage) {
      Object.keys(sessionStorage).forEach(key => {
        if (
          key.includes('walletconnect') || 
          key.includes('wc@2') || 
          key.includes('wc_') ||
          key.startsWith('@walletconnect')
        ) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }
};