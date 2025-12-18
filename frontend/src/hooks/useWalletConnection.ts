import { useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
// Web3Modal handles all connectors automatically
import { walletConnectionService, ConnectionState, ConnectionError } from '../services/walletConnectionService';

const APECHAIN_ID = 33139;

export function useWalletConnection() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);

  const connectionState = walletConnectionService.getConnectionState(
    isConnected, 
    isPending, 
    chainId, 
    APECHAIN_ID
  );

  const handleConnect = useCallback(async (preferredConnector?: any) => {
    try {
      setConnectionError(null);
      
      // Use preferred connector if provided
      if (preferredConnector) {
        await connect({ connector: preferredConnector });
        return;
      }
      
      // Web3Modal handles all wallet detection and connection
      throw new Error('Use Web3Modal for wallet connections');
    } catch (error) {
      const connectionError = walletConnectionService.formatConnectionError(error as Error);
      setConnectionError(connectionError);
      walletConnectionService.logConnectionError(error as Error, 'Wallet');
    }
  }, [connect]);



  const handleSwitchNetwork = useCallback(async () => {
    try {
      setConnectionError(null);
      await switchChain({ chainId: APECHAIN_ID });
    } catch (error) {
      const connectionError = walletConnectionService.formatConnectionError(error as Error);
      setConnectionError(connectionError);
    }
  }, [switchChain]);

  // Clear errors when connection state changes
  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED) {
      setConnectionError(null);
    }
  }, [connectionState]);

  return {
    address,
    isConnected,
    connectionState,
    connectionError,
    connect: handleConnect,
    connectWith: (connector: any) => handleConnect(connector),
    // Web3Modal handles all connectors

    switchNetwork: handleSwitchNetwork,
    isWrongNetwork: connectionState === ConnectionState.WRONG_NETWORK,
    isConnecting: connectionState === ConnectionState.CONNECTING
  };
}