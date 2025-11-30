import { useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { metaMaskConnector, walletConnectConnector } from '../config/wagmi';
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

  const handleConnect = useCallback(async () => {
    try {
      setConnectionError(null);
      
      if (walletConnectionService.isMetaMaskAvailable()) {
        walletConnectionService.logConnectionAttempt('MetaMask');
        await connect({ connector: metaMaskConnector });
        walletConnectionService.logConnectionSuccess('MetaMask');
      } else {
        walletConnectionService.logConnectionAttempt('WalletConnect');
        await connect({ connector: walletConnectConnector });
        walletConnectionService.logConnectionSuccess('WalletConnect');
      }
    } catch (error) {
      const connectionError = walletConnectionService.formatConnectionError(error as Error);
      setConnectionError(connectionError);
      walletConnectionService.logConnectionError(error as Error, 'Wallet');
    }
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    setConnectionError(null);
    disconnect();
  }, [disconnect]);

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
    disconnect: handleDisconnect,
    switchNetwork: handleSwitchNetwork,
    isWrongNetwork: connectionState === ConnectionState.WRONG_NETWORK,
    isConnecting: connectionState === ConnectionState.CONNECTING
  };
}