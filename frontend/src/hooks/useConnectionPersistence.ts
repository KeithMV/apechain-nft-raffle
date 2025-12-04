import { useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { clearWalletStorage } from '../utils/walletUtils';

// Enhanced connection persistence with session management
export function useConnectionPersistence() {
  const { isConnected, address, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Store connection state
  useEffect(() => {
    if (isConnected && address && connector) {
      try {
        const connectionData = {
          connectorId: connector.id,
          address,
          timestamp: Date.now(),
          sessionActive: true
        };
        localStorage.setItem('walletConnection', JSON.stringify(connectionData));
        localStorage.setItem('lastWalletConnector', connector.id);
        localStorage.setItem('userHasConnected', 'true');
      } catch (error) {
        console.warn('Failed to store connection data:', error);
      }
    }
  }, [isConnected, address, connector]);
  
  // Auto-reconnect on page load if session is valid
  useEffect(() => {
    if (isConnected) return; // Already connected
    
    const attemptReconnect = async () => {
      try {
        const connectionData = localStorage.getItem('walletConnection');
        const hasUserConnected = localStorage.getItem('userHasConnected');
        
        if (connectionData && hasUserConnected) {
          const { connectorId, timestamp, sessionActive } = JSON.parse(connectionData);
          const isSessionValid = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
          
          if (sessionActive && isSessionValid) {
            const targetConnector = connectors.find(c => c.id === connectorId);
            if (targetConnector && targetConnector.id === 'injected') {
              // Only auto-reconnect for injected (MetaMask) if it's available
              try {
                await connect({ connector: targetConnector });
              } catch (error: any) {
                console.warn('Auto-reconnect failed:', error);
                clearWalletStorage();
              }
            }
          } else {
            clearWalletStorage();
          }
        }
      } catch (error) {
        console.warn('Invalid connection data:', error);
        clearWalletStorage();
      }
    };
    
    attemptReconnect();
  }, [connect, connectors, isConnected]);
  
  // Clean up on disconnect
  useEffect(() => {
    if (!isConnected) {
      clearWalletStorage();
    }
  }, [isConnected]);
  
  // Enhanced disconnect with cleanup
  const enhancedDisconnect = useCallback(() => {
    clearWalletStorage();
    disconnect();
  }, [disconnect]);
  
  return { enhancedDisconnect };
}