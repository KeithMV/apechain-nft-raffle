/**
 * Minimal wallet connection without Web3Modal bloat
 * Reduces bundle size by ~2MB
 */
import React from 'react';
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { metaMaskConnector } from '../config/wagmi';

export default function MinimalWalletConnection() {
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();

  const handleConnect = async () => {
    try {
      await connect({ 
        connector: metaMaskConnector
      });
    } catch (err) {
      console.error('Wallet connection failed:', err);
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
          className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={handleConnect}
        disabled={isPending}
        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && (
        <div className="text-red-400 text-sm">
          Connection failed. Please try again.
        </div>
      )}
    </div>
  );
}