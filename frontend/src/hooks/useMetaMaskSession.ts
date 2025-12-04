import { useEffect } from 'react';
import { useAccount } from 'wagmi';

export function useMetaMaskSession() {
  const { isConnected, address } = useAccount();

  useEffect(() => {
    if (isConnected && address && typeof window !== 'undefined' && window.ethereum) {
      // Keep MetaMask session active with periodic checks
      const keepAlive = setInterval(async () => {
        try {
          // Light request to keep session active without triggering password
          await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
        } catch (error) {
          // Silently handle errors to avoid console spam
        }
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => clearInterval(keepAlive);
    }
  }, [isConnected, address]);

  // Request persistent connection permission
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && isConnected) {
      // Request permission to stay connected
      window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      }).catch(() => {
        // Ignore permission errors - user might have already granted
      });
    }
  }, [isConnected]);
}