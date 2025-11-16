import React from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { apeChain } from '../config/wagmi';

export default function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== apeChain.id;

  const handleConnect = () => {
    const metaMaskConnector = connectors.find(c => c.id === 'metaMask');
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    } else {
      connect({ connector: connectors[0] });
    }
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: apeChain.id });
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
    <button
      onClick={handleConnect}
      disabled={isPending}
      className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}