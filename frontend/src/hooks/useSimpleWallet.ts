import { useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { metaMaskConnector, coinbaseConnector, injectedConnector, walletConnectConnector } from '../config/wagmi';

const APECHAIN_ID = 33139;

export function useSimpleWallet() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  const isWrongNetwork = isConnected && chainId !== APECHAIN_ID;

  const handleConnect = useCallback(async () => {
    try {
      setError(null);
      
      // Simple auto-detection logic
      if (window.ethereum?.isMetaMask) {
        await connect({ connector: metaMaskConnector });
      } else if (window.ethereum?.isCoinbaseWallet) {
        await connect({ connector: coinbaseConnector });
      } else if (window.ethereum) {
        await connect({ connector: injectedConnector });
      } else {
        await connect({ connector: walletConnectConnector });
      }
    } catch (error: any) {
      setError(error.message || 'Connection failed');
    }
  }, [connect]);

  const handleSwitchNetwork = useCallback(async () => {
    try {
      setError(null);
      await switchChain({ chainId: APECHAIN_ID });
    } catch (error: any) {
      setError('Failed to switch network');
    }
  }, [switchChain]);

  // Clear errors when connected
  useEffect(() => {
    if (isConnected && !isWrongNetwork) {
      setError(null);
    }
  }, [isConnected, isWrongNetwork]);

  return {
    address,
    isConnected,
    isConnecting: isPending,
    isWrongNetwork,
    error,
    connect: handleConnect,
    disconnect,
    switchNetwork: handleSwitchNetwork,
  };
}