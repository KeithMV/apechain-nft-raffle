import { useEffect } from 'react';
import { useAccount } from 'wagmi';

// TypeScript interface for MetaMask
interface MetaMaskEthereum {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
}

export function useMetaMaskSession() {
  const { isConnected, address } = useAccount();

  useEffect(() => {
    if (!isConnected || !address || typeof window === 'undefined' || !(window as any).ethereum?.isMetaMask) {
      return;
    }

    // Keep MetaMask session active with periodic checks
    const keepAlive = setInterval(async () => {
      try {
        // Light request to keep session active without triggering password
        await (window as any).ethereum.request({ 
          method: 'eth_accounts' 
        });
      } catch (error) {
        // Log debug info for development
        if (process.env.NODE_ENV === 'development') {
          console.debug('MetaMask keep-alive failed:', error);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(keepAlive);
  }, [isConnected, address]);

  // Request persistent connection permission
  useEffect(() => {
    if (!isConnected || typeof window === 'undefined' || !(window as any).ethereum?.isMetaMask) {
      return;
    }

    // Request permission to stay connected
    (window as any).ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    }).catch((error: any) => {
      // Log permission errors in development only
      if (process.env.NODE_ENV === 'development') {
        console.debug('Permission request failed:', error);
      }
    });
  }, [isConnected]);
}