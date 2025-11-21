import { useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

// Enhanced connection persistence with session management
export function useConnectionPersistence() {
  const { isConnected, address, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Store connection state
  useEffect(() => {
    if (isConnected && address && connector) {
      const connectionData = {
        connectorId: connector.id,
        address,
        timestamp: Date.now(),
        sessionActive: true
      };
      localStorage.setItem('walletConnection', JSON.stringify(connectionData));
      localStorage.setItem('lastWalletConnector', connector.id);
      localStorage.setItem('userHasConnected', 'true'); // Track user intent
      
      // Set session timeout (24 hours)
      const sessionTimeout = setTimeout(() => {
        localStorage.removeItem('walletConnection');
      }, 24 * 60 * 60 * 1000);
      
      return () => clearTimeout(sessionTimeout);
    }
  }, [isConnected, address, connector]);
  
  // Auto-reconnect on page load if session is valid (less aggressive)
  useEffect(() => {
    // Only try to reconnect if user explicitly connected before
    const connectionData = localStorage.getItem('walletConnection');
    const hasUserConnected = localStorage.getItem('userHasConnected');
    
    if (connectionData && !isConnected && hasUserConnected) {
      try {
        const { connectorId, timestamp, sessionActive } = JSON.parse(connectionData);
        const isSessionValid = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionActive && isSessionValid) {
          const targetConnector = connectors.find(c => c.id === connectorId);
          if (targetConnector && targetConnector.id === 'injected') {
            // Only auto-reconnect for injected (MetaMask) if it's available
            connect({ connector: targetConnector });
          }
        } else {
          localStorage.removeItem('walletConnection');
        }
      } catch (error) {
        console.warn('Invalid connection data:', error);
        localStorage.removeItem('walletConnection');
      }
    }
  }, [connect, connectors, isConnected]);
  
  // Clean up on disconnect
  useEffect(() => {
    if (!isConnected) {
      localStorage.removeItem('walletConnection');
    }
  }, [isConnected]);
  
  // Enhanced disconnect with cleanup
  const enhancedDisconnect = useCallback(() => {
    localStorage.removeItem('walletConnection');
    localStorage.removeItem('lastWalletConnector');
    localStorage.removeItem('userHasConnected');
    disconnect();
  }, [disconnect]);
  
  return { enhancedDisconnect };
}