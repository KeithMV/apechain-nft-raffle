// Suppress Web3Modal font preload warnings
export const suppressWeb3ModalWarnings = () => {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Suppress Web3Modal font preload warnings
    if (message.includes('was preloaded using link preload but not used') ||
        message.includes('fonts.reown.com') ||
        message.includes('KHTeka-Medium.woff2')) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
};