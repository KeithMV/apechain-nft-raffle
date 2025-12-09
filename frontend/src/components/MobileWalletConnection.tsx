import React from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { metaMaskConnector } from '../config/wagmi';

export default function MobileWalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  const handleConnect = async () => {
    try {
      // Direct MetaMask connection - triggers mobile app redirect
      await connect({ 
        connector: metaMaskConnector
      });
    } catch (error) {
      console.error('MetaMask connection failed:', error);
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-emerald-300 font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-600/50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-xs sm:text-sm font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[44px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105"
    >
      Connect Wallet
    </button>
  );
}