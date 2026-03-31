// Suppress all development warnings and logs
export const suppressWeb3ModalWarnings = () => {
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalError = console.error;
  
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Suppress Web3Modal font preload warnings
    if (message.includes('was preloaded using link preload but not used') ||
        message.includes('fonts.reown.com') ||
        message.includes('KHTeka-Medium.woff2') ||
        message.includes('Lit is in dev mode') ||
        message.includes('Multiple versions of Lit loaded') ||
        message.includes('Download the React DevTools')) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Suppress Web3Modal API errors (400 status codes) - but log them in development
    if (message.includes('HTTP status code: 400') ||
        message.includes('api.web3modal.org') ||
        message.includes('getWallets') ||
        message.includes('searchWalletByIds') ||
        message.includes('FetchUtil.get') ||
        message.includes('HTTP request failed') && message.includes('Status: 401') ||
        message.includes('polygon-rpc.com') ||
        message.includes('API key disabled') ||
        message.includes('CORS policy') ||
        message.includes('walletconnect.org') ||
        message.includes('Failed to load resource')) {
      // In development, show a simplified warning instead of hiding completely
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 [WEB3MODAL] API call failed (this is normal in development)');
      }
      return;
    }
    
    originalError.apply(console, args);
  };
  
  // Suppress vendor logging in production
  if (process.env.NODE_ENV === 'production') {
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('LaunchDarkly') ||
          message.includes('Event received') ||
          message.includes('SES Removing')) {
        return;
      }
      originalLog.apply(console, args);
    };
  }
};