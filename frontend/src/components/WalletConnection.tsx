import React, { useEffect } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { apeChain } from '../config/wagmi';

export function WalletConnection() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();

  const isWrongNetwork = isConnected && chainId !== apeChain.id;

  // Optimize reconnection after MetaMask approval
  useEffect(() => {
    if (isConnecting || isReconnecting) {
      // Force a faster check when connecting/reconnecting
      const checkConnection = () => {
        if (window.ethereum && window.ethereum.selectedAddress) {
          // Connection exists, force wagmi to recognize it faster
          window.dispatchEvent(new Event('focus'));
        }
      };
      
      const timeoutId = setTimeout(checkConnection, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isConnecting, isReconnecting]);

  const handleConnect = () => {
    console.log('Opening Web3Modal...');
    // Mobile optimization: Add slight delay to prevent double-tap issues
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      setTimeout(() => open(), 100);
    } else {
      open();
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: apeChain.id });
    } catch (err) {
      console.error('Network switch failed:', err);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnecting || isReconnecting) {
    return (
      <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 min-h-[44px]">
        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
        <span className="text-slate-300 text-xs sm:text-sm font-mono">
          {isReconnecting ? 'Reconnecting...' : 'Connecting...'}
        </span>
      </div>
    );
  }

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

  return (
    <button
      onClick={handleConnect}
      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-xs sm:text-sm font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[44px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105"
    >
      Connect Wallet
    </button>
  );
}