import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { apeChainMainnet } from '../config/wagmi';
import { NETWORK_CONFIGS } from '../config/addresses';

export default function WalletConnection() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    setIsWrongNetwork(isConnected && chainId !== apeChainMainnet.id);
  }, [isConnected, chainId]);

  const handleConnect = (connectorToUse: any) => {
    connect({ connector: connectorToUse });
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
    <div className="flex items-center space-x-2">
      {connectors.map((connectorItem) => (
        <button
          key={connectorItem.id}
          onClick={() => handleConnect(connectorItem)}
          disabled={isPending}
          className="relative px-4 py-2 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="relative flex items-center space-x-2">
            {connectorItem.name === 'MetaMask' && <span>🦊</span>}
            {connectorItem.name === 'WalletConnect' && <span>🔗</span>}
            {connectorItem.name === 'Injected' && <span>💼</span>}
            <span>{isPending ? 'Connecting...' : `Connect ${connectorItem.name}`}</span>
          </span>
        </button>
      ))}
    </div>
  );
}