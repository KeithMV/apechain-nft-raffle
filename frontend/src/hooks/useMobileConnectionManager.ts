import { useEffect, useRef, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import toast from 'react-hot-toast';

interface MobileConnectionState {
  isConnecting: boolean;
  connectionAttempts: number;
  lastConnectionTime: number;
  hasWebSocketError: boolean;
}

export function useMobileConnectionManager() {
  const { isConnected, address, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  
  const connectionState = useRef<MobileConnectionState>({
    isConnecting: false,
    connectionAttempts: 0,
    lastConnectionTime: 0,
    hasWebSocketError: false,
  });

  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Monitor for WebSocket errors and handle recovery
  useEffect(() => {
    if (!isMobile()) return;
    
    const handleWebSocketError = (event: any) => {
      console.warn('🔌 [MOBILE] WebSocket error detected:', event);
      connectionState.current.hasWebSocketError = true;
      
      // If connected but having WebSocket issues, try to reconnect
      if (isConnected && connector) {
        console.log('🔄 [MOBILE] Attempting to recover from WebSocket error...');
        setTimeout(() => {
          disconnect();
          setTimeout(() => {
            // Let user manually reconnect via Web3Modal
            toast.error('Connection lost. Please reconnect your wallet.');
          }, 2000);
        }, 1000);
      }
    };
    
    // Listen for WebSocket errors in the console
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('WebSocket') || message.includes('relay.walletconnect.org')) {
        handleWebSocketError({ message });
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, [isConnected, connector, disconnect, isMobile]);

  // Handle page visibility changes (mobile app switching)
  useEffect(() => {
    if (!isMobile()) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        console.log('🔄 [MOBILE] Page became visible, connection may have been lost');
        // Don't auto-reconnect, let user do it manually
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, isMobile]);

  return {
    isMobileDevice: isMobile(),
    isConnecting: isPending,
    connectionAttempts: connectionState.current.connectionAttempts,
    hasWebSocketError: connectionState.current.hasWebSocketError,
    canRetry: connectionState.current.connectionAttempts < 3,
  };
}

export function handleMobileWalletConnectError(error: any) {
  console.error('🔌 [MOBILE] WalletConnect Error:', error);
  
  if (error.message?.includes('WebSocket')) {
    toast.error('Network connection issue. Please check your internet connection.');
    return 'websocket_error';
  }
  
  if (error.message?.includes('User rejected')) {
    toast.error('Connection cancelled.');
    return 'user_rejected';
  }
  
  if (error.message?.includes('Missing or invalid')) {
    toast.error('Wallet connection issue. Please try again.');
    return 'invalid_payload';
  }
  
  if (error.message?.includes('network connection was lost')) {
    toast.error('Network connection lost. Please check your internet.');
    return 'network_lost';
  }
  
  toast.error('Connection failed. Please try again.');
  return 'unknown_error';
}

export function getMobileConnectionDiagnostics() {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid;
  
  return {
    userAgent,
    isIOS,
    isAndroid,
    isMobile,
    hasEthereum: typeof window !== 'undefined' && !!window.ethereum,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    onLine: navigator.onLine,
  };
}