import React, { useState } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain, useConnect } from 'wagmi';
import { apeChain, metaMaskConnector } from '../config/wagmi';

export default function ApeChainWalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { connect, isPending } = useConnect();
  const [showWallets, setShowWallets] = useState(false);

  const isWrongNetwork = isConnected && chainId !== apeChain.id;

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: apeChain.id });
    } catch (err) {
      console.error('Network switch failed:', err);
    }
  };

  const handleConnectMetaMask = async () => {
    try {
      await connect({ connector: metaMaskConnector });
      setShowWallets(false);
    } catch (err) {
      console.error('MetaMask connection failed:', err);
    }
  };

  const handleConnectWalletConnect = async () => {
    alert('Mobile wallets temporarily unavailable');
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

  if (showWallets) {
    return (
      <div className="relative">
        <div className="absolute top-0 right-0 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl z-50 min-w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Connect Wallet</h3>
            <button
              onClick={() => setShowWallets(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleConnectMetaMask}
              disabled={isPending}
              className="w-full flex items-center space-x-3 p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">🦊</span>
              <div className="text-left">
                <div className="text-white font-medium">MetaMask</div>
                <div className="text-slate-400 text-sm">Desktop & Mobile</div>
              </div>
            </button>

            <button
              onClick={handleConnectWalletConnect}
              disabled={true}
              className="w-full flex items-center space-x-3 p-3 bg-slate-700/20 rounded-lg opacity-50 cursor-not-allowed"
            >
              <span className="text-2xl">📱</span>
              <div className="text-left">
                <div className="text-white font-medium">Mobile Wallets</div>
                <div className="text-slate-400 text-sm">Temporarily Unavailable</div>
              </div>
            </button>
          </div>

          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="text-emerald-300 text-sm font-medium mb-1">✅ ApeChain Compatible</div>
            <div className="text-emerald-200 text-xs">
              These 4 wallets have been tested and verified to work with ApeChain. 
              Choose the wallet app you have installed.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowWallets(true)}
      disabled={isPending}
      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-xs sm:text-sm font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[44px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105 disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}