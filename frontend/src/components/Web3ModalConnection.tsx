import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import type { Connector } from 'wagmi';
import { apeChain } from '../config/wagmi';

export default function Web3ModalConnection() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showConnectors, setShowConnectors] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Debug connector availability
  useEffect(() => {
    if (connectors.length === 0) {
      console.warn('No wallet connectors available');
      setConnectionError('No wallet connectors available');
    } else {
      console.log(`${connectors.length} wallet connectors loaded`);
    }
  }, [connectors]);

  const isWrongNetwork = isConnected && chainId !== apeChain.id;

  const handleConnect = async (connector: Connector) => {
    try {
      setConnectionError(null);
      
      // Validate connector before attempting connection
      if (!connector || !connector.id) {
        throw new Error('Invalid connector');
      }
      
      console.log('Attempting wallet connection');
      await connect({ connector });
      setShowConnectors(false);
      console.log('Wallet connection successful');
    } catch (err) {
      console.error('Wallet connection failed:', err instanceof Error ? err.message : 'Unknown error');
      const message = err instanceof Error ? err.message : 'Connection failed';
      setConnectionError(message);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: apeChain.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network switch failed';
      setConnectionError(message);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        {isWrongNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className="px-3 py-2 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500/30 transition-colors min-h-[44px] whitespace-nowrap"
          >
            Switch to ApeChain
          </button>
        )}
        
        <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 sm:px-3 py-2 min-h-[44px]">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0"></div>
          <span className="text-slate-300 text-xs sm:text-sm font-mono wallet-text">
            {address ? formatAddress(address) : ''}
          </span>
        </div>
        
        <button
          onClick={() => disconnect()}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-600/50 transition-colors min-h-[44px] whitespace-nowrap"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (showConnectors) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 sm:relative sm:right-auto sm:top-auto bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 min-w-48 max-w-[calc(100vw-2rem)] sm:max-w-none z-50 shadow-xl wallet-dropdown">
          <div className="text-slate-300 text-xs font-medium mb-2">Choose Wallet:</div>
          {connectors.length === 0 ? (
            <div className="text-red-400 text-xs p-2 text-center">
              No wallet connectors available
            </div>
          ) : (
            connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={isPending}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded text-sm hover:bg-slate-600/50 transition-colors disabled:opacity-50 text-left mb-1 min-h-[44px] flex items-center"
              >
                {connector.name}
              </button>
            ))
          )}
          <button
            onClick={() => setShowConnectors(false)}
            className="w-full px-3 py-2 text-slate-400 text-xs hover:text-slate-300 transition-colors mt-2 min-h-[36px]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      {(connectionError || error) && (
        <div className="text-red-400 text-xs max-w-[200px] sm:max-w-xs text-right break-words">
          {connectionError || error?.message}
        </div>
      )}
      <button
        onClick={() => setShowConnectors(true)}
        disabled={isPending}
        className="px-3 sm:px-4 py-2 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 min-h-[44px] whitespace-nowrap"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}