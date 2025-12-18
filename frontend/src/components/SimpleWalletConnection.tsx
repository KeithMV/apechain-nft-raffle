import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { formatAddress } from '../utils/walletUtils';
import toast from 'react-hot-toast';

const APECHAIN_ID = 33139;

export function SimpleWalletConnection() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showWallets, setShowWallets] = useState(false);

  const isWrongNetwork = isConnected && chainId !== APECHAIN_ID;

  const handleConnect = (connector: any) => {
    setShowWallets(false);
    connect({ connector });
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: APECHAIN_ID });
      toast.success('Switched to ApeChain');
    } catch (error) {
      toast.error('Failed to switch network');
    }
  };

  const getWalletIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'metamask': return '🦊';
      case 'coinbase wallet': return '🔵';
      case 'walletconnect': return '📱';
      default: return '💼';
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        {isWrongNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className="px-3 py-2 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
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
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600/50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (showWallets) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-50 min-w-[280px]">
          <div className="text-sm font-medium text-slate-300 mb-3">Choose Wallet:</div>
          
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg mb-2 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <span className="text-xl">{getWalletIcon(connector.name)}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{connector.name}</div>
              </div>
            </button>
          ))}
          
          <button
            onClick={() => setShowWallets(false)}
            className="w-full px-3 py-1 text-slate-400 text-xs mt-2 hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowWallets(true)}
      disabled={isPending}
      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-lg font-bold hover:scale-105 transition-all disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}