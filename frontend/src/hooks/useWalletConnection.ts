import { useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { metaMaskConnector, coinbaseConnector, injectedConnector, walletConnectConnector } from '../config/wagmi';
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
      
      // Auto-detect best wallet (working 4-connector logic)
      if (walletConnectionService.isMetaMaskAvailable()) {
        walletConnectionService.logConnectionAttempt('MetaMask');
        await connect({ connector: metaMaskConnector });
        walletConnectionService.logConnectionSuccess('MetaMask');
      } else if (window.ethereum?.isCoinbaseWallet) {
        walletConnectionService.logConnectionAttempt('Coinbase');
        await connect({ connector: coinbaseConnector });
        walletConnectionService.logConnectionSuccess('Coinbase');
      } else if (window.ethereum) {
        walletConnectionService.logConnectionAttempt('Injected');
        await connect({ connector: injectedConnector });
        walletConnectionService.logConnectionSuccess('Injected');
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
    availableConnectors: { metaMaskConnector, coinbaseConnector, injectedConnector, walletConnectConnector },

    switchNetwork: handleSwitchNetwork,
    isWrongNetwork: connectionState === ConnectionState.WRONG_NETWORK,
    isConnecting: connectionState === ConnectionState.CONNECTING
  };
}