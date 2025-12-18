import React from 'react';
import { useSimpleWallet } from '../hooks/useSimpleWallet';
import { formatAddress } from '../utils/walletUtils';
import toast from 'react-hot-toast';

export function MinimalWalletConnection() {
  const {
    address,
    isConnected,
    isConnecting,
    isWrongNetwork,
    error,
    connect,
    disconnect,
    switchNetwork,
  } = useSimpleWallet();

  const handleConnect = async () => {
    try {
      console.log('Wallet detection:', {
        hasEthereum: !!window.ethereum,
        isMetaMask: window.ethereum?.isMetaMask,
        isCoinbase: window.ethereum?.isCoinbaseWallet,
        providers: window.ethereum?.providers?.length || 0
      });
      await connect();
      toast.success('Wallet connected!');
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Connection failed');
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
      toast.success('Switched to ApeChain');
    } catch (error) {
      toast.error('Failed to switch network');
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

  return (
    <div className="flex flex-col items-end space-y-2">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-lg font-bold hover:scale-105 transition-all disabled:opacity-50"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      {error && (
        <div className="text-xs text-red-400 max-w-[200px] text-right">
          {error}
        </div>
      )}
    </div>
  );
}