import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import type { Connector } from 'wagmi';
import { apeChain } from '../config/wagmi';

export default function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showConnectors, setShowConnectors] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const isWrongNetwork = isConnected && chainId !== apeChain.id;

  const handleConnect = async (connector: Connector) => {
    try {
      setConnectionError(null);
      console.log('Attempting to connect with:', connector.name);
      await connect({ connector });
      setShowConnectors(false);
    } catch (err) {
      console.error('Connection error:', err);
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
      <div className="flex items-center space-x-3">
        {isWrongNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className="px-4 py-2 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            Switch to ApeChain
          </button>
        )}
        
        <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-slate-300 text-sm font-mono">
            {address ? formatAddress(address) : ''}
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

  if (showConnectors) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 bg-slate-800/90 border border-slate-700/50 rounded-lg p-3 min-w-48 z-50">
          <div className="text-slate-300 text-xs font-medium mb-2">Choose Wallet:</div>
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded text-sm hover:bg-slate-600/50 transition-colors disabled:opacity-50 text-left mb-1"
            >
              {connector.name}
            </button>
          ))}
          <button
            onClick={() => setShowConnectors(false)}
            className="w-full px-3 py-1 text-slate-400 text-xs hover:text-slate-300 transition-colors mt-2"
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
        <div className="text-red-400 text-xs max-w-xs text-right">
          {connectionError || error?.message}
        </div>
      )}
      <button
        onClick={() => setShowConnectors(true)}
        disabled={isPending}
        className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}