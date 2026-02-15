// Suppress all development warnings and logs
export const suppressWeb3ModalWarnings = () => {
  const originalWarn = console.warn;
  const originalLog = console.log;
  
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