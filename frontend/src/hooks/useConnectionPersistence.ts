import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';

export function useConnectionPersistence() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  useEffect(() => {
    const lastConnector = localStorage.getItem('lastWalletConnector');
    
    if (lastConnector && !isConnected) {
      const connector = connectors.find(c => c.id === lastConnector);
      if (connector) {
        connect({ connector });
      }
    }
  }, [connect, connectors, isConnected]);
  
  useEffect(() => {
    if (isConnected) {
      const currentConnector = connectors.find(c => c.id);
      if (currentConnector) {
        localStorage.setItem('lastWalletConnector', currentConnector.id);
      }
    } else {
      localStorage.removeItem('lastWalletConnector');
    }
  }, [isConnected, connectors]);
}