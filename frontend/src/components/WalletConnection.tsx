import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { apeChainMainnet, isMobileDevice } from '../config/wagmi';

export default function WalletConnection() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showConnectors, setShowConnectors] = useState(false);

  useEffect(() => {
    setIsWrongNetwork(isConnected && chainId !== apeChainMainnet.id);
    if (error) {
      setConnectionError(error.message);
    }
  }, [isConnected, chainId, error]);

  useEffect(() => {
    if (isConnected) {
      setConnectionError(null);
      setShowConnectors(false);
    }
  }, [isConnected]);

  const handleConnect = async (selectedConnector?: any) => {
    try {
      setConnectionError(null);
      const connectorToUse = selectedConnector || getBestConnector();
      
      if (!connectorToUse) {
        throw new Error('No wallet found. Please install MetaMask or use WalletConnect.');
      }
      
      await connect({ connector: connectorToUse });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      
      // Handle specific mobile Safari issues
      if (errorMessage.includes('provider not found') && isMobileDevice()) {
        setConnectionError('Please use a Web3 browser like MetaMask mobile or Trust Wallet.');
      } else {
        setConnectionError(errorMessage);
      }
    }
  };

  const getBestConnector = () => {
    if (connectors.length === 0) return null;
    
    if (isMobileDevice()) {
      // Mobile: prioritize WalletConnect
      return connectors.find(c => c.id === 'walletConnect') || connectors[0];
    }
    
    // Desktop: prefer injected (MetaMask) if available
    return connectors.find(c => c.id === 'injected') || connectors[0];
  };

  const handleSwitchToApeChain = () => {
    switchChain({ chainId: apeChainMainnet.id });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        {isWrongNetwork && (
          <button
            onClick={handleSwitchToApeChain}
            className="px-4 py-2 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            Switch to ApeChain
          </button>
        )}
        
        <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-slate-300 text-sm font-mono">
            {formatAddress(address!)}
          </span>
        </div>
        
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600/50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      {connectionError && (
        <div className="text-red-400 text-xs max-w-xs text-right">
          {connectionError}
        </div>
      )}
      
      {!showConnectors ? (
        <div className="flex flex-col items-end space-y-2">
          <button
            onClick={() => isMobileDevice() ? setShowConnectors(true) : handleConnect()}
            disabled={isPending}
            className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {isMobileDevice() && connectors.length === 0 && (
            <div className="text-xs text-slate-400 max-w-xs text-right">
              Please use MetaMask app or Trust Wallet browser
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col space-y-2 bg-slate-800/90 border border-slate-700/50 rounded-lg p-3 min-w-48">
          <div className="text-slate-300 text-xs font-medium mb-1">Choose Wallet:</div>
          {connectors.filter(c => c.id !== 'injected' || typeof window !== 'undefined' && window.ethereum).map((connector) => (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded text-sm hover:bg-slate-600/50 transition-colors disabled:opacity-50 text-left"
            >
              {connector.name}
            </button>
          ))}
          <button
            onClick={() => setShowConnectors(false)}
            className="px-3 py-1 text-slate-400 text-xs hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}