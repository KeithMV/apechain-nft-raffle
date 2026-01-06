import React, { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { apeChain } from '../config/wagmi';
import { MobileWalletConnect } from './MobileWalletConnect';

export function WalletConnection() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);

  const isWrongNetwork = isConnected && chainId !== apeChain.id;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const hasWallet = !!window.ethereum;

  // Connection timeout handler
  useEffect(() => {
    if (isConnecting || isReconnecting) {
      setConnectionTimeout(false);
      const timeout = setTimeout(() => {
        setConnectionTimeout(true);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    } else {
      setConnectionTimeout(false);
    }
  }, [isConnecting, isReconnecting]);

  // Ultra-aggressive connection optimization - removed for mobile compatibility
  useEffect(() => {
    // Simple connection detection for mobile
    const detectConnection = () => {
      if (!isConnected && window.ethereum?.selectedAddress && !isConnecting) {
        window.dispatchEvent(new Event('focus'));
      }
    };
    
    window.addEventListener('focus', detectConnection);
    
    return () => {
      window.removeEventListener('focus', detectConnection);
    };
  }, [isConnected, isConnecting]);

  const handleConnect = async () => {
    try {
      open();
    } catch (err) {
      console.error('Failed to connect:', err);
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

  if ((isConnecting || isReconnecting) && !connectionTimeout && !isMobile) {
    return (
      <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 min-h-[44px]">
        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
        <span className="text-slate-300 text-xs sm:text-sm font-mono">
          {isReconnecting ? 'Reconnecting...' : 'Connecting...'}
        </span>
      </div>
    );
  }

  // Show mobile wallet options if needed
  if (showMobileOptions) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMobileOptions(false)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 rounded-full text-slate-300 text-xs flex items-center justify-center z-10"
        >
          ×
        </button>
        <MobileWalletConnect />
      </div>
    );
  }

  // Show retry button if connection timed out
  if (connectionTimeout) {
    return (
      <div className="flex flex-col space-y-2">
        <button
          onClick={handleConnect}
          className="px-3 sm:px-4 py-2 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500/30 transition-colors min-h-[44px] whitespace-nowrap"
        >
          Retry Connection
        </button>
        <div className="text-xs text-slate-400 text-center">
          Mobile: {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Yes' : 'No'}<br/>
          MetaMask: {window.ethereum?.isMetaMask ? 'Yes' : 'No'}
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
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
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleConnect}
        className="relative px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 border border-pink-400 text-white rounded-lg text-xs sm:text-sm font-bold hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-300 min-h-[44px] whitespace-nowrap shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 hover:scale-105 active:scale-95 active:shadow-inner overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500"></div>
        <span className="relative">
          Connect Wallet
        </span>
      </button>
      <div className="text-xs text-slate-400 text-center">
        Mobile: {isMobile ? 'YES' : 'NO'} | Wallet: {hasWallet ? 'YES' : 'NO'}
      </div>
    </div>
  );
}